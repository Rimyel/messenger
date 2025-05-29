<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Company;
use Illuminate\Database\Eloquent\Factories\Factory;

class CompanyUserFactory extends Factory
{
    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'user_id' => User::factory(),
            'role' => $this->faker->randomElement(['owner', 'admin', 'member']),
            'status' => 'active',
            'created_at' => $this->faker->dateTimeBetween('-1 year'),
            'updated_at' => $this->faker->dateTimeBetween('-1 month'),
        ];
    }

    public function owner(): self
    {
        return $this->state(fn () => ['role' => 'owner']);
    }

    public function admin(): self
    {
        return $this->state(fn () => ['role' => 'admin']);
    }

    public function member(): self
    {
        return $this->state(fn () => ['role' => 'member']);
    }

    public function inactive(): self
    {
        return $this->state(fn () => ['status' => 'inactive']);
    }
}