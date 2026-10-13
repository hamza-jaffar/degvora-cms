<?php

use App\Models\Category;
use App\Models\Gallery;
use App\Models\Post;
use App\Models\User;
use Illuminate\Support\Facades\Config;
use Inertia\Testing\AssertableInertia;

it('blocks access to posts when blog feature is disabled in config', function () {
    Config::set('cms.features.blog', false);
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('admin.posts.index'))
        ->assertNotFound();
});

it('lists posts through the admin index route with filters', function () {
    Config::set('cms.features.blog', true);
    $user = User::factory()->create();
    $category = Category::create([
        'name' => 'Technology',
        'slug' => 'technology',
    ]);

    Post::factory()->create([
        'title' => 'First Tech Article',
        'slug' => 'first-tech-article',
        'category_id' => $category->id,
        'status' => 'published',
        'is_featured' => true,
    ]);

    Post::factory()->create([
        'title' => 'Draft Design Thoughts',
        'slug' => 'draft-design-thoughts',
        'status' => 'draft',
        'is_featured' => false,
    ]);

    $this->actingAs($user)
        ->get(route('admin.posts.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('admin/post/index')
            ->has('posts.data', 2)
            ->has('categories', 1));

    // Filter by search
    $this->actingAs($user)
        ->get(route('admin.posts.index', ['search' => 'First Tech']))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('admin/post/index')
            ->has('posts.data', 1)
            ->where('posts.data.0.title', 'First Tech Article'));

    // Filter by status
    $this->actingAs($user)
        ->get(route('admin.posts.index', ['status' => 'draft']))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('admin/post/index')
            ->has('posts.data', 1)
            ->where('posts.data.0.title', 'Draft Design Thoughts'));

    // Filter by featured
    $this->actingAs($user)
        ->get(route('admin.posts.index', ['is_featured' => '1']))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('admin/post/index')
            ->has('posts.data', 1)
            ->where('posts.data.0.title', 'First Tech Article'));
});

it('displays the create post page', function () {
    Config::set('cms.features.blog', true);
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('admin.posts.create'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('admin/post/create')
            ->where('post', null)
            ->has('categories'));
});

it('creates a post with complete SEO fields and tags', function () {
    Config::set('cms.features.blog', true);
    $user = User::factory()->create();
    $category = Category::create([
        'name' => 'Guides',
        'slug' => 'guides',
    ]);

    Gallery::create([
        'disk' => 'public',
        'filename' => 'cover.webp',
        'original_name' => 'cover.webp',
        'path' => 'gallery/posts/cover.webp',
        'mime_type' => 'image/webp',
        'size' => 12345,
        'alt' => 'Cover image',
        'width' => 1200,
        'height' => 630,
    ]);
    Gallery::create([
        'disk' => 'public',
        'filename' => 'og-cover.webp',
        'original_name' => 'og-cover.webp',
        'path' => 'gallery/posts/og-cover.webp',
        'mime_type' => 'image/webp',
        'size' => 12345,
        'alt' => 'OG Cover image',
        'width' => 1200,
        'height' => 630,
    ]);

    $payload = [
        'title' => 'Mastering Modern CMS Architectures',
        'slug' => 'mastering-modern-cms-architectures',
        'category_id' => $category->id,
        'excerpt' => 'A comprehensive guide on building scalable CMS platforms.',
        'content' => '<p>In-depth content with <strong>rich formatting</strong> and details.</p>',
        'featured_image' => 'gallery/posts/cover.webp',
        'tags' => ['cms', 'laravel', 'architecture'],
        'is_featured' => true,
        'status' => 'published',
        'visibility' => 'public',
        'published_at' => now()->format('Y-m-d H:i:s'),
        'meta_title' => 'Modern CMS Guide | Tech Blog',
        'meta_description' => 'Learn how to build high performance modular CMS applications.',
        'canonical_url' => 'https://example.com/blog/mastering-modern-cms-architectures',
        'og_title' => 'Modern CMS Architecture Guide',
        'og_description' => 'Social preview description for the CMS article.',
        'og_image' => 'gallery/posts/og-cover.webp',
        'robots' => 'index, follow',
    ];

    $this->actingAs($user)
        ->post(route('admin.posts.store'), $payload)
        ->assertRedirect(route('admin.posts.index'));

    $this->assertDatabaseHas('posts', [
        'title' => 'Mastering Modern CMS Architectures',
        'slug' => 'mastering-modern-cms-architectures',
        'category_id' => $category->id,
        'author_id' => $user->id,
        'is_featured' => 1,
        'status' => 'published',
        'visibility' => 'public',
        'meta_title' => 'Modern CMS Guide | Tech Blog',
        'canonical_url' => 'https://example.com/blog/mastering-modern-cms-architectures',
        'og_title' => 'Modern CMS Architecture Guide',
        'robots' => 'index,follow',
    ]);

    $post = Post::where('slug', 'mastering-modern-cms-architectures')->first();
    expect($post)->not->toBeNull()
        ->and($post->tags)->toBe(['cms', 'laravel', 'architecture'])
        ->and($post->is_featured)->toBeTrue();
});

