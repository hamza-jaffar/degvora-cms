<?php

use App\Models\Category;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

it('filters categories by inactive status and applies the requested page size', function () {
    $user = User::factory()->create();

    Category::create([
        'name' => 'Active category',
        'slug' => 'active-category',
        'is_active' => true,
    ]);
    Category::create([
        'name' => 'Inactive category',
        'slug' => 'inactive-category',
        'is_active' => false,
    ]);

    $this->actingAs($user)
        ->get(route('admin.category.index', [
            'status' => 'inactive',
            'per_page' => 25,
        ]))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/category/index')
            ->has('categories.data', 1)
            ->where('categories.data.0.name', 'Inactive category')
            ->where('categories.per_page', 25)
            ->where('filters.status', 'inactive'));
});

it('filters categories by featured status', function () {
    $user = User::factory()->create();
    Category::create([
        'name' => 'Featured category',
        'slug' => 'featured-category',
        'is_featured' => true,
    ]);
    Category::create([
        'name' => 'Standard category',
        'slug' => 'standard-category',
        'is_featured' => false,
    ]);

    $this->actingAs($user)
        ->get(route('admin.category.index', ['is_featured' => '1']))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/category/index')
            ->has('categories.data', 1)
            ->where('categories.data.0.name', 'Featured category')
            ->where('filters.is_featured', '1'));
});

it('includes a public thumbnail URL for categories that have an image', function () {
    Storage::fake('public');
    $user = User::factory()->create();
    $imagePath = 'categories/garden.jpg';
    Storage::disk('public')->put($imagePath, 'image-content');
    Category::create([
        'name' => 'Garden',
        'slug' => 'garden',
        'image' => $imagePath,
    ]);

    $this->actingAs($user)
        ->get(route('admin.category.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('categories.data.0.image_url', Storage::disk('public')->url($imagePath)));
});

it('preselects the parent category from the create page query', function () {
    $user = User::factory()->create();
    $parent = Category::create([
        'name' => 'Garden',
        'slug' => 'garden',
    ]);

    $this->actingAs($user)
        ->get(route('admin.category.create', [
            'parent_category_slug' => $parent->slug,
        ]))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/category/create')
            ->where('initial_parent_id', $parent->id)
            ->where('parent_category_slug', $parent->slug));
});

it('renders an edit form for the selected category', function () {
    $user = User::factory()->create();
    $category = Category::create([
        'name' => 'Garden tools',
        'slug' => 'garden-tools',
    ]);

    $this->actingAs($user)
        ->get(route('admin.category.edit', ['category' => $category->slug]))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/category/edit')
            ->where('category.id', $category->id)
            ->where('category.name', 'Garden tools')
            ->has('media.data')
            ->has('parent_categories'));
});

it('updates category details and refreshes its slug', function () {
    $user = User::factory()->create();
    $parent = Category::create([
        'name' => 'Outdoor',
        'slug' => 'outdoor',
    ]);
    $category = Category::create([
        'name' => 'Garden tools',
        'slug' => 'garden-tools',
        'is_active' => true,
    ]);

    $this->actingAs($user)
        ->post(route('admin.category.update', ['id' => $category->id]), [
            'name' => 'Outdoor tools',
            'parent_id' => (string) $parent->id,
            'description' => 'Tools for the garden',
            'image' => 'categories/outdoor-tools.jpg',
            'is_active' => '1',
            'is_featured' => '0',
            'meta_title' => 'Outdoor tools',
            'meta_description' => 'Garden and outdoor tools',
        ])
        ->assertRedirect(route('admin.category.index'));

    expect($category->fresh())
        ->name->toBe('Outdoor tools')
        ->slug->toBe('outdoor-tools')
        ->parent_id->toBe($parent->id)
        ->image->toBe('categories/outdoor-tools.jpg')
        ->is_active->toBeTrue()
        ->is_featured->toBeFalse();
});

it('deletes a category from its row action', function () {
    $user = User::factory()->create();
    $category = Category::create([
        'name' => 'Seasonal',
        'slug' => 'seasonal',
    ]);

    $this->actingAs($user)
        ->delete(route('admin.category.delete', ['id' => $category->id]))
        ->assertRedirect(route('admin.category.index'));

    $this->assertDatabaseMissing('categories', ['id' => $category->id]);
});
