<?php

use App\Models\Gallery;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

it('stores uploaded files and their gallery metadata', function () {
    Storage::fake('public');
    $user = User::factory()->create();
    $file = UploadedFile::fake()->image('cover.jpg', 640, 480);

    $response = $this->actingAs($user)->post(route('admin.gallery.upload'), [
        'files' => [$file],
    ]);

    $response->assertRedirect(route('admin.gallery.index'));

    $gallery = Gallery::query()->sole();
    expect($gallery->original_name)->toBe('cover.jpg');
    expect($gallery->mime_type)->toBe('image/jpeg');
    Storage::disk('public')->assertExists($gallery->path);

    $this->actingAs($user)
        ->get(route('admin.gallery.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('media.data', 1)
            ->where('media.data.0.type', 'image'));
});

it('shows uploaded videos in the gallery media props', function () {
    Storage::fake('public');
    $user = User::factory()->create();
    $file = UploadedFile::fake()->create('clip.mp4', 512, 'video/mp4');

    $this->actingAs($user)
        ->post(route('admin.gallery.upload'), ['files' => [$file]])
        ->assertRedirect(route('admin.gallery.index'));

    $this->actingAs($user)
        ->get(route('admin.gallery.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/gallery/index')
            ->has('media.data', 1)
            ->where('media.data.0.type', 'video')
            ->where('media.data.0.name', 'clip.mp4'));
});

it('provides gallery media and type counts to the category image picker', function () {
    $user = User::factory()->create();

    Gallery::create([
        'disk' => 'public',
        'filename' => 'cover.jpg',
        'original_name' => 'cover.jpg',
        'path' => 'gallery/cover.jpg',
        'mime_type' => 'image/jpeg',
        'alt' => 'Category cover',
        'size' => '14',
        'width' => '1',
        'height' => '1',
    ]);

    Gallery::create([
        'disk' => 'public',
        'filename' => 'clip.mp4',
        'original_name' => 'clip.mp4',
        'path' => 'gallery/clip.mp4',
        'mime_type' => 'video/mp4',
        'alt' => 'clip.mp4',
        'size' => '14',
        'width' => '0',
        'height' => '0',
    ]);

    $this->actingAs($user)
        ->get(route('admin.category.create'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/category/create')
            ->has('media.data', 2)
            ->where('counts.all', 2)
            ->where('counts.image', 1)
            ->where('counts.video', 1));
});

it('filters and searches category picker media on the server', function () {
    $user = User::factory()->create();

    foreach ([
        ['cover.jpg', 'image/jpeg', 'Summer cover'],
        ['autumn.jpg', 'image/jpeg', 'Autumn'],
        ['cover-reel.mp4', 'video/mp4', 'Launch reel'],
        ['guide.pdf', 'application/pdf', 'Brand guide'],
    ] as [$name, $mimeType, $alt]) {
        Gallery::create([
            'disk' => 'public',
            'filename' => $name,
            'original_name' => $name,
            'path' => "gallery/{$name}",
            'mime_type' => $mimeType,
            'alt' => $alt,
            'size' => '14',
            'width' => '1',
            'height' => '1',
        ]);
    }

    $this->actingAs($user)
        ->get(route('admin.category.create', ['filter' => 'image', 'search' => 'cover']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('filter', 'image')
            ->where('search', 'cover')
            ->has('media.data', 1)
            ->where('media.data.0.name', 'cover.jpg')
            ->where('media.data.0.type', 'image'));

    $this->get(route('admin.category.create', ['filter' => 'video', 'search' => 'reel']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('filter', 'video')
            ->where('search', 'reel')
            ->has('media.data', 1)
            ->where('media.data.0.type', 'video'));

    $this->get(route('admin.category.create', ['filter' => 'other', 'search' => 'guide']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('filter', 'other')
            ->where('search', 'guide')
            ->has('media.data', 1)
            ->where('media.data.0.type', 'other'));
});

it('paginates category picker results after applying the server-side search', function () {
    $user = User::factory()->create();

    foreach (range(1, 25) as $index) {
        $name = "cover-{$index}.jpg";
        Gallery::create([
            'disk' => 'public',
            'filename' => $name,
            'original_name' => $name,
            'path' => "gallery/{$name}",
            'mime_type' => 'image/jpeg',
            'alt' => $name,
            'size' => '14',
            'width' => '1',
            'height' => '1',
        ]);
    }

    $this->actingAs($user)
        ->get(route('admin.category.create', [
            'filter' => 'image',
            'search' => 'cover-',
        ]))
        ->assertInertia(fn (Assert $page) => $page
            ->has('media.data', 24)
            ->where('counts.image', 25));

    $this->get(route('admin.category.create', [
        'filter' => 'image',
        'search' => 'cover-',
        'page' => 2,
    ]))
        ->assertInertia(fn (Assert $page) => $page
            ->has('media.data', 1)
            ->where('media.data.0.type', 'image'));
});

it('uploads an image from the category picker and returns it as the selection', function () {
    Storage::fake('public');
    $user = User::factory()->create();
    $file = UploadedFile::fake()->image('category-cover.jpg', 640, 480);

    $this->actingAs($user)
        ->from(route('admin.category.create'))
        ->post(route('admin.gallery.picker.upload'), ['file' => $file])
        ->assertRedirect(route('admin.category.create'));

    $gallery = Gallery::query()->sole();
    expect($gallery->original_name)->toBe('category-cover.jpg');
    Storage::disk('public')->assertExists($gallery->path);

    $this->get(route('admin.category.create'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('pickerAsset.id', $gallery->id)
            ->where('pickerAsset.name', 'category-cover.jpg')
            ->where('pickerAsset.path', $gallery->path));
});

it('rejects non-image uploads from the category picker', function () {
    $user = User::factory()->create();
    $file = UploadedFile::fake()->create('document.pdf', 128, 'application/pdf');

    $this->actingAs($user)
        ->from(route('admin.category.create'))
        ->post(route('admin.gallery.picker.upload'), ['file' => $file])
        ->assertSessionHasErrors('file');

    $this->assertDatabaseCount('galleries', 0);
});

it('accepts videos larger than the image upload limit', function () {
    Storage::fake('public');
    $user = User::factory()->create();
    $file = UploadedFile::fake()->create('long-clip.mp4', 11 * 1024, 'video/mp4');

    $this->actingAs($user)
        ->post(route('admin.gallery.upload'), ['files' => [$file]])
        ->assertRedirect(route('admin.gallery.index'));

    $gallery = Gallery::query()->sole();
    expect($gallery->mime_type)->toBe('video/mp4');
    Storage::disk('public')->assertExists($gallery->path);
});

it('classifies uploaded documents as other files', function () {
    Storage::fake('public');
    $user = User::factory()->create();
    $file = UploadedFile::fake()->create('brief.pdf', 64, 'application/pdf');

    $this->actingAs($user)
        ->post(route('admin.gallery.upload'), ['files' => [$file]])
        ->assertRedirect(route('admin.gallery.index'));

    $this->actingAs($user)
        ->get(route('admin.gallery.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('media.data', 1)
            ->where('media.data.0.type', 'other'));
});

it('paginates media and filters pages by category', function () {
    $user = User::factory()->create();

    foreach (range(1, 25) as $index) {
        Gallery::create([
            'disk' => 'public',
            'filename' => "image-{$index}.jpg",
            'original_name' => "image-{$index}.jpg",
            'path' => "gallery/image-{$index}.jpg",
            'mime_type' => 'image/jpeg',
            'alt' => "image-{$index}.jpg",
            'size' => '14',
            'width' => '1',
            'height' => '1',
        ]);
    }

    Gallery::create([
        'disk' => 'public',
        'filename' => 'clip.mp4',
        'original_name' => 'clip.mp4',
        'path' => 'gallery/clip.mp4',
        'mime_type' => 'video/mp4',
        'alt' => 'clip.mp4',
        'size' => '14',
        'width' => '0',
        'height' => '0',
    ]);

    $this->actingAs($user)
        ->get(route('admin.gallery.index', ['filter' => 'image']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('filter', 'image')
            ->has('media.data', 24)
            ->where('counts.image', 25));

    $this->actingAs($user)
        ->get(route('admin.gallery.index', ['filter' => 'image', 'page' => 2]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('filter', 'image')
            ->has('media.data', 1)
            ->where('media.data.0.type', 'image'));

    $this->actingAs($user)
        ->get(route('admin.gallery.index', ['filter' => 'video']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('filter', 'video')
            ->has('media.data', 1)
            ->where('media.data.0.type', 'video'));
});

it('deletes the stored file and its gallery record', function () {
    Storage::fake('public');
    $user = User::factory()->create();
    $path = 'gallery/cover.jpg';
    Storage::disk('public')->put($path, 'image contents');
    $gallery = Gallery::create([
        'disk' => 'public',
        'filename' => 'cover.jpg',
        'original_name' => 'cover.jpg',
        'path' => $path,
        'mime_type' => 'image/jpeg',
        'alt' => 'cover.jpg',
        'size' => '14',
        'width' => '1',
        'height' => '1',
    ]);

    $response = $this->actingAs($user)
        ->withHeaders(['referer' => route('admin.gallery.index')])
        ->delete(route('admin.gallery.destroy', $gallery));

    $response->assertRedirect(route('admin.gallery.index'));
    $this->assertDatabaseMissing('galleries', ['id' => $gallery->id]);
    Storage::disk('public')->assertMissing($path);
});

it('requires authentication to delete media', function () {
    $gallery = Gallery::create([
        'disk' => 'public',
        'filename' => 'cover.jpg',
        'original_name' => 'cover.jpg',
        'path' => 'gallery/cover.jpg',
        'mime_type' => 'image/jpeg',
        'alt' => 'cover.jpg',
        'size' => '14',
        'width' => '1',
        'height' => '1',
    ]);

    $response = $this->delete(route('admin.gallery.destroy', $gallery));

    $response->assertRedirect(route('login'));
    $this->assertModelExists($gallery);
});

it('paginates gallery media and filters pages by category', function () {
    $user = User::factory()->create();

    foreach (range(1, 25) as $index) {
        Gallery::create([
            'disk' => 'public',
            'filename' => "image-{$index}.jpg",
            'original_name' => "image-{$index}.jpg",
            'path' => "gallery/image-{$index}.jpg",
            'mime_type' => 'image/jpeg',
            'alt' => "image-{$index}.jpg",
            'size' => '14',
            'width' => '1',
            'height' => '1',
        ]);
    }

    Gallery::create([
        'disk' => 'public',
        'filename' => 'clip.mp4',
        'original_name' => 'clip.mp4',
        'path' => 'gallery/clip.mp4',
        'mime_type' => 'video/mp4',
        'alt' => 'clip.mp4',
        'size' => '14',
        'width' => '0',
        'height' => '0',
    ]);

    $this->actingAs($user)
        ->get(route('admin.gallery.index', ['filter' => 'image']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('filter', 'image')
            ->has('media.data', 24)
            ->where('counts.image', 25));

    $this->actingAs($user)
        ->get(route('admin.gallery.index', ['filter' => 'image', 'page' => 2]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('filter', 'image')
            ->has('media.data', 1)
            ->where('media.data.0.type', 'image'));

    $this->actingAs($user)
        ->get(route('admin.gallery.index', ['filter' => 'video']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('filter', 'video')
            ->has('media.data', 1)
            ->where('media.data.0.type', 'video'));
});

it('requires at least one file', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('admin.gallery.upload'));

    $response->assertSessionHasErrors('files');
    $this->assertDatabaseCount('galleries', 0);
});

it('requires authentication', function () {
    $response = $this->post(route('admin.gallery.upload'));

    $response->assertRedirect(route('login'));
});
