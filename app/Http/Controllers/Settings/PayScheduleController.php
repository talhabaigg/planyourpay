<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\PaySchedule;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class PayScheduleController extends Controller
{
    protected array $cadenceOptions = ['weekly', 'fortnightly', 'monthly'];

    public function index(Request $request): Response
    {
        $schedules = PaySchedule::orderByDesc('is_primary')
            ->orderBy('next_pay_date')
            ->get()
            ->map(function (PaySchedule $schedule) {
                return [
                    'id' => $schedule->id,
                    'name' => $schedule->name,
                    'amount' => $schedule->amount,
                    'cadence' => $schedule->cadence,
                    'recurrence_interval' => $schedule->recurrence_interval,
                    'next_pay_date' => optional($schedule->next_pay_date)->toDateString(),
                    'is_primary' => $schedule->is_primary,
                    'notes' => $schedule->notes,
                ];
            });

        return Inertia::render('settings/pay-schedules', [
            'schedules' => $schedules,
            'cadenceOptions' => $this->cadenceOptions,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateData($request);

        $this->handlePrimaryFlag($request->user(), $validated['is_primary'] ?? false);

        $request->user()->paySchedules()->create($validated);

        return back()->with('success', 'Pay schedule created.');
    }

    public function update(Request $request, PaySchedule $paySchedule): RedirectResponse
    {
        $validated = $this->validateData($request, $paySchedule->id);

        $this->handlePrimaryFlag($request->user(), $validated['is_primary'] ?? false, $paySchedule->id);

        $paySchedule->update($validated);

        return back()->with('success', 'Pay schedule updated.');
    }

    public function destroy(PaySchedule $paySchedule): RedirectResponse
    {
        $paySchedule->delete();

        return back()->with('success', 'Pay schedule removed.');
    }

    protected function validateData(Request $request, ?int $payScheduleId = null): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0'],
            'cadence' => ['required', 'in:' . implode(',', $this->cadenceOptions)],
            'recurrence_interval' => ['nullable', 'integer', 'min:1', 'max:12'],
            'next_pay_date' => ['required', 'date'],
            'is_primary' => ['sometimes', 'boolean'],
            'notes' => ['nullable', 'string'],
        ]);

        $data['recurrence_interval'] = $data['recurrence_interval'] ?? 1;
        $data['day_of_week'] = Carbon::parse($data['next_pay_date'])->dayOfWeek;
        $data['day_of_month'] = Carbon::parse($data['next_pay_date'])->day;
        $data['is_primary'] = (bool) ($data['is_primary'] ?? false);

        return Arr::only($data, [
            'name',
            'amount',
            'cadence',
            'recurrence_interval',
            'next_pay_date',
            'day_of_week',
            'day_of_month',
            'notes',
            'is_primary',
        ]);
    }

    protected function handlePrimaryFlag($user, bool $isPrimary, ?int $ignoreId = null): void
    {
        if ($isPrimary) {
            $query = PaySchedule::where('user_id', $user->id);
            if ($ignoreId) {
                $query->where('id', '<>', $ignoreId);
            }
            $query->update(['is_primary' => false]);
        }
    }
}
