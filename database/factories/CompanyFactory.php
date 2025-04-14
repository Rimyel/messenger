<?php

namespace Database\Factories;

use App\Models\Company;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Company>
 */
class CompanyFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Company::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->company(),
            'description' => $this->faker->paragraph(),
            'logo_url' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    /**
     * Indicate that the company has a logo.
     */
    public function withLogo(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'logo_url' => 'company-logos/test-logo.jpg',
            ];
        });
    }

    /**
     * Indicate that the company should have random test data.
     */
    public function testData(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'name' => 'Test Company ' . $this->faker->numberBetween(1, 1000),
                'description' => 'Test Description ' . $this->faker->sentence(),
            ];
        });
    }
}