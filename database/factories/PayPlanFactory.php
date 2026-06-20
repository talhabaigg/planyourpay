<?php

namespace Database\Factories;

use App\Models\PayPlan;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PayPlan>
 */
class PayPlanFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'pay_schedule_id' => null,
            'period_start_date' => fake()->dateTimeBetween('-1 month', 'now')->format('Y-m-d'),
            'period_end_date' => fake()->dateTimeBetween('now', '+1 month')->format('Y-m-d'),
            'total_income' => fake()->randomFloat(2, 500, 5000),
            'notes' => null,
            'locked' => false,
        ];
    }
}
