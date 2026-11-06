<?php

use App\Models\Page;
use App\Models\Setting;
use App\Models\User;
use App\Services\Theme\ThemeManager;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

it('provides discovered theme templates including subfolders to create page form and excludes 404', function () {
    $user = User::factory()->create();

    $themeSlug = 'storefront-'.Str::lower(Str::random(12));
    $themePath = base_path("themes/{$themeSlug}");
    $viewsPath = $themePath.'/views/templates';
    File::makeDirectory($viewsPath.'/moving', 0755, true);
    File::put($viewsPath.'/page.blade.php', '<h1>Page</h1>');
    File::put($viewsPath.'/home.blade.php', '<h1>Home</h1>');
    File::put($viewsPath.'/moving.blade.php', '<h1>Moving</h1>');
    File::put($viewsPath.'/moving/ssssss.blade.php', '<h1>Subfolder</h1>');
    File::put($viewsPath.'/404.blade.php', '<h1>404</h1>');

    Setting::query()->create([
        'key' => 'active_theme',
        'value' => $themeSlug,
    ]);

    try {
        $this->actingAs($user)
            ->get(route('admin.page.create'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/page/create')
                ->has('templates')
                ->where('templates.0.value', 'template')
                ->where('templates.0.label', 'Page (page.blade.php)')
            );

        $templates = app(ThemeManager::class)->pageTemplates();
        $values = array_column($templates, 'value');

        expect($values)->toContain('moving/ssssss')
            ->toContain('moving')
            ->toContain('home')
            ->toContain('template')
            ->not->toContain('404');
    } finally {
        File::deleteDirectory($themePath);
    }
});

it('can store a page with a subfolder template and normalizes leading slashes', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('admin.page.store'), [
            'name' => 'Moving Sub Page',
            'slug' => 'moving-sub-page',
            'status' => 'published',
            'visibility' => 'public',
            'template' => '/moving/ssssss',
            'robots' => 'index,follow',
            'sort_order' => 1,
        ]);

    $response->assertRedirect(route('admin.page.index'));

    $page = Page::query()->where('slug', 'moving-sub-page')->first();
    expect($page)->not->toBeNull()
        ->and($page->template)->toBe('moving/ssssss');
});

it('rejects storing a page with restricted 404 template', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('admin.page.store'), [
            'name' => 'Restricted Page',
            'slug' => 'restricted-page',
            'status' => 'published',
            'visibility' => 'public',
            'template' => '404',
            'robots' => 'index,follow',
            'sort_order' => 1,
        ]);

    $response->assertSessionHasErrors('template');
    expect(Page::query()->where('slug', 'restricted-page')->exists())->toBeFalse();
});
