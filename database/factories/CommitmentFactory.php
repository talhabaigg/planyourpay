<?php

namespace Database\Factories;

use App\Models\Commitment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Commitment>
 */
class CommitmentFactory extends Factory
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
            'name' => fake()->words(2, true),
            'amount' => fake()->randomFloat(2, 10, 2000),
            'recurrence_type' => fake()->randomElement(['weekly', 'fortnightly', 'monthly', 'quarterly', 'annual', 'one_time']),
            'recurrence_interval' => 1,
            'first_due_date' => fake()->dateTimeBetween('-1 month', '+1 month')->format('Y-m-d'),
            'category' => fake()->randomElement(['Housing', 'Utilities', 'Subscriptions', null]),
            'notes' => null,
            'active' => true,
        ];
    }
}
