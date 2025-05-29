<?php

namespace Database\Factories;

use App\Models\Task;
use App\Models\User;
use App\Models\Company;
use Illuminate\Database\Eloquent\Factories\Factory;

class TaskFactory extends Factory
{
    protected $model = Task::class;

    public function definition(): array
    {
        return [
            'title' => $this->faker->sentence(),
            'description' => $this->faker->paragraph(),
            'status' => $this->faker->randomElement(['pending', 'in_progress', 'completed', 'revision', 'overdue']),
            'start_date' => $this->faker->dateTimeBetween('now', '+1 week'),
            'due_date' => $this->faker->dateTimeBetween('+1 week', '+1 month'),
            'company_id' => Company::factory(),
            'created_by' => User::factory(),
            'created_at' => $this->faker->dateTimeBetween('-1 year'),
            'updated_at' => $this->faker->dateTimeBetween('-1 month'),
        ];
    }

    public function pending(): self
    {
        return $this->state(fn () => ['status' => 'pending']);
    }

    public function inProgress(): self
    {
        return $this->state(fn () => ['status' => 'in_progress']);
    }

    public function completed(): self
    {
        return $this->state(fn () => ['status' => 'completed']);
    }

    public function revision(): self
    {
        return $this->state(fn () => ['status' => 'revision']);
    }

    public function overdue(): self
    {
        return $this->state(fn () => ['status' => 'overdue']);
    }
}