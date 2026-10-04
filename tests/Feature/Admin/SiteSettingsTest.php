<?php

use App\Models\Gallery;
use App\Models\Setting;
use App\Models\User;
use App\Services\SiteSettingsService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

it('renders saved site settings and gallery image picker data', function () {
    Storage::fake('public');
    $user = User::factory()->create();
    Storage::disk('public')->put('gallery/site-logo.png', 'logo');

    $logo = Gallery::query()->create([
        'disk' => 'public',
        'filename' => 'site-logo.png',
        'original_name' => 'site-logo.png',
        'path' => 'gallery/site-logo.png',
        'mime_type' => 'image/png',
        'alt' => 'Site logo',
        'size' => '4',
        'width' => '1',
        'height' => '1',
    ]);

    Setting::query()->create(['key' => 'name', 'value' => 'Degvora']);
    Setting::query()->create(['key' => 'email', 'value' => 'hello@example.test']);
    Setting::query()->create(['key' => 'country', 'value' => 'US']);
    Setting::query()->create(['key' => 'logo', 'value' => $logo->path]);
    Setting::query()->create([
        'key' => 'mail_password',
        'value' => Crypt::encryptString('private-password'),
    ]);

    $this->actingAs($user)
        ->get(route('admin.setting.index', ['active_tab' => 'social']))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/setting/index')
            ->where('activeTab', 'social')
            ->where('settings.name', 'Degvora')
            ->where('settings.email', 'hello@example.test')
            ->where('settings.country', 'US')
            ->where('mailPasswordConfigured', true)
            ->missing('settings.mail_password')
            ->where('logoUrl', Storage::disk('public')->url($logo->path))
            ->where('logoImage.path', $logo->path)
            ->where('filterUrl', route('admin.setting.index'))
            ->has('media.data', 1)
            ->where('counts.image', 1)
            ->where('faviconUrl', null));
});

