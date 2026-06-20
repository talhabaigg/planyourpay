<?php

namespace App\Http\Controllers;

use App\Models\Commitment;
use App\Models\PaySchedule;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PayCycleController extends Controller
{
    public function index(Request $request): Response
    {
        $primarySchedule = PaySchedule::where('is_primary', true)
            ->orderByDesc('next_pay_date')
            ->first();

        $cycles = [];

        if ($primarySchedule) {
            $nextPay = Carbon::parse($primarySchedule->next_pay_date);
            $days = $this->cadenceDays($primarySchedule->cadence, $primarySchedule->recurrence_interval);
            $commitments = Commitment::query()
                ->where('active', true)
                ->orderBy('first_due_date')
                ->get();

            for ($i = 0; $i < 4; $i++) {
                $start = $nextPay->copy()->addDays($i * $days);
                $end = $start->copy()->addDays($days - 1);

                $inflows = [
                    [
                        'id' => $primarySchedule->id,
                        'label' => $primarySchedule->name,
                        'amount' => (float) $primarySchedule->amount,
                    ],
                ];

                $outflows = $commitments->map(function (Commitment $commitment) {
                    return [
                        'id' => $commitment->id,
                        'label' => $commitment->name,
                        'amount' => (float) $commitment->amount,
                    ];
                })->values()->all();

                $inflowTotal = collect($inflows)->sum('amount');
                $outflowTotal = collect($outflows)->sum('amount');

                $cycles[] = [
                    'id' => $i + 1,
                    'label' => 'Pay cycle #' . ($i + 1),
                    'start_date' => $start->toDateString(),
                    'end_date' => $end->toDateString(),
                    'schedule_name' => $primarySchedule->name,
                    'income' => number_format($primarySchedule->amount, 2, '.', ''),
                    'status' => $i === 0 ? 'Current' : 'Upcoming',
                    'inflows' => $inflows,
                    'outflows' => $outflows,
                    'surplus' => number_format($inflowTotal - $outflowTotal, 2, '.', ''),
                ];
            }
        }

        return Inertia::render('pay-cycles/index', [
            'cycles' => $cycles,
            'hasPrimarySchedule' => (bool) $primarySchedule,
        ]);
    }

    protected function cadenceDays(string $cadence, int $interval): int
    {
        $base = match ($cadence) {
            'weekly' => 7,
            'fortnightly' => 14,
            'monthly' => 30,
            default => 14,
        };

        return max(1, $interval) * $base;
    }
}
