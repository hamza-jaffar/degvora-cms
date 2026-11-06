<?php

namespace Database\Factories;

use App\Models\Form;
use App\Models\FormSubmission;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FormSubmission>
 */
class FormSubmissionFactory extends Factory
{
    protected $model = FormSubmission::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'form_id' => Form::factory(),
            'data' => [
                'full_name' => fake()->name(),
                'email' => fake()->safeEmail(),
                'message' => fake()->paragraph(),
            ],
            'status' => 'unread',
            'ip_address' => fake()->ipv4(),
            'user_agent' => fake()->userAgent(),
            'is_starred' => false,
        ];
    }

    public function read(): static
    {
        return $this->state(fn () => ['status' => 'read']);
    }

    public function archived(): static
    {
        return $this->state(fn () => ['status' => 'archived']);
    }

    public function starred(): static
    {
        return $this->state(fn () => ['is_starred' => true]);
    }
}
