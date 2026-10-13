<?php

use App\Models\Menu;
use App\Models\Page;
use App\Models\Setting;
use App\Models\User;
use App\Services\Theme\ThemeContext;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

it('renders a published public page through the active theme', function () {
    $themeSlug = 'storefront-'.Str::lower(Str::random(12));
    $themePath = createStorefrontTheme($themeSlug, [
        'page' => "@extends('theme::layouts.app')\n@section('content')<h1>{{ \$page->name }}</h1><div>{!! \$page->content !!}</div>@endsection",
    ]);

    Setting::query()->create([
        'key' => 'active_theme',
        'value' => $themeSlug,
    ]);

    Page::query()->create([
        'name' => 'About Us',
        'slug' => 'about',
        'path' => 'about',
        'template' => 'template',
        'status' => 'published',
        'visibility' => 'public',
        'content' => '<h2>Welcome to our company</h2><p>This is an About page.</p>',
    ]);

    try {
        $this->get('/about')
            ->assertOk()
            ->assertSee("HEADER {$themeSlug}")
            ->assertSee('About Us')
            ->assertSee('<h2>Welcome to our company</h2>', false)
            ->assertSee('FOOTER');
    } finally {
        File::deleteDirectory($themePath);
    }
});

it('provides active hierarchical menu items with resolved page links', function () {
    $page = Page::query()->create([
        'name' => 'About',
        'slug' => 'about',
        'path' => 'about',
        'template' => 'template',
        'status' => 'published',
        'visibility' => 'public',
        'content' => 'About page',
    ]);
    $menu = Menu::query()->create(['name' => 'Main Menu']);
    $menu->menuItems()->create([
        'label' => 'Second item',
        'sort_order' => 1,
        'is_active' => true,
    ]);
    $firstItem = $menu->menuItems()->create([
        'label' => 'First item',
        'sort_order' => 0,
        'is_active' => true,
    ]);
    $menu->menuItems()->create([
        'parent_id' => $firstItem->id,
        'label' => 'About page',
        'type' => 'page',
        'reference_id' => $page->id,
        'sort_order' => 0,
        'is_active' => true,
    ]);
    $menu->menuItems()->create([
        'label' => 'Inactive item',
        'sort_order' => 2,
        'is_active' => false,
    ]);

    $menuItems = app(ThemeContext::class)
        ->menu()
        ->get('Main Menu')
        ?->menuItems;

    expect($menuItems?->pluck('label')->all())
        ->toBe(['First item', 'Second item'])
        ->and($menuItems?->first()?->children->first()?->href)
        ->toBe('/about');
});

it('renders the active theme page template when the page template is template', function () {
    $themeSlug = 'storefront-'.Str::lower(Str::random(12));
    $themePath = createStorefrontTheme($themeSlug, [
        'page' => "@extends('theme::layouts.app')\n@section('content')THEME PAGE TEMPLATE @endsection",
    ]);

    Setting::query()->create([
        'key' => 'active_theme',
        'value' => $themeSlug,
    ]);

    Page::query()->create([
        'name' => 'Campaign',
        'slug' => 'campaign',
        'path' => 'campaign',
        'template' => 'template',
        'status' => 'published',
        'visibility' => 'public',
        'content' => 'Campaign content',
    ]);

    try {
        $this->get('/campaign')
            ->assertOk()
            ->assertSee('THEME PAGE TEMPLATE');
    } finally {
        File::deleteDirectory($themePath);
    }
});

it('falls back to the default theme when the active theme has no page template', function () {
    $themeSlug = 'storefront-'.Str::lower(Str::random(12));
    $themePath = createStorefrontTheme($themeSlug, [
        'landing' => "@extends('theme::layouts.app')\n@section('content')CUSTOM THEME @endsection",
    ]);

    Setting::query()->create([
        'key' => 'active_theme',
        'value' => $themeSlug,
    ]);

    Page::query()->create([
        'name' => 'Legacy',
        'slug' => 'legacy',
        'path' => 'legacy',
        'template' => 'template',
        'status' => 'published',
        'visibility' => 'public',
        'content' => 'Legacy content',
    ]);

    try {
        $this->get('/legacy')
            ->assertOk()
            ->assertSee('DegvoraCMS')
            ->assertDontSee('CUSTOM THEME')
            ->assertSee('Legacy');
    } finally {
        File::deleteDirectory($themePath);
    }
});

it('does not render an active theme when the page template is not template', function () {
    $themeSlug = 'storefront-'.Str::lower(Str::random(12));
    $themePath = createStorefrontTheme($themeSlug, [
        'page' => "@extends('theme::layouts.app')\n@section('content')SAFE PAGE TEMPLATE @endsection",
    ]);

    Setting::query()->create([
        'key' => 'active_theme',
        'value' => $themeSlug,
    ]);

    Page::query()->create([
        'name' => 'Unsafe Template',
        'slug' => 'unsafe-template',
        'path' => 'unsafe-template',
        'template' => '../../outside',
        'status' => 'published',
        'visibility' => 'public',
        'content' => 'Content',
    ]);

    try {
        $this->get('/unsafe-template')
            ->assertOk()
            ->assertSee('Content')
            ->assertDontSee('HEADER '.$themeSlug);
    } finally {
        File::deleteDirectory($themePath);
    }
});

