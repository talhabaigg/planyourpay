<?php

namespace App\Http\Controllers;

use App\Models\Commitment;
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

        if ($period['start'] && $period['end']) {
            // Scope to the current pay cycle: a commitment belongs to this pay
            // if it comes due before the next paycheck. "Committed" reflects the
            // whole cycle's obligations; the list shows only what's still pending
            // (due on or after today) so it reads as genuinely upcoming.
            $start = Carbon::parse($period['start']);
            $end = Carbon::parse($period['end']);

            $inCycle = $commitments
                ->map(function (Commitment $c) use ($start, $end) {
                    $due = $this->occurrenceInWindow($c, $start, $end);

                    return $due === null ? null : [
                        'id' => $c->id,
                        'name' => $c->name,
                        'amount' => (float) $c->amount,
                        'category' => $c->category,
                        'due' => $due,
                    ];
                })
                ->filter()
                ->values();

            $committed = (float) $inCycle->sum('amount');
            $upcoming = $inCycle
                ->filter(fn ($item) => $item['due']->gte($today))
                ->sortBy(fn ($item) => $item['due']->timestamp)
                ->map(fn ($item) => [...$item, 'due' => $item['due']->toDateString()])
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
                        'category' => $c->category,
                        'due' => $due->toDateString(),
                    ];
                })
                ->filter()
                ->sortBy('due')
                ->take(5)
                ->values();
        }

        return Inertia::render('dashboard', [
            'income' => $income,
            'committed' => $committed,
            'surplus' => $income !== null ? $income - $committed : null,
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

    /**
     * Next due date for a commitment on or after today, rolling its anchor
     * forward by its cadence. Returns null for a one-off that already passed.
     */
    protected function nextCommitmentDue(Commitment $commitment, Carbon $today): ?Carbon
    {
        if (! $commitment->first_due_date) {
            return null;
        }

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
                default => $date->addMonths($interval),
            };
        }

        return $date;
    }

    /**
     * Resolve the pay period the user is currently in: the most recent pay
     * date on or before today (start) and the following pay date (end).
     */
    protected function currentPayPeriod(?PaySchedule $schedule): array
    {
        if (! $schedule || ! $schedule->next_pay_date) {
            return ['start' => null, 'end' => null];
        }

        $today = Carbon::today();
        $interval = max(1, (int) $schedule->recurrence_interval);
        $step = fn (Carbon $d) => match ($schedule->cadence) {
            'weekly' => $d->copy()->addWeeks($interval),
            'fortnightly' => $d->copy()->addWeeks(2 * $interval),
            'monthly' => $d->copy()->addMonths($interval),
            default => $d->copy()->addWeeks($interval),
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