it('validates unique slug and required fields when creating a post', function () {
    Config::set('cms.features.blog', true);
    $user = User::factory()->create();

    Post::factory()->create([
        'title' => 'Existing Post',
        'slug' => 'existing-post',
    ]);

    $this->actingAs($user)
        ->post(route('admin.posts.store'), [
            'title' => '',
            'slug' => 'existing-post',
        ])
        ->assertSessionHasErrors(['title', 'slug']);
});

it('displays the edit page for an existing post', function () {
    Config::set('cms.features.blog', true);
    $user = User::factory()->create();
    $post = Post::factory()->create([
        'title' => 'Editable Post',
        'slug' => 'editable-post',
    ]);

    $this->actingAs($user)
        ->get(route('admin.posts.edit', $post->slug))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('admin/post/edit')
            ->where('post.slug', 'editable-post')
            ->has('categories'));
});

it('updates an existing post while keeping its unique slug', function () {
    Config::set('cms.features.blog', true);
    $user = User::factory()->create();
    $post = Post::factory()->create([
        'title' => 'Initial Title',
        'slug' => 'initial-title',
        'tags' => ['old-tag'],
    ]);

    $payload = [
        'title' => 'Updated Post Title',
        'slug' => 'initial-title',
        'excerpt' => 'Updated excerpt text.',
        'content' => '<p>Updated content body.</p>',
        'tags' => ['updated-tag', 'news'],
        'status' => 'published',
        'visibility' => 'public',
        'is_featured' => false,
        'meta_title' => 'Updated Meta Title',
        'robots' => 'noindex, nofollow',
    ];

    $this->actingAs($user)
        ->put(route('admin.posts.update', $post->slug), $payload)
        ->assertRedirect(route('admin.posts.index'));

    $post->refresh();
    expect($post->title)->toBe('Updated Post Title')
        ->and($post->tags)->toBe(['updated-tag', 'news'])
        ->and($post->robots)->toBe('noindex,nofollow')
        ->and($post->is_featured)->toBeFalse();
});

it('soft deletes, restores, and force deletes a post', function () {
    Config::set('cms.features.blog', true);
    $user = User::factory()->create();
    $post = Post::factory()->create([
        'title' => 'Post to Remove',
        'slug' => 'post-to-remove',
    ]);

    // Soft delete
    $this->actingAs($user)
        ->delete(route('admin.posts.destroy', $post->slug))
        ->assertRedirect(route('admin.posts.index'));

    $this->assertSoftDeleted('posts', ['id' => $post->id]);

    // Restore
    $this->actingAs($user)
        ->post(route('admin.posts.restore', $post->id))
        ->assertRedirect(route('admin.posts.index'));

    $this->assertNotSoftDeleted('posts', ['id' => $post->id]);

    // Soft delete again then force delete
    $post->delete();

    $this->actingAs($user)
        ->delete(route('admin.posts.force-delete', $post->id))
        ->assertRedirect(route('admin.posts.index'));

    $this->assertDatabaseMissing('posts', ['id' => $post->id]);
});

it('has scheduled_at field in the posts table schema and model casts', function () {
    $scheduledDate = now()->addDays(5)->startOfMinute();

    $post = Post::factory()->create([
        'scheduled_at' => $scheduledDate,
    ]);

    $fresh = $post->fresh();
    expect($fresh->scheduled_at)->not->toBeNull()
        ->and($fresh->scheduled_at->equalTo($scheduledDate))->toBeTrue();
});