it('uses the default theme when the configured active theme is unavailable', function () {
    $themeSlug = 'missing-theme-'.Str::lower(Str::random(12));

    Setting::query()->create([
        'key' => 'active_theme',
        'value' => $themeSlug,
    ]);

    Page::query()->create([
        'name' => 'Default Theme Page',
        'slug' => 'default-theme-page',
        'path' => 'default-theme-page',
        'template' => 'template',
        'status' => 'published',
        'visibility' => 'public',
        'content' => '<p>Default theme content</p>',
    ]);

    $this->get('/default-theme-page')
        ->assertOk()
        ->assertSee('DegvoraCMS')
        ->assertSee('Default Theme Page')
        ->assertSee('<p>Default theme content</p>', false);
});

it('renders configured SEO metadata and analytics on default public pages', function () {
    Setting::query()->create([
        'key' => 'meta_title',
        'value' => 'Global page title',
    ]);
    Setting::query()->create([
        'key' => 'meta_description',
        'value' => 'A default description for the website.',
    ]);
    Setting::query()->create([
        'key' => 'google_analytics_id',
        'value' => 'G-ABC12345',
    ]);
    Setting::query()->create([
        'key' => 'google_site_verification',
        'value' => 'verify-token-123',
    ]);

    Page::query()->create([
        'name' => 'Searchable',
        'slug' => 'searchable',
        'path' => 'searchable',
        'template' => 'page',
        'status' => 'published',
        'visibility' => 'public',
        'content' => 'Page content',
    ]);

    $this->get('/searchable')
        ->assertOk()
        ->assertSee('<title>Global page title</title>', false)
        ->assertSee('A default description for the website.')
        ->assertSee('G-ABC12345')
        ->assertSee('verify-token-123');
});

it('renders the configured footer logo on default public pages', function () {
    Storage::fake('public');
    Storage::disk('public')->put('gallery/footer-logo.png', 'logo');

    Setting::query()->create([
        'key' => 'footer_logo',
        'value' => 'gallery/footer-logo.png',
    ]);
    Setting::query()->create([
        'key' => 'name',
        'value' => 'Footer logo site',
    ]);
    Page::query()->create([
        'name' => 'About',
        'slug' => 'about-footer-logo',
        'path' => 'about-footer-logo',
        'template' => 'page',
        'status' => 'published',
        'visibility' => 'public',
        'content' => 'About page',
    ]);

    $this->get('/about-footer-logo')
        ->assertOk()
        ->assertSee('<footer>', false)
        ->assertSee('src="'.Storage::disk('public')->url('gallery/footer-logo.png').'"', false)
        ->assertSee('alt="Footer logo site"', false);
});

it('renders the configured footer logo in the active storefront theme', function () {
    Storage::fake('public');
    Storage::disk('public')->put('gallery/footer-logo.png', 'logo');

    Setting::query()->create([
        'key' => 'active_theme',
        'value' => 'store-front',
    ]);
    Setting::query()->create([
        'key' => 'footer_logo',
        'value' => 'gallery/footer-logo.png',
    ]);
    Setting::query()->create([
        'key' => 'name',
        'value' => 'Footer logo site',
    ]);
    Page::query()->create([
        'name' => 'About',
        'slug' => 'about-themed-footer-logo',
        'path' => 'about-themed-footer-logo',
        'template' => 'template',
        'status' => 'published',
        'visibility' => 'public',
        'content' => 'About page',
    ]);

    $this->get('/about-themed-footer-logo')
        ->assertOk()
        ->assertSee('<img class="logo" src="'.Storage::disk('public')->url('gallery/footer-logo.png').'" width="200"', false)
        ->assertSee('alt="Footer logo site"', false)
        ->assertDontSee('<svg class="logo"', false);
});

it('refreshes cached public page content after an admin update', function () {
    $user = User::factory()->create();
    $page = Page::query()->create([
        'name' => 'Cached page',
        'slug' => 'cached-page',
        'path' => '/cached-page',
        'template' => 'page',
        'status' => 'published',
        'visibility' => 'public',
        'content' => 'Original cached content',
    ]);
    $menu = Menu::query()->create(['name' => 'Main menu']);
    Cache::forget('storefront.pages.slug.v2.cached-page');
    Cache::put('storefront.pages.slug.cached-page', $page);

    $this->get('/cached-page')
        ->assertOk()
        ->assertSee('Original cached content');

    expect(Cache::get('storefront.pages.slug.v2.cached-page'))->toBeArray();
    expect(Cache::get('storefront.pages.slug.cached-page'))->toBeNull();

    $this->actingAs($user)
        ->put(route('admin.page.update', $page), [
            'name' => 'Cached page',
            'slug' => 'cached-page',
            'excerpt' => '',
            'content' => 'Updated cached content',
            'parent_id' => null,
            'meta_title' => '',
            'meta_description' => '',
            'canonical_url' => null,
            'robots' => 'index,follow',
            'status' => 'published',
            'visibility' => 'public',
            'password' => '',
            'published_at' => null,
            'template' => 'page',
            'sort_order' => 0,
            'featured_media' => null,
        ])
        ->assertRedirect(route('admin.page.index'));

    $this->get('/cached-page')
        ->assertOk()
        ->assertSee('Updated cached content')
        ->assertDontSee('Original cached content');

    $this->actingAs($user)
        ->get(route('admin.menus.items.index', $menu))
        ->assertInertia(fn (Assert $response) => $response
            ->where('pages.0.name', 'Cached page'));
});

