<?php

namespace App\Http\Controllers;

use App\Models\Commitment;
use App\Models\PayPlan;
use App\Models\PaySchedule;
use Carbon\Carbon;
use Illuminate\Http\Request;
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

        if ($hasDate) {
            $this->backfillDates($plan, $start, $end);
        }

        $allocations = $plan->allocations()
            ->orderBy('type')
            ->orderBy('id')
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'type' => $a->type,
                'label' => $a->label,
                'amount' => (float) $a->amount,
                'date' => $hasDate ? optional($a->date)->toDateString() : null,
                'status' => $a->status,
                'is_recurring' => $a->commitment_id !== null,
            ]);

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
                'allocations