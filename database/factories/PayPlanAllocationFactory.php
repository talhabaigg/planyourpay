<?php

namespace Database\Factories;

use App\Models\PayPlan;
use App\Models\PayPlanAllocation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PayPlanAllocation>
 */
class PayPlanAllocationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'pay_plan_id' => PayPlan::factory(),
            'commitment_id' => null,
            'type' => fake()->randomElement(['inflow', 'outflow']),
            'label' => fake()->words(2, true),
            'amount' => fake()->randomFloat(2, 10, 2000),
            'status' => 'planned',
            'notes' => null,
        ];
    }
}
