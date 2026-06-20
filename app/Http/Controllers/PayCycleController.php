<?php

namespace App\Http\Controllers;

use App\Models\Commitment;
use App\Models\PayPlan;
use App\Models\PaySchedule;
use App\Models\SaverPlan;
use App\Models\User;
use App\Services\UpBankService;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class PayCycleController extends Controller
{
    public function index(Request $request): Response
    {
        $primary = $request->user()
            ->paySchedules()
            ->orderByDesc('is_primary')
            ->orderBy('next_pay_date')
            ->first();

        if (! $primary) {
            return Inertia::render('pay-cycles/index', [
                'hasPrimarySchedule' => false,
                'plan' => null,
                'cycles' => [],
            ]);
        }

        // Build the current period plus several future periods so the user can
        // look ahead. The dropdown selects which one to view.
        $periods = $this->upcomingPeriods($primary, 6);
        $cycles = collect($periods)->map(fn ($p, $i) => [
            'start' => $p[0]->toDateString(),
            'end' => $p[1]->toDateString(),
            'isCurrent' => $i === 0,
        ])->values();

        // Selected period from the query string, defaulting to the current one.
        $selectedStart = $request->query('period');
        $selected = collect($periods)->first(
            fn ($p) => $p[0]->toDateString() === $selectedStart,
        ) ?? $periods[0];

        [$start, $end] = $selected;

        $plan = $this->resolvePlan($primary, $start, $end);

        $hasDate = Schema::hasColumn('pay_plan_allocations', 'date');
        $hasSaver = Schema::hasColumn('pay_plan_allocations', 'saver_plan_id');

        if ($hasDate) {
            $this->backfillDates($plan, $start, $end);
        }

        $persisted = $plan->allocations()
            ->orderBy('type')
            ->orderBy('id')
            ->get();

        $allocations = $persisted->map(function ($a) use ($hasDate, $hasSaver) {
            $saverPlanId = $hasSaver ? $a->saver_plan_id : null;

            return [
                'id' => $a->id,
                'type' => $a->type,
                'label' => $a->label,
                'amount' => (float) $a->amount,
                'date' => $hasDate ? optional($a->date)->toDateString() : null,
                'status' => $a->status,
                'is_recurring' => $a->commitment_id !== null && $saverPlanId === null,
                'is_saver_transfer' => $saverPlanId !== null,
                'materialized' => $saverPlanId !== null,
                'saverPlanId' => $saverPlanId,
            ];
        });

        // Saver transfers are computed each load (not seeded), except plans
        // already materialised (an actual amount recorded) in this cycle.
        $materialised = $hasSaver
            ? $persisted->pluck('saver_plan_id')->filter()->all()
            : [];
        $saverTransfers = $this->saverTransfers($request->user(), $start, $materialised);
        $allocations = $allocations->concat($saverTransfers);

        $inflow = (float) $allocations->where('type', 'inflow')->sum('amount');
        $outflow = (float) $allocations->where('type', 'outflow')->sum('amount');

        return Inertia::render('pay-cycles/index', [
            'hasPrimarySchedule' => true,
            'cycles' => $cycles,
            'plan' => [
                'id' => $plan->id,
                'scheduleName' => $primary->name,
                'periodStart' => $start->toDateString(),
                'periodEnd' => $end->toDateString(),
                'inflowTotal' => $inflow,
                'outflowTotal' => $outflow,
                'remaining' => $inflow - $outflow,
                'allocations' => $allocations->values(),
            ],
        ]);
    }

    /**
     * Active Saver transfers as computed outflow lines for a pay cycle.
     */
    protected function saverTransfers(User $user, Carbon $start, array $exclude = []): Collection
    {
        if (! Schema::hasTable('saver_plans')) {
            return collect();
        }

        $plans = SaverPlan::where('user_id', $user->id)
            ->where('contribution_amount', '>', 0)
            ->whereNotIn('id', $exclude)
            ->get();

        if ($plans->isEmpty()) {
            return collect();
        }

        $names = $this->saverNames($user);

        return $plans
            ->map(fn (SaverPlan $p) => [
                'id' => 'saver-'.$p->id,
                'type' => 'outflow',
                'label' => '→ '.($names[$p->up_account_id] ?? ($p->name ?: 'Saver')),
                'amount' => (float) $p->contribution_amount,
                'date' => $start->toDateString(),
                'status' => 'planned',
                'is_recurring' => true,
                'is_saver_transfer' => true,
                'materialized' => false,
                'saverPlanId' => $p->id,
            ])
            ->values();
    }

    /**
     * Map of Up account id => Saver name, fetched from Up and cached briefly.
     */
    protected function saverNames(User $user): Collection
    {
        // Prefer the Savers page cache if it's warm (avoids an extra Up call).
        $cached = Cache::get('up.savers.v2.'.$user->id);
        if (isset($cached['savers'])) {
            return collect($cached['savers'])->pluck('name', 'id');
        }

        $up = UpBankService::forUser($user);

        if (! $up->isConfigured()) {
            return collect();
        }

        try {
            return Cache::remember('pc.savernames.'.$user->id, now()->addMinutes(5), fn () => collect($up->savers())->pluck('name', 'id'));
        } catch (\Throwable $e) {
            return collect();
        }
    }

    /**
     * Find or create the plan for a period, seeding it on first creation.
     * whereDate keeps the lookup robust to the stored time component, and the
     * try/catch guards against a prefetch race creating two plans.
     */
    protected function resolvePlan(PaySchedule $primary, Carbon $start, Carbon $end): PayPlan
    {
        $startStr = $start->toDateString();
        $plan = PayPlan::whereDate('period_start_date', $startStr)->first();

        if ($plan) {
            return $plan;
        }

        try {
            $plan = PayPlan::create([
                'pay_schedule_id' => $primary->id,
                'period_start_date' => $startStr,
                'period_end_date' => $end->toDateString(),
                'total_income' => $primary->amount,
            ]);

            $this->seedPlan($plan, $primary, $start, $end);

            return $plan;
        } catch (QueryException $e) {
            return PayPlan::whereDate('period_start_date', $startStr)->firstOrFail();
        }
    }

    /**
     * Seed a fresh plan with the scheduled income and every recurring
     * commitment that comes due inside this pay period.
     */
    protected function seedPlan(PayPlan $plan, PaySchedule $primary, Carbon $start, Carbon $end): void
    {
        $hasDate = Schema::hasColumn('pay_plan_allocations', 'date');

        $plan->allocations()->create(array_filter([
            'type' => 'inflow',
            'label' => $primary->name,
            'amount' => $primary->amount,
            'date' => $hasDate ? $start->toDateString() : null,
            'status' => 'planned',
        ], fn ($v) => $v !== null));

        Commitment::query()
            ->where('active', true)
            ->get()
            ->each(function (Commitment $commitment) use ($plan, $start, $end, $hasDate) {
                $due = $this->occurrenceInWindow($commitment, $start, $end);

                if ($due === null) {
                    return;
                }

                $plan->allocations()->create(array_filter([
                    'commitment_id' => $commitment->id,
                    'type' => 'outflow',
                    'label' => $commitment->name,
                    'amount' => $commitment->amount,
                    'date' => $hasDate ? $due->toDateString() : null,
                    'status' => 'planned',
                ], fn ($v) => $v !== null));
            });
    }

    /**
     * Give any dateless allocation a sensible date: a recurring outflow gets
     * its in-window occurrence, everything else the period start.
     */
    protected function backfillDates(PayPlan $plan, Carbon $start, Carbon $end): void
    {
        $plan->allocations()
            ->whereNull('date')
            ->get()
            ->each(function ($allocation) use ($start, $end) {
                $due = null;

                if ($allocation->commitment_id && $allocation->commitment) {
                    $due = $this->occurrenceInWindow($allocation->commitment, $start, $end);
                }

                $allocation->update([
                    'date' => ($due ?? $start)->toDateString(),
                ]);
            });
    }

    /**
     * The current period followed by the next ($count - 1) periods.
     */
    protected function upcomingPeriods(PaySchedule $schedule, int $count): array
    {
        $step = $this->stepper($schedule);
        [$start] = $this->currentPeriod($schedule);

        $periods = [];
        for ($i = 0; $i < $count; $i++) {
            $end = $step($start);
            $periods[] = [$start->copy(), $end];
            $start = $end;
        }

        return $periods;
    }

    /**
     * Current pay period: the most recent pay date on or before today and the
     * following pay date.
     */
    protected function currentPeriod(PaySchedule $schedule): array
    {
        $step = $this->stepper($schedule);
        $today = Carbon::today();
        $start = Carbon::parse($schedule->next_pay_date)->startOfDay();

        for ($i = 0; $i < 520; $i++) {
            $next = $step($start);
            if ($next->gt($today)) {
                break;
            }
            $start = $next;
        }

        return [$start, $step($start)];
    }

    protected function stepper(PaySchedule $schedule): callable
    {
        $interval = max(1, (int) $schedule->recurrence_interval);

        return fn (Carbon $d) => match ($schedule->cadence) {
            'weekly' => $d->copy()->addWeeks($interval),
            'fortnightly' => $d->copy()->addWeeks(2 * $interval),
            'monthly' => $d->copy()->addMonths($interval),
            default => $d->copy()->addWeeks($interval),
        };
    }

    protected function occurrenceInWindow(Commitment $commitment, Carbon $start, Carbon $end): ?Carbon
    {
        if (! $commitment->first_due_date) {
            return null;
        }

        $date = Carbon::parse($commitment->first_due_date)->startOfDay();
        $interval = max(1, (int) $commitment->recurrence_interval);

        if ($commitment->recurrence_type === 'one_time') {
            return $date->gte($start) && $date->lt($end) ? $date : null;
        }

        for ($i = 0; $i < 600 && $date->lt($start); $i++) {
            $date = match ($commitment->recurrence_type) {
                'weekly' => $date->addWeeks($interval),
                'fortnightly' => $date->addWeeks(2 * $interval),
                'monthly' => $date->addMonths($interval),
                'quarterly' => $date->addMonths(3 * $interval),
                'annual' => $date->addYears($interval),
                default => $date->addMonths($interval),
            };
        }

        return $date->lt($end) ? $date : null;
    }
}