it('makes safe site settings available to active theme templates', function () {
    $themeSlug = 'storefront-'.Str::lower(Str::random(12));
    $themePath = createStorefrontTheme($themeSlug, [
        'page' => "@extends('theme::layouts.app')\n@section('content'){{ \$siteSettings['tagline'] ?? 'MISSING' }} @endsection",
    ]);

    Setting::query()->create([
        'key' => 'active_theme',
        'value' => $themeSlug,
    ]);
    Setting::query()->create([
        'key' => 'tagline',
        'value' => 'Theme site tagline',
    ]);
    Setting::query()->create([
        'key' => 'mail_password',
        'value' => 'sensitive-ciphertext',
    ]);
    Page::query()->create([
        'name' => 'Themed',
        'slug' => 'themed-settings',
        'path' => 'themed-settings',
        'template' => 'template',
        'status' => 'published',
        'visibility' => 'public',
        'content' => 'Theme content',
    ]);

    try {
        $this->get('/themed-settings')
            ->assertOk()
            ->assertSee('Theme site tagline')
            ->assertDontSee('sensitive-ciphertext');
    } finally {
        File::deleteDirectory($themePath);
    }
});

it('uses the existing page view when the page template is page', function () {
    $themeSlug = 'storefront-'.Str::lower(Str::random(12));
    $themePath = createStorefrontTheme($themeSlug, [
        'page' => "@extends('theme::layouts.app')\n@section('content')ACTIVE THEME PAGE @endsection",
    ]);

    Setting::query()->create([
        'key' => 'active_theme',
        'value' => $themeSlug,
    ]);

    Page::query()->create([
        'name' => 'Standard Page',
        'slug' => 'standard-page',
        'path' => 'standard-page',
        'template' => 'page',
        'status' => 'published',
        'visibility' => 'public',
        'content' => '<p>Standard page content</p>',
    ]);

    try {
        $this->get('/standard-page')
            ->assertOk()
            ->assertSee('<p>Standard page content</p>', false)
            ->assertDontSee('HEADER '.$themeSlug)
            ->assertDontSee('ACTIVE THEME PAGE');
    } finally {
        File::deleteDirectory($themePath);
    }
});

it('returns 404 when the requested page is not published', function () {
    Page::query()->create([
        'name' => 'Draft',
        'slug' => 'draft-page',
        'path' => 'draft-page',
        'template' => 'page',
        'status' => 'draft',
        'visibility' => 'public',
        'content' => 'Draft content',
    ]);

    $this->get('/draft-page')->assertNotFound();
});

it('returns 404 when the requested page is not public', function () {
    Page::query()->create([
        'name' => 'Private',
        'slug' => 'private-page',
        'path' => 'private-page',
        'template' => 'page',
        'status' => 'published',
        'visibility' => 'private',
        'content' => 'Private content',
    ]);

    $this->get('/private-page')->assertNotFound();
});

it('returns 404 when the requested page has been soft deleted', function () {
    $page = Page::query()->create([
        'name' => 'Deleted',
        'slug' => 'deleted-page',
        'path' => 'deleted-page',
        'template' => 'page',
        'status' => 'published',
        'visibility' => 'public',
        'content' => 'Deleted content',
    ]);
    $page->delete();

    $this->get('/deleted-page')->assertNotFound();
});

/**
 * @param  array<string, string>  $templates
 */
function createStorefrontTheme(string $slug, array $templates): string
{
    $themePath = base_path("themes/{$slug}");
    $viewsPath = $themePath.'/views';

    File::makeDirectory($viewsPath.'/layouts', 0755, true);
    File::makeDirectory($viewsPath.'/templates', 0755, true);
    File::makeDirectory($viewsPath.'/components', 0755, true);
    File::put(
        $viewsPath.'/layouts/app.blade.php',
        "@include('theme::components.header') @yield('content') @include('theme::components.footer')"
    );
    File::put($viewsPath.'/components/header.blade.php', "HEADER {$slug}");
    File::put($viewsPath.'/components/footer.blade.php', 'FOOTER');

    foreach ($templates as $name => $contents) {
        File::put($viewsPath."/templates/{$name}.blade.php", $contents);
    }

    return $themePath;
}
