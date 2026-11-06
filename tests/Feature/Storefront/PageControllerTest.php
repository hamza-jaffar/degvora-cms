<?php

use App\Models\Menu;
use App\Models\Page;
use App\Models\Setting;
use App\Models\User;
use App\Services\Theme\ThemeContext;
use App\Services\Theme\ThemeManager;
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
        'path' => '/company/about',
        'template' => 'template',
        'status' => 'published',
        'visibility' => 'public',
        'content' => 'About page',
    ]);
    $menu = Menu::query()->create([
        'name' => 'Footer Menu',
        'location' => 'footer',
    ]);
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

    $menuItemsByName = app(ThemeContext::class)
        ->menu()
        ->get('Footer Menu')
        ?->menuItems;

    $menuItemsByLocation = app(ThemeContext::class)
        ->menu()
        ->get('footer')
        ?->menuItems;

    expect($menuItemsByName?->pluck('label')->all())
        ->toBe(['First item', 'Second item'])
        ->and($menuItemsByName?->first()?->children->first()?->href)
        ->toBe('/company/about')
        ->and($menuItemsByLocation?->pluck('label')->all())
        ->toBe(['First item', 'Second item']);
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

    $themePath = createStorefrontTheme('store-front', [
        'page' => "@extends('theme::layouts.app')\n@section('content')Themed page@endsection",
    ]);
    File::put(
        $themePath.'/views/components/footer.blade.php',
        '@if(!empty($siteSettings[\'footer_logo_url\']))<img class="logo" src="{{ $siteSettings[\'footer_logo_url\'] }}" width="200" alt="{{ $siteSettings[\'name\'] }}">@else<svg class="logo"></svg>@endif'
    );

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

    try {
        $this->get('/about-themed-footer-logo')
            ->assertOk()
            ->assertSee('<img class="logo" src="'.Storage::disk('public')->url('gallery/footer-logo.png').'" width="200"', false)
            ->assertSee('alt="Footer logo site"', false)
            ->assertDontSee('<svg class="logo"', false);
    } finally {
        File::deleteDirectory($themePath);
    }
});

it('renders custom theme templates like moving through the active theme', function () {
    $themeSlug = 'storefront-'.Str::lower(Str::random(12));
    $themePath = createStorefrontTheme($themeSlug, [
        'page' => "@extends('theme::layouts.app')\n@section('content')STANDARD PAGE @endsection",
        'moving' => "@extends('theme::layouts.app')\n@section('content')MOVING THEME TEMPLATE @endsection",
    ]);

    Setting::query()->create([
        'key' => 'active_theme',
        'value' => $themeSlug,
    ]);

    Page::query()->create([
        'name' => 'Moving Page',
        'slug' => 'moving',
        'path' => 'moving',
        'template' => 'page',
        'status' => 'published',
        'visibility' => 'public',
        'content' => 'Moving page content',
    ]);

    try {
        $this->get('/moving')
            ->assertOk()
            ->assertSee("HEADER {$themeSlug}")
            ->assertSee('MOVING THEME TEMPLATE')
            ->assertSee('FOOTER');
    } finally {
        File::deleteDirectory($themePath);
    }
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

it('renders the root / page through the active theme home template', function () {
    $themeSlug = 'storefront-'.Str::lower(Str::random(12));
    $themePath = createStorefrontTheme($themeSlug, [
        'page' => "@extends('theme::layouts.app')\n@section('content')PAGE TEMPLATE @endsection",
        'home' => "@extends('theme::layouts.app')\n@section('content')HOME THEME TEMPLATE @endsection",
    ]);

    Setting::query()->create([
        'key' => 'active_theme',
        'value' => $themeSlug,
    ]);

    try {
        $this->get('/')
            ->assertOk()
            ->assertSee("HEADER {$themeSlug}")
            ->assertSee('HOME THEME TEMPLATE')
            ->assertSee('FOOTER');
    } finally {
        File::deleteDirectory($themePath);
    }
});

it('allows an admin to create and update a page with slug /', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('admin.page.store'), [
            'name' => 'Home Page',
            'slug' => '/',
            'excerpt' => 'Welcome home',
            'content' => '<p>Welcome to our homepage</p>',
            'parent_id' => null,
            'meta_title' => 'Home SEO Title',
            'meta_description' => 'Home SEO Description',
            'canonical_url' => null,
            'robots' => 'index,follow',
            'status' => 'published',
            'visibility' => 'public',
            'password' => '',
            'published_at' => null,
            'template' => 'template',
            'sort_order' => 0,
            'featured_media' => null,
        ])
        ->assertRedirect(route('admin.page.index'));

    $page = Page::query()->where('slug', '/')->first();
    expect($page)->not->toBeNull()
        ->and($page->path)->toBe('/')
        ->and($page->parent_id)->toBeNull();

    $this->actingAs($user)
        ->put(route('admin.page.update', $page), [
            'name' => 'Updated Home Page',
            'slug' => '/',
            'excerpt' => 'Updated summary',
            'content' => '<p>Updated content</p>',
            'parent_id' => null,
            'meta_title' => 'Updated Title',
            'meta_description' => '',
            'canonical_url' => null,
            'robots' => 'index,follow',
            'status' => 'published',
            'visibility' => 'public',
            'password' => '',
            'published_at' => null,
            'template' => 'template',
            'sort_order' => 0,
            'featured_media' => null,
        ])
        ->assertRedirect(route('admin.page.index'));

    expect($page->fresh()->name)->toBe('Updated Home Page');
});

