<?php

namespace App\Http\Controllers;

use App\Models\PaySchedule;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class PayScheduleController extends Controller
{
    /** @var list<string> */
    protected array $cadenceOptions = ['weekly', 'fortnightly', 'monthly'];

    public function index(): Response
    {
        $schedules = PaySchedule::orderByDesc('is_primary')
            ->orderBy('next_pay_date')
            ->get()
            ->map(fn (PaySchedule $schedule) => $this->present($schedule));

        \Log::debug('pay-schedules.index', ['count' => $schedules->count()]);

        return Inertia::render('settings/pay-schedules/index', [
            'schedules' => $schedules,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('settings/pay-schedules/create', [
            'cadenceOptions' => $this->cadenceOptions,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateData($request);
        $this->handlePrimaryFlag($request->user()->id, $validated['is_primary'] ?? false);

        $request->user()->paySchedules()->create($validated);

        return redirect()->route('pay-schedules.index')->with('success', 'Pay schedule created.');
    }

    public function edit(PaySchedule $paySchedule): Response
    {
        return Inertia::render('settings/pay-schedules/edit', [
            'schedule' => $this->present($paySchedule),
            'cadenceOptions' => $this->cadenceOptions,
        ]);
    }

    public function update(Request $request, PaySchedule $paySchedule): RedirectResponse
    {
        $validated = $this->validateData($request, $paySchedule->id);
        $this->handlePrimaryFlag($request->user()->id, $validated['is_primary'] ?? false, $paySchedule->id);

        $paySchedule->update($validated);

        return redirect()->route('pay-schedules.index')->with('success', 'Pay schedule updated.');
    }

    public function destroy(PaySchedule $paySchedule): RedirectResponse
    {
        $paySchedule->delete();

        return redirect()->route('pay-schedules.index')->with('success', 'Pay schedule removed.');
    }

    /**
     * @return array<string, mixed>
     */
    protected function present(PaySchedule $schedule): array
    {
        return [
            'id' => $schedule->id,
            'name' => $schedule->name,
            'amount' => $schedule->amount,
            'cadence' => $schedule->cadence,
            'recurrence_interval' => $schedule->recurrence_interval,
            // Raw anchor (used to pre-fill the edit form).
            'next_pay_date' => optional($schedule->next_pay_date)->toDateString(),
            // Anchor rolled forward to the next pay date on or after today.
            'upcoming_pay_date' => $this->upcomingPayDate($schedule),
            'is_primary' => $schedule->is_primary,
            'notes' => $schedule->notes,
        ];
    }

    protected function upcomingPayDate(PaySchedule $schedule): string
    {
        $date = Carbon::parse($schedule->next_pay_date)->startOfDay();
        $today = Carbon::today();
        $interval = max(1, (int) $schedule->recurrence_interval);

        for ($i = 0; $i < 520 && $date->lt($today); $i++) {
            $date = match ($schedule->cadence) {
                'weekly' => $date->addWeeks($interval),
                'fortnightly' => $date->addWeeks(2 * $interval),
                'monthly' => $date->addMonths($interval),
            };
        }

        return $date->toDateString();
    }

    /**
     * @return array<string, mixed>
     */
    protected function validateData(Request $request, ?int $payScheduleId = null): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0'],
            'cadence' => ['required', 'in:'.implode(',', $this->cadenceOptions)],
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

    protected function handlePrimaryFlag(int $userId, bool $isPrimary, ?int $ignoreId = null): void
    {
        if ($isPrimary) {
            $query = PaySchedule::where('user_id', $userId);
            if ($ignoreId) {
                $query->where('id', '<>', $ignoreId);
            }
            $query->update(['is_primary' => false]);
        }
    }
}
