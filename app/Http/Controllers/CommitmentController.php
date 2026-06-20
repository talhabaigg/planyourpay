<?php

namespace App\Http\Controllers;

use App\Models\Commitment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CommitmentController extends Controller
{
    public function index(Request $request): Response
    {
        $commitments = Commitment::query()
            ->orderBy('name')
            ->get()
            ->map(fn ($commitment) => [
                'id' => $commitment->id,
                'name' => $commitment->name,
                'amount' => number_format((float) $commitment->amount, 2, '.', ''),
                'recurrence_type' => $commitment->recurrence_type,
                'recurrence_interval' => $commitment->recurrence_interval,
                'first_due_date' => optional($commitment->first_due_date)->toDateString(),
                'category' => $commitment->category,
                'notes' => $commitment->notes,
                'active' => (bool) $commitment->active,
            ])
            ->values();

        return Inertia::render('commitments/index', [
            'commitments' => $commitments,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateCommitment($request);

        Commitment::create($data);

        return redirect()
            ->route('commitments.index')
            ->with('success', 'Commitment created');
    }

    public function update(Request $request, Commitment $commitment): RedirectResponse
    {
        $data = $this->validateCommitment($request);

        $commitment->update($data);

        return redirect()
            ->route('commitments.index')
            ->with('success', 'Commitment updated');
    }

    public function destroy(Commitment $commitment): RedirectResponse
    {
        $commitment->delete();

        return redirect()
            ->route('commitments.index')
            ->with('success', 'Commitment removed');
    }

    /**
     * @return array<string, mixed>
     */
    protected function validateCommitment(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0'],
            'recurrence_type' => ['required', Rule::in(['weekly', 'fortnightly', 'monthly', 'quarterly', 'annual', 'one_time'])],
            'recurrence_interval' => ['required', 'integer', 'min:1', 'max:52'],
            'first_due_date' => ['required', 'date'],
            'category' => ['nullable', 'string', 'max:120'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'active' => ['nullable', 'boolean'],
        ]);

        $data['active'] = $request->boolean('active', true);

        return $data;
    }
}
