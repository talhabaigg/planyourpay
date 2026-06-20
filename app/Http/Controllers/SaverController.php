<?php

namespace App\Http\Controllers;

use App\Models\SaverPlan;
use App\Models\User;
use App\Services\UpBankService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class SaverController extends Controller
{
    public function index(Request $request): Response
    {
        $up = UpBankService::forUser($request->user());

        if (! $up->isConfigured()) {
            return Inertia::render('savers/index', [
                'connected' => false,
                'error' => null,
                'savers' => [],
                'total' => 0,
                'spending' => null,
                'syncedAt' => null,
                'payDays' => null,
                'nextPayday' => null,
            ]);
        }

        $key = 'up.savers.v2.'.$request->user()->id;

        if ($request->boolean('refresh')) {
            Cache::forget($key);
        }

        try {
            $data = Cache::remember($key, now()->addSeconds(60), fn () => [
                'savers' => $up->savers(),
                'spending' => $up->spendingBalance(),
                'syncedAt' => now()->toIso8601String(),
            ]);

            // Merge in-app plans (target + per-pay contribution) onto each Saver.
            $plans = $this->plansFor($request->user()->id);
            $savers = array_map(function (array $saver) use ($plans) {
                $plan = $plans[$saver['id']] ?? null;

                // Keep the cached Saver name fresh so pay cycles label transfers
                // correctly (and backfill plans saved before names were stored).
                if ($plan && Schema::hasColumn('saver_plans', 'name') && $plan->name !== $saver['name']) {
                    $plan->update(['name' => $saver['name']]);
                }

                return [
                    ...$saver,
                    'target' => $plan ? (float) $plan->target_amount : null,
                    'targetDate' => $plan && $plan->target_date
                        ? $plan->target_date->toDateString()
                        : null,
                    'contribution' => $plan ? (float) $plan->contribution_amount : null,
                ];
            }, $data['savers']);

            return Inertia::render('savers/index', [
                'connected' => true,
                'error' => null,
                'savers' => $savers,
                'total' => array_sum(array_column($data['savers'], 'balance')),
                'spending' => $data['spending'],
                'syncedAt' => $data['syncedAt'],
                'payDays' => $this->payCycleDays($request->user()),
                'nextPayday' => $this->nextPayday($request->user()),
            ]);
        } catch (\Throwable $e) {
            return Inertia::render('savers/index', [
                'connected' => true,
                'error' => 'Could not reach Up. Your token may be invalid or revoked.',
                'savers' => [],
                'total' => 0,
                'spending' => null,
                'syncedAt' => null,
                'payDays' => null,
                'nextPayday' => null,
            ]);
        }
    }

    public function savePlan(Request $request, string $account): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'target_amount' => ['nullable', 'numeric', 'min:0'],
            'target_date' => ['nullable', 'date'],
            'contribution_amount' => ['nullable', 'numeric', 'min:0'],
        ]);

        if (! Schema::hasTable('saver_plans')) {
            return back()->withErrors([
                'target_amount' => 'Run "php artisan migrate" to enable Saver plans.',
            ]);
        }

        // Nothing set — treat as a clear.
        if (! $data['target_amount'] && ! $data['contribution_amount'] && empty($data['target_date'])) {
            SaverPlan::where('user_id', $request->user()->id)
                ->where('up_account_id', $account)
                ->delete();

            return back()->with('success', 'Saver plan cleared.');
        }

        $attributes = [
            'target_amount' => $data['target_amount'] ?: null,
            'contribution_amount' => $data['contribution_amount'] ?: null,
        ];

        if (Schema::hasColumn('saver_plans', 'name')) {
            $attributes['name'] = $data['name'] ?? null;
        }

        if (Schema::hasColumn('saver_plans', 'target_date')) {
            $attributes['target_date'] = $data['target_date'] ?: null;
        }

        SaverPlan::updateOrCreate(
            ['user_id' => $request->user()->id, 'up_account_id' => $account],
            $attributes,
        );

        return back()->with('success', 'Saver plan saved.');
    }

    public function deletePlan(Request $request, string $account): RedirectResponse
    {
        if (Schema::hasTable('saver_plans')) {
            SaverPlan::where('user_id', $request->user()->id)
                ->where('up_account_id', $account)
                ->delete();
        }

        return back()->with('success', 'Saver plan removed.');
    }

    /**
     * @return array<string, SaverPlan> keyed by up_account_id
     */
    protected function plansFor(int $userId): array
    {
        if (! Schema::hasTable('saver_plans')) {
            return [];
        }

        return SaverPlan::where('user_id', $userId)
            ->get()
            ->keyBy('up_account_id')
            ->all();
    }

    /**
     * Length of the user's pay cycle in days, for projecting goal dates.
     */
    protected function payCycleDays(User $user): ?int
    {
        $primary = $user->paySchedules()
            ->orderByDesc('is_primary')
            ->orderBy('next_pay_date')
            ->first();

        if (! $primary) {
            return null;
        }

        $base = match ($primary->cadence) {
            'weekly' => 7,
            'fortnightly' => 14,
            'monthly' => 30,
            default => 14,
        };

        return $base * max(1, (int) $primary->recurrence_interval);
    }

    /**
     * Next upcoming payday (anchor rolled forward to on/after today).
     */
    protected function nextPayday(User $user): ?string
    {
        $primary = $user->paySchedules()
            ->orderByDesc('is_primary')
            ->orderBy('next_pay_date')
            ->first();

        if (! $primary) {
            return null;
        }

        $date = Carbon::parse($primary->next_pay_date)->startOfDay();
        $today = Carbon::today();
        $interval = max(1, (int) $primary->recurrence_interval);

        for ($i = 0; $i < 520 && $date->lt($today); $i++) {
            $date = match ($primary->cadence) {
                'weekly' => $date->addWeeks($interval),
                'fortnightly' => $date->addWeeks(2 * $interval),
                'monthly' => $date->addMonths($interval),
                default => $date->addWeeks($interval),
            };
        }

        return $date->toDateString();
    }

    public function connect(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string', 'min:10', 'max:255'],
        ]);

        if (! Schema::hasColumn('users', 'up_api_token')) {
            return back()->withErrors([
                'token' => 'Run "php artisan migrate" to enable saving your Up token.',
            ]);
        }

        // Verify the token works before storing it.
        if (! UpBankService::withToken($data['token'])->ping()) {
            return back()->withErrors([
                'token' => 'That token was rejected by Up. Double-check and try again.',
            ]);
        }

        $user = $request->user();
        $user->up_api_token = $data['token'];
        $user->save();

        Cache::forget('up.savers.'.$user->id);

        return redirect()
            ->route('savers.index')
            ->with('success', 'Up account connected.');
    }

    public function disconnect(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (Schema::hasColumn('users', 'up_api_token')) {
            $user->up_api_token = null;
            $user->save();
        }

        Cache::forget('up.savers.'.$user->id);

        return redirect()
            ->route('savers.index')
            ->with('success', 'Up account disconnected.');
    }
}
