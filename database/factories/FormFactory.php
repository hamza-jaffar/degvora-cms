<?php

namespace Database\Factories;

use App\Models\Form;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Form>
 */
class FormFactory extends Factory
{
    protected $model = Form::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->words(2, true);

        return [
            'name' => ucwords($name),
            'slug' => Str::slug($name),
            'description' => fake()->sentence(),
            'is_active' => true,
            'submit_button_text' => 'Submit',
            'success_message' => 'Thank you! Your submission has been received.',
            'notification_email' => fake()->safeEmail(),
            'fields' => [
                [
                    'id' => 'f_name',
                    'name' => 'full_name',
                    'label' => 'Full Name',
                    'type' => 'text',
                    'placeholder' => 'Enter your name',
                    'required' => true,
                    'width' => 'full',
                ],
                [
                    'id' => 'f_email',
                    'name' => 'email',
                    'label' => 'Email Address',
                    'type' => 'email',
                    'placeholder' => 'Enter your email',
                    'required' => true,
                    'width' => 'full',
                ],
                [
                    'id' => 'f_message',
                    'name' => 'message',
                    'label' => 'Message',
                    'type' => 'textarea',
                    'placeholder' => 'Your message',
                    'required' => false,
                    'width' => 'full',
                ],
            ],
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