it('filters gallery picker assets by type and search query', function () {
    $user = User::factory()->create();

    Gallery::query()->create([
        'disk' => 'public',
        'filename' => 'brand.png',
        'original_name' => 'brand.png',
        'path' => 'gallery/brand.png',
        'mime_type' => 'image/png',
        'alt' => 'Brand image',
        'size' => '4',
        'width' => '1',
        'height' => '1',
    ]);
    Gallery::query()->create([
        'disk' => 'public',
        'filename' => 'clip.mp4',
        'original_name' => 'clip.mp4',
        'path' => 'gallery/clip.mp4',
        'mime_type' => 'video/mp4',
        'alt' => 'Promo clip',
        'size' => '4',
        'width' => '1',
        'height' => '1',
    ]);
    Gallery::query()->create([
        'disk' => 'local',
        'filename' => 'private.png',
        'original_name' => 'private.png',
        'path' => 'gallery/private.png',
        'mime_type' => 'image/png',
        'alt' => 'Private image',
        'size' => '4',
        'width' => '1',
        'height' => '1',
    ]);

    $this->actingAs($user)
        ->get(route('admin.setting.index', ['filter' => 'image', 'search' => 'brand']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('filter', 'image')
            ->where('search', 'brand')
            ->has('media.data', 1)
            ->where('media.data.0.path', 'gallery/brand.png')
            ->where('counts.all', 2)
            ->where('counts.image', 1));
});

it('refreshes cached settings after the admin updates them', function () {
    $user = User::factory()->create();
    Setting::query()->create(['key' => 'name', 'value' => 'Old site name']);
    $siteSettings = app(SiteSettingsService::class);
    $siteSettings->forgetCachedValues();

    expect($siteSettings->values()['name'])->toBe('Old site name');

    $this->actingAs($user)
        ->post(route('admin.setting.update'), siteSettingsPayload([
            'name' => 'Updated site name',
        ]))
        ->assertRedirect(route('admin.setting.index'));

    expect($siteSettings->values()['name'])->toBe('Updated site name');
});

it('updates site details and saves selected gallery image paths', function () {
    $user = User::factory()->create();
    $logo = Gallery::query()->create([
        'disk' => 'public',
        'filename' => 'logo.png',
        'original_name' => 'logo.png',
        'path' => 'gallery/logo.png',
        'mime_type' => 'image/png',
        'alt' => 'Logo',
        'size' => '4',
        'width' => '1',
        'height' => '1',
    ]);
    $favicon = Gallery::query()->create([
        'disk' => 'public',
        'filename' => 'favicon.png',
        'original_name' => 'favicon.png',
        'path' => 'gallery/favicon.png',
        'mime_type' => 'image/png',
        'alt' => 'Favicon',
        'size' => '4',
        'width' => '1',
        'height' => '1',
    ]);

    $this->actingAs($user)
        ->post(route('admin.setting.update'), siteSettingsPayload([
            'name' => 'Degvora CMS',
            'email' => 'contact@example.test',
            'phone' => '+1 555 0100',
            'location' => 'New York',
            'country' => 'us',
            'currency' => 'US Dollar',
            'currency_code' => 'usd',
            'logo_path' => $logo->path,
            'favicon_path' => $favicon->path,
            'mail_mailer' => 'smtp',
            'mail_host' => 'smtp.example.test',
            'mail_port' => 587,
            'mail_encryption' => 'tls',
            'mail_username' => 'mailer-user',
            'mail_password' => 'private-password',
            'mail_from_name' => 'Degvora',
            'mail_from_address' => 'no-reply@example.test',
        ]))
        ->assertRedirect(route('admin.setting.index'));

    expect(Setting::query()->where('key', 'name')->value('value'))->toBe('Degvora CMS')
        ->and(Setting::query()->where('key', 'email')->value('value'))->toBe('contact@example.test')
        ->and(Setting::query()->where('key', 'phone')->value('value'))->toBe('+1 555 0100')
        ->and(Setting::query()->where('key', 'location')->value('value'))->toBe('New York')
        ->and(Setting::query()->where('key', 'country')->value('value'))->toBe('US')
        ->and(Setting::query()->where('key', 'currency')->value('value'))->toBe('US Dollar')
        ->and(Setting::query()->where('key', 'currency_code')->value('value'))->toBe('USD')
        ->and(Setting::query()->where('key', 'logo')->value('value'))->toBe($logo->path)
        ->and(Setting::query()->where('key', 'favicon')->value('value'))->toBe($favicon->path)
        ->and(Setting::query()->where('key', 'mail_password')->value('value'))->not->toBe('private-password');

    expect(Crypt::decryptString(Setting::query()->where('key', 'mail_password')->value('value')))
        ->toBe('private-password');

    app(SiteSettingsService::class)->applyMailConfiguration();

    expect(config('mail.default'))->toBe('smtp')
        ->and(config('mail.mailers.smtp.host'))->toBe('smtp.example.test')
        ->and(config('mail.mailers.smtp.password'))->toBe('private-password')
        ->and(config('mail.from.address'))->toBe('no-reply@example.test');
});

it('keeps existing images when no replacement is selected', function () {
    Storage::fake('public');
    $user = User::factory()->create();
    $logoPath = UploadedFile::fake()->image('logo.png')->store('site-settings', 'public');
    $faviconPath = UploadedFile::fake()->image('favicon.png')->store('site-settings', 'public');

    Setting::query()->create(['key' => 'logo', 'value' => $logoPath]);
    Setting::query()->create(['key' => 'favicon', 'value' => $faviconPath]);

    $this->actingAs($user)
        ->post(route('admin.setting.update'), siteSettingsPayload(['name' => 'Updated site']))
        ->assertRedirect(route('admin.setting.index'));

    expect(Setting::query()->where('key', 'logo')->value('value'))->toBe($logoPath)
        ->and(Setting::query()->where('key', 'favicon')->value('value'))->toBe($faviconPath);

    Storage::disk('public')->assertExists($logoPath);
    Storage::disk('public')->assertExists($faviconPath);
});

it('replaces an old managed image with a selected gallery asset', function () {
    Storage::fake('public');
    $user = User::factory()->create();
    $oldLogoPath = UploadedFile::fake()->image('old-logo.png')->store('site-settings', 'public');
    $logo = Gallery::query()->create([
        'disk' => 'public',
        'filename' => 'new-logo.png',
        'original_name' => 'new-logo.png',
        'path' => 'gallery/new-logo.png',
        'mime_type' => 'image/png',
        'alt' => 'New logo',
        'size' => '4',
        'width' => '1',
        'height' => '1',
    ]);

    Setting::query()->create(['key' => 'logo', 'value' => $oldLogoPath]);

    $this->actingAs($user)
        ->post(route('admin.setting.update'), [
            ...siteSettingsPayload(['name' => 'Degvora']),
            'logo_path' => $logo->path,
        ])
        ->assertRedirect(route('admin.setting.index'));

    expect(Setting::query()->where('key', 'logo')->value('value'))->toBe($logo->path);
    Storage::disk('public')->assertMissing($oldLogoPath);
});

it('rejects invalid email, currency codes, country values, and non-gallery image paths', function () {
    $user = User::factory()->create();
    Gallery::query()->create([
        'disk' => 'public',
        'filename' => 'clip.mp4',
        'original_name' => 'clip.mp4',
        'path' => 'gallery/clip.mp4',
        'mime_type' => 'video/mp4',
        'alt' => 'Promo clip',
        'size' => '4',
        'width' => '1',
        'height' => '1',
    ]);

    $this->actingAs($user)
        ->from(route('admin.setting.index'))
        ->post(route('admin.setting.update'), siteSettingsPayload([
            'name' => 'Degvora',
            'email' => 'not-an-email',
            'currency_code' => 'US dollars',
            'country' => 'USA',
            'logo_path' => 'gallery/clip.mp4',
            'google_analytics_id' => 'not-a-valid-id',
            'social_facebook' => 'javascript:alert(1)',
        ]))
        ->assertRedirect(route('admin.setting.index'))
        ->assertSessionHasErrors([
            'email',
            'currency_code',
            'country',
            'logo_path',
            'google_analytics_id',
            'social_facebook',
        ]);

    expect(Setting::query()->count())->toBe(0);
});

it('clears an encrypted SMTP password only when explicitly requested', function () {
    $user = User::factory()->create();
    Setting::query()->create([
        'key' => 'mail_password',
        'value' => Crypt::encryptString('old-password'),
    ]);

    $this->actingAs($user)
        ->post(route('admin.setting.update'), siteSettingsPayload([
            'mail_password_clear' => true,
        ]))
        ->assertRedirect(route('admin.setting.index'));

    expect(Setting::query()->where('key', 'mail_password')->exists())->toBeFalse();
});

it('sends a mail test only when SMTP is configured', function () {
    $user = User::factory()->create();
    Mail::fake();

    Setting::query()->create(['key' => 'mail_mailer', 'value' => 'smtp']);
    Setting::query()->create(['key' => 'mail_host', 'value' => 'smtp.example.test']);
    Setting::query()->create(['key' => 'mail_port', 'value' => '587']);
    Setting::query()->create(['key' => 'mail_encryption', 'value' => 'tls']);
    Setting::query()->create(['key' => 'mail_from_address', 'value' => 'no-reply@example.test']);

    $this->actingAs($user)
        ->from(route('admin.setting.index'))
        ->post(route('admin.setting.mail-test'), ['email' => 'admin@example.test'])
        ->assertRedirect(route('admin.setting.index'))
        ->assertSessionHas('success', 'Test email sent successfully.');
});

it('rejects mail test requests when the logger driver is selected', function () {
    $user = User::factory()->create();
    Setting::query()->create(['key' => 'mail_mailer', 'value' => 'log']);

    $this->actingAs($user)
        ->from(route('admin.setting.index'))
        ->post(route('admin.setting.mail-test'), ['email' => 'admin@example.test'])
        ->assertRedirect(route('admin.setting.index'))
        ->assertSessionHasErrors('mail_test');
});

it('requires authentication to view or update site settings', function () {
    $this->get(route('admin.setting.index'))
        ->assertRedirect(route('login'));

    $this->post(route('admin.setting.update'), ['name' => 'Degvora'])
        ->assertRedirect(route('login'));
});

/**
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function siteSettingsPayload(array $overrides = []): array
{
    return array_replace([
        'name' => 'Degvora',
        'tagline' => '',
        'email' => '',
        'phone' => '',
        'location' => '',
        'country' => '',
        'currency' => '',
        'currency_code' => '',
        'timezone' => 'UTC',
        'locale' => 'en',
        'posts_per_page' => '10',
        'meta_title' => '',
        'meta_description' => '',
        'meta_keywords' => '',
        'social_facebook' => '',
        'social_instagram' => '',
        'social_youtube' => '',
        'social_x' => '',
        'social_linkedin' => '',
        'social_tiktok' => '',
        'footer_text' => '',
        'google_analytics_id' => '',
        'google_tag_manager_id' => '',
        'meta_pixel_id' => '',
        'google_site_verification' => '',
        'mail_mailer' => 'log',
        'mail_host' => '',
        'mail_port' => '',
        'mail_encryption' => 'tls',
        'mail_username' => '',
        'mail_password' => '',
        'mail_password_clear' => false,
        'mail_from_name' => '',
        'mail_from_address' => '',
    ], $overrides);
}
