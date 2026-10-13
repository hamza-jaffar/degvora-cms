<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Post>
 */
class PostFactory extends Factory
{
    protected $model = Post::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->sentence();

        return [
            'author_id' => User::factory(),
            'category_id' => null,
            'title' => $title,
            'slug' => Str::slug($title),
            'excerpt' => fake()->paragraph(),
            'content' => '<p>'.fake()->paragraphs(3, true).'</p>',
            'featured_image' => null,
            'tags' => ['news', 'updates'],
            'is_featured' => false,
            'status' => 'published',
            'visibility' => 'public',
            'password' => null,
            'published_at' => now(),
            'scheduled_at' => null,
            'meta_title' => $title,
            'meta_description' => fake()->sentence(),
            'canonical_url' => null,
            'og_title' => null,
            'og_description' => null,
            'og_image' => null,
            'robots' => 'index,follow',
        ];
    }

    public function draft(): static
    {
        return $this->state(fn () => [
            'status' => 'draft',
            'published_at' => null,
        ]);
    }

    public function scheduled(): static
    {
        return $this->state(fn () => [
            'status' => 'scheduled',
            'scheduled_at' => now()->addDays(3),
        ]);
    }

    public function featured(): static
    {
        return $this->state(fn () => [
            'is_featured' => true,
        ]);
    }

    public function withCategory(?Category $category = null): static
    {
        return $this->state(fn () => [
            'category_id' => $category?->id ?? Category::factory(),
        ]);
    }
}