it('renders the custom content of a published page with slug /', function () {
    $themeSlug = 'storefront-'.Str::lower(Str::random(12));
    $themePath = createStorefrontTheme($themeSlug, [
        'page' => "@extends('theme::layouts.app')\n@section('content')<h1>{{ \$page->name }}</h1>{!! \$page->content !!}@endsection",
        'home' => "@extends('theme::layouts.app')\n@section('content')<h1>{{ \$page->name }}</h1><div class=\"custom-home\">{!! \$page->content !!}</div>@endsection",
    ]);

    Setting::query()->create([
        'key' => 'active_theme',
        'value' => $themeSlug,
    ]);

    Page::query()->create([
        'name' => 'Our Home',
        'slug' => '/',
        'path' => '/',
        'template' => 'template',
        'status' => 'published',
        'visibility' => 'public',
        'content' => '<p>Special Home Content</p>',
    ]);

    try {
        $this->get('/')
            ->assertOk()
            ->assertSee("HEADER {$themeSlug}")
            ->assertSee('Our Home')
            ->assertSee('Special Home Content')
            ->assertSee('custom-home');
    } finally {
        File::deleteDirectory($themePath);
    }
});

it('applies theme layout to both terms-and-conditions and moving pages', function () {
    $themeSlug = 'storefront-'.Str::lower(Str::random(12));
    $themePath = createStorefrontTheme($themeSlug, [
        'page' => "@extends('theme::layouts.app')\n@section('content')TERMS CONTENT @endsection",
        'moving' => "@extends('theme::layouts.app')\n@section('content')MOVING CONTENT @endsection",
    ]);

    Setting::query()->create([
        'key' => 'active_theme',
        'value' => $themeSlug,
    ]);

    Page::query()->create([
        'name' => 'Terms and Conditions',
        'slug' => 'terms-and-conditions',
        'path' => 'terms-and-conditions',
        'template' => 'template',
        'status' => 'published',
        'visibility' => 'public',
        'content' => 'Terms',
    ]);

    Page::query()->create([
        'name' => 'Moving',
        'slug' => 'moving',
        'path' => 'moving',
        'template' => 'page',
        'status' => 'published',
        'visibility' => 'public',
        'content' => 'Moving',
    ]);

    try {
        $this->get('/terms-and-conditions')
            ->assertOk()
            ->assertSee("HEADER {$themeSlug}")
            ->assertSee('TERMS CONTENT')
            ->assertSee('FOOTER');

        $this->get('/moving')
            ->assertOk()
            ->assertSee("HEADER {$themeSlug}")
            ->assertSee('MOVING CONTENT')
            ->assertSee('FOOTER');
    } finally {
        File::deleteDirectory($themePath);
    }
});

