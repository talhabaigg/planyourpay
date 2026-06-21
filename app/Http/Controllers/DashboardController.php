<?php

namespace App\Http\Controllers;

use App\Models\Commitment;
use App\Models\PayPlan;
use App\Models\PaySchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        // Primary income stream (pay schedules are scoped to the user).
        $primary = $request->user()
            ->paySchedules()
            ->orderByDesc('is_primary')
            ->orderBy('next_pay_date')
            ->first();

        // Active commitments, soonest due first (mirrors CommitmentController scope).
        $commitments = Commitment::query()
            ->where('active', true)
            ->orderBy('first_due_date')
            ->get();

        $income = $primary ? (float) $primary->amount : null;
        $today = Carbon::today();
        $period = $this->currentPayPeriod($primary);
        $plan = null;

        if ($period['start']) {
            $plan = PayPlan::query()
                ->with(['allocations.covers.saverPlan'])
                ->whereDate('period_start_date', $period['start'])
                ->first();
        }

        if ($plan) {
            // Scope to the current pay cycle: a commitment belongs to this pay
            // if it comes due before the next paycheck. "Committed" reflects the
            // whole cycle's obligations; the list shows only what's still pending
            // (due on or after today) so it reads as genuinely upcoming.
            $allocations = $plan->allocations;
            $inflowTotal = (float) $allocations
                ->where('type', 'inflow')
                ->sum('amount');
            $committed = (float) $allocations
                ->where('type', 'outflow')
                ->sum(function ($allocation) {
                    $saverCoverage = (float) $allocation->covers
                        ->where('source', 'saver')
                        ->sum('amount');

                    return max(0, (float) $allocation->amount - $saverCoverage);
                });
            $income = $inflowTotal > 0 ? $inflowTotal : $income;

            $upcoming = $allocations
                ->where('type', 'outflow')
                ->filter(fn ($allocation) => $allocation->status !== 'paid')
                ->map(function ($allocation) use ($period) {
                    $saverCoverage = (float) $allocation->covers
                        ->where('source', 'saver')
                        ->sum('amount');
                    $due = $allocation->date
                        ? Carbon::parse($allocation->date)
                        : ($period['end'] ? Carbon::parse($period['end']) : null);

                    return [
                        'id' => $allocation->id,
                        'name' => $allocation->label,
                        'amount' => (float) $allocation->amount,
                        'pay_amount' => max(0, (float) $allocation->amount - $saverCoverage),
                        'covers' => $allocation->covers->map(function ($cover) {
                            return [
                                'id' => $cover->id,
                                'source' => $cover->source,
                                'amount' => (float) $cover->amount,
                                'saverPlan' => $cover->saverPlan?->only(['id', 'name']),
                            ];
                        }),
                        'category' => $allocation->is_recurring ? 'Recurring' : null,
                        'due' => $due,
                    ];
                })
                ->filter(fn ($item) => $item['due']?->gte($today))
                ->sortBy(fn ($item) => $item['due']?->timestamp ?? PHP_INT_MAX)
                ->map(fn ($item) => [
                    'id' => $item['id'],
                    'name' => $item['name'],
                    'amount' => $item['amount'],
                    'pay_amount' => $item['pay_amount'],
                    'covers' => $item['covers'],
                    'category' => $item['category'],
                    'due' => $item['due']?->toDateString(),
                ])
                ->take(5)
                ->values();
        } else {
            // No pay schedule yet — fall back to all active commitments and
            // their next occurrence from today.
            $committed = (float) $commitments->sum(fn (Commitment $c) => (float) $c->amount);
            $upcoming = $commitments
                ->map(function (Commitment $c) use ($today) {
                    $due = $this->nextCommitmentDue($c, $today);

                    return $due === null ? null : [
                        'id' => $c->id,
                        'name' => $c->name,
                        'amount' => (float) $c->amount,
                        'pay_amount' => (float) $c->amount,
                        'covers' => [],
                        'category' => $c->category,
                        'due' => $due->toDateString(),
                    ];
                })
                ->filter()
                ->sortBy('due')
                ->take(5)
                ->values();
        }

        $surplus = $income !== null && isset($committed)
            ? $income - $committed
            : ($income !== null ? $income : null);

        return Inertia::render('dashboard', [
            'income' => $income,
            'committed' => $committed ?? 0,
            'surplus' => $surplus,
            'primaryName' => $primary?->name,
            'payPeriodStart' => $period['start'],
            'payPeriodEnd' => $period['end'],
            'commitments' => $upcoming,
            'commitmentCount' => $commitments->count(),
        ]);
    }

    /**
     * First occurrence of a commitment that falls within [$start, $end).
     */
    protected function occurrenceInWindow(Commitment $commitment, Carbon $start, Carbon $end): ?Carbon
    {
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
            };
        }

        return $date->lt($end) ? $date : null;
    }

    /**
     * Next due date for a commitment on or after today, rolling its anchor
     * forward by its cadence. Returns null for a one-off that already passed.
     */
    protected function nextCommitmentDue(Commitment $commitment, Carbon $today): ?Carbon
    {
        $date = Carbon::parse($commitment->first_due_date)->startOfDay();
        $interval = max(1, (int) $commitment->recurrence_interval);

        if ($commitment->recurrence_type === 'one_time') {
            return $date->gte($today) ? $date : null;
        }

        for ($i = 0; $i < 600 && $date->lt($today); $i++) {
            $date = match ($commitment->recurrence_type) {
                'weekly' => $date->addWeeks($interval),
                'fortnightly' => $date->addWeeks(2 * $interval),
                'monthly' => $date->addMonths($interval),
                'quarterly' => $date->addMonths(3 * $interval),
                'annual' => $date->addYears($interval),
            };
        }

        return $date;
    }

    /**
     * Resolve the pay period the user is currently in: the most recent pay
     * date on or before today (start) and the following pay date (end).
     *
     * @return array{start: string|null, end: string|null}
     */
    protected function currentPayPeriod(?PaySchedule $schedule): array
    {
        if (! $schedule) {
            return ['start' => null, 'end' => null];
        }

        $today = Carbon::today();
        $interval = max(1, (int) $schedule->recurrence_interval);
        $step = fn (Carbon $d) => match ($schedule->cadence) {
            'weekly' => $d->copy()->addWeeks($interval),
            'fortnightly' => $d->copy()->addWeeks(2 * $interval),
            'monthly' => $d->copy()->addMonths($interval),
        };

        $start = Carbon::parse($schedule->next_pay_date)->startOfDay();

        // Advance while the *next* occurrence is still on or before today, so
        // $start lands on the current period's pay date.
        for ($i = 0; $i < 520; $i++) {
            $next = $step($start);
            if ($next->gt($today)) {
                break;
            }
            $start = $next;
        }

        return [
            'start' => $start->toDateString(),
            'end' => $step($start)->toDateString(),
        ];
    }
}
