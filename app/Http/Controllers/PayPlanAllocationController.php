<?php

namespace App\Http\Controllers;

use App\Models\PayPlan;
use App\Models\PayPlanAllocation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class PayPlanAllocationController extends Controller
{
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