it('serves theme assets securely with appropriate content types', function () {
    $themeSlug = 'storefront-'.Str::lower(Str::random(12));
    $themePath = base_path("themes/{$themeSlug}");
    $assetsPath = $themePath.'/assets/js';
    File::makeDirectory($assetsPath, 0755, true);
    File::put($assetsPath.'/sample.js', 'console.log("hello");');

    try {
        $this->get("/themes/{$themeSlug}/assets/js/sample.js")
            ->assertOk()
            ->assertHeader('Content-Type', 'application/javascript; charset=UTF-8')
            ->assertSee('console.log("hello");', false);

        $this->get("/themes/{$themeSlug}/assets/nonexistent.js")->assertNotFound();
    } finally {
        File::deleteDirectory($themePath);
    }
});

it('renders page using subfolder template and restricts 404', function () {
    $themeSlug = 'storefront-'.Str::lower(Str::random(12));
    $themePath = createStorefrontTheme($themeSlug, [
        'page' => "@extends('theme::layouts.app')\n@section('content')BASE PAGE @endsection",
        'moving/ssssss' => "@extends('theme::layouts.app')\n@section('content')SUBFOLDER TEMPLATE CONTENT @endsection",
        '404' => "@extends('theme::layouts.app')\n@section('content')CUSTOM 404 VIEW @endsection",
    ]);

    Setting::query()->create([
        'key' => 'active_theme',
        'value' => $themeSlug,
    ]);

    $theme = app(ThemeManager::class);

    // Verify template listing discovers subfolder template and excludes 404
    $templates = $theme->pageTemplates();
    $values = array_column($templates, 'value');
    expect($values)
        ->toContain('moving/ssssss')
        ->toContain('template')
        ->not->toContain('404');

    $subfolderOption = collect($templates)->firstWhere('value', 'moving/ssssss');
    expect($subfolderOption['label'])->toContain('moving/ssssss.blade.php');

    // Page with subfolder template
    Page::query()->create([
        'name' => 'Subfolder Moving Page',
        'slug' => 'subfolder-moving',
        'path' => 'subfolder-moving',
        'template' => 'moving/ssssss',
        'status' => 'published',
        'visibility' => 'public',
        'content' => 'Sample content',
    ]);

    // Page attempting to use 404 template
    Page::query()->create([
        'name' => 'Restricted Page',
        'slug' => 'restricted-page',
        'path' => 'restricted-page',
        'template' => '404',
        'status' => 'published',
        'visibility' => 'public',
        'content' => 'Restricted',
    ]);

    try {
        $this->get('/subfolder-moving')
            ->assertOk()
            ->assertSee("HEADER {$themeSlug}")
            ->assertSee('SUBFOLDER TEMPLATE CONTENT')
            ->assertSee('FOOTER');

        // Restricted 404 template falls back to standard page view, never rendering theme 404 as template
        $this->get('/restricted-page')
            ->assertOk()
            ->assertDontSee('CUSTOM 404 VIEW');
    } finally {
        File::deleteDirectory($themePath);
    }
});

it('renders header navigation menu from database dynamically', function () {
    $menu = Menu::query()->create([
        'name' => 'Main Menu',
        'location' => 'header',
    ]);
    $page = Page::query()->create([
        'name' => 'Test Moving',
        'slug' => 'test-moving',
        'path' => '/test-moving',
        'template' => 'template',
        'status' => 'published',
        'visibility' => 'public',
        'content' => 'Moving Content',
    ]);
    $menu->menuItems()->create([
        'label' => 'Dynamic Header Link',
        'type' => 'page',
        'reference_id' => $page->id,
        'sort_order' => 0,
        'is_active' => true,
    ]);

    Setting::query()->updateOrCreate(
        ['key' => 'active_theme'],
        ['value' => 'easytruck-theme']
    );

    $this->get('/test-moving')
        ->assertOk()
        ->assertSee('Dynamic Header Link')
        ->assertSee('/test-moving');
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
        $filePath = $viewsPath."/templates/{$name}.blade.php";
        File::ensureDirectoryExists(dirname($filePath));
        File::put($filePath, $contents);
    }

    return $themePath;
}
