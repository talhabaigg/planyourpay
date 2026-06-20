<?php

namespace App\Http\Controllers;

use App\Models\PayPlan;
use App\Models\PayPlanAllocation;
use App\Models\SaverPlan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class PayPlanAllocationController extends Controller
{
    /**
     * Record an actual Saver transfer for a pay cycle — materialising the
     * otherwise-computed transfer line into an editable allocation.
     */
    public function materializeSaver(Request $request, PayPlan $payPlan, int $saverPlan): RedirectResponse
    {
        if (! Schema::hasColumn('pay_plan_allocations', 'saver_plan_id')) {
            return back()->withErrors(['amount' => 'Run "php artisan migrate" to record Saver transfers.']);
        }

        $data = $request->validate([
            'amount' => ['required', 'numeric', 'min:0'],
            'status' => ['required', Rule::in(['planned', 'paid'])],
            'label' => ['required', 'string', 'max:255'],
        ]);

        // The pay plan is user-scoped; confirm the Saver plan is the user's too.
        abort_unless(
            SaverPlan::where('user_id', $request->user()->id)->whereKey($saverPlan)->exists(),
            403,
        );

        $attributes = [
            'type' => 'outflow',
            'label' => $data['label'],
            'amount' => $data['amount'],
            'status' => $data['status'],
        ];

        if (Schema::hasColumn('pay_plan_allocations', 'date')) {
            $attributes['date'] = $payPlan->period_start_date->toDateString();
        }

        PayPlanAllocation::updateOrCreate(
            ['pay_plan_id' => $payPlan->id, 'saver_plan_id' => $saverPlan],
            $attributes,
        );

        return back();
    }

    public function store(Request $request, PayPlan $payPlan): RedirectResponse
    {
        $data = $request->validate([
            'type' => ['required', Rule::in(['inflow', 'outflow'])],
            'label' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0'],
            'date' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        if (! Schema::hasColumn('pay_plan_allocations', 'date')) {
            unset($data['date']);
        }

        $payPlan->allocations()->create([
            ...$data,
            'status' => 'planned',
        ]);

        return back();
    }

    public function update(Request $request, PayPlanAllocation $allocation): RedirectResponse
    {
        $this->authorizeAllocation($allocation);

        $data = $request->validate([
            'type' => ['sometimes', Rule::in(['inflow', 'outflow'])],
            'label' => ['sometimes', 'string', 'max:255'],
            'amount' => ['sometimes', 'numeric', 'min:0'],
            'date' => ['sometimes', 'nullable', 'date'],
            'status' => ['sometimes', Rule::in(['planned', 'paid', 'skipped'])],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        if (! Schema::hasColumn('pay_plan_allocations', 'date')) {
            unset($data['date']);
        }

        $allocation->update($data);

        return back();
    }

    public function destroy(PayPlanAllocation $allocation): RedirectResponse
    {
        $this->authorizeAllocation($allocation);

        $allocation->delete();

        return back();
    }

    /**
     * The PayPlan model carries a global user scope, so a foreign plan
     * resolves to null — block access in that case.
     */
    protected function authorizeAllocation(PayPlanAllocation $allocation): void
    {
        abort_unless($allocation->plan !== null, 403);
    }
}
