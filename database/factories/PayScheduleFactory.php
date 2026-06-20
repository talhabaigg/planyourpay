<?php

namespace Database\Factories;

use App\Models\PaySchedule;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PaySchedule>
 */
class PayScheduleFactory extends Factory
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
            'name' => fake()->randomElement(['Salary', 'Wages', 'Freelance']),
            'amount' => fake()->randomFloat(2, 500, 5000),
            'cadence' => fake()->randomElement(['weekly', 'fortnightly', 'monthly']),
            'recurrence_interval' => 1,
            'next_pay_date' => fake()->dateTimeBetween('now', '+2 weeks')->format('Y-m-d'),
            'day_of_week' => null,
            'day_of_month' => null,
            'is_primary' => false,
            'active' => true,
            'notes' => null,
        ];
    }
}
