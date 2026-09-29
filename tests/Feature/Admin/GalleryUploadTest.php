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
