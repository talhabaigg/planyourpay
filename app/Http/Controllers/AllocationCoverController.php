<?php

namespace App\Http\Controllers;

use App\Models\AllocationCover;
use App\Models\PayPlanAllocation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AllocationCoverController extends Controller
{
    public function store(Request $request, PayPlanAllocation $allocation): RedirectResponse
    {
        $this->authorizeAllocation($request, $allocation);

        $data = $this->validatePayload($request, $allocation);

        $allocation->covers()->create($data);

        return back()->with('success', 'Cover saved.');
    }

    public function update(Request $request, AllocationCover $allocationCover): RedirectResponse
    {
        $allocation = $allocationCover->allocation;
        $this->authorizeAllocation($request, $allocation);

        $data = $this->validatePayload($request, $allocation, $allocationCover->id);

        $allocationCover->update($data);

        return back()->with('success', 'Cover updated.');
    }

    public function destroy(Request $request, AllocationCover $allocationCover): RedirectResponse
    {
        $allocation = $allocationCover->allocation;
        $this->authorizeAllocation($request, $allocation);

        $allocationCover->delete();

        return back()->with('success', 'Cover removed.');
    }

    /**
     * @return array<string, mixed>
     */
    protected function validatePayload(Request $request, PayPlanAllocation $allocation, ?int $ignoreId = null): array
    {
        $data = $request->validate([
            'source' => ['required', 'in:saver,paycheck'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'saver_plan_id' => ['nullable', 'exists:saver_plans,id'],
        ]);

        if ($data['source'] === 'saver' && empty($data['saver_plan_id'])) {
            $request->validate(['saver_plan_id' => ['required']]);
        }

        $sum = $allocation->covers()
            ->where('source', 'saver')
            ->when($ignoreId, fn ($q) => $q->where('id', '<>', $ignoreId))
            ->sum('amount');

        if ($data['source'] === 'saver' && $sum + (float) $data['amount'] > (float) $allocation->amount + 0.01) {
            abort(422, 'Covered amount exceeds allocation total.');
        }

        return $data;
    }

    protected function authorizeAllocation(Request $request, PayPlanAllocation $allocation): void
    {
        $plan = $allocation->plan()->with('schedule')->first();
        $ownerId = $plan?->schedule?->user_id;

        if ($ownerId !== $request->user()->id) {
            abort(403);
        }
    }
}
