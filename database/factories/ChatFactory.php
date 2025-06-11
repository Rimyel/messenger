<?php

namespace Database\Factories;

use App\Models\Chat;
use App\Models\Company;
use Illuminate\Database\Eloquent\Factories\Factory;

class ChatFactory extends Factory
{
    protected $model = Chat::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->words(3, true),
            'type' => $this->faker->randomElement(['group', 'private']),
            'company_id' => Company::factory(),
            'created_at' => $this->faker->dateTimeBetween('-1 year'),
            'updated_at' => $this->faker->dateTimeBetween('-1 month'),
        ];
    }

    public function direct(): self
    {
        return $this->state(function () {
            return [
                'type' => 'private',
                'name' => null,
            ];
        });
    }

    public function group(): self
    {
        return $this->state(function () {
            return [
                'type' => 'group',
            ];
        });
    }
}