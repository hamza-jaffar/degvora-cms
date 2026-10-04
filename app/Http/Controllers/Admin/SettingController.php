<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSiteSettingsRequest;
use App\Models\Gallery;
use App\Models\Setting;
use App\Services\SiteSettingsService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;

class SettingController extends Controller
{
    private const SETTING_KEYS = [
        'name',
        'email',
        'phone',
        'location',
        'country',
        'tagline',
        'currency',
        'currency_code',
        'timezone',
        'locale',
        'logo',
        'favicon',
        'seo_image',
        'meta_title',
        'meta_description',
        'meta_keywords',
        'google_analytics_id',
        'google_tag_manager_id',
        'meta_pixel_id',
        'google_site_verification',
        'social_facebook',
        'social_instagram',
        'social_youtube',
        'social_x',
        'social_linkedin',
        'social_tiktok',
        'footer_text',
        'mail_mailer',
        'mail_host',
        'mail_port',
        'mail_encryption',
        'mail_username',
        'mail_from_name',
        'mail_from_address',
        'posts_per_page',
    ];

    public function index(Request $request, SiteSettingsService $siteSettings): Response
    {
        $settings = $siteSettings->values();

        $values = collect(self::SETTING_KEYS)
            ->reject(fn (string $key): bool => in_array($key, ['logo', 'favicon', 'seo_image'], true))
            ->mapWithKeys(fn (string $key): array => [$key => $settings[$key] ?? '']);
        $values = $values->merge([
            'mail_mailer' => $values->get('mail_mailer') ?: config('mail.default', 'log'),
            'mail_host' => $values->get('mail_host') ?: config('mail.mailers.smtp.host', ''),
            'mail_port' => $values->get('mail_port') ?: (string) config('mail.mailers.smtp.port', 587),
            'mail_encryption' => $values->get('mail_encryption') ?: 'tls',
            'mail_username' => $values->get('mail_username') ?: (string) config('mail.mailers.smtp.username', ''),
            'mail_from_name' => $values->get('mail_from_name') ?: (string) config('mail.from.name', ''),
            'mail_from_address' => $values->get('mail_from_address') ?: (string) config('mail.from.address', ''),
            'timezone' => $values->get('timezone') ?: config('app.timezone'),
            'locale' => $values->get('locale') ?: config('app.locale'),
            'posts_per_page' => $values->get('posts_per_page') ?: '10',
        ]);

        return Inertia::render('admin/setting/index', [
            'activeTab' => is_string($request->query('active_tab'))
                ? $request->query('active_tab')
                : null,
            'settings' => $values,
            'logoUrl' => $this->publicAssetUrl($settings['logo'] ?? null),
            'faviconUrl' => $this->publicAssetUrl($settings['favicon'] ?? null),
            'seoImageUrl' => $this->publicAssetUrl($settings['seo_image'] ?? null),
            'logoImage' => $this->galleryImageData($settings['logo'] ?? null),
            'faviconImage' => $this->galleryImageData($settings['favicon'] ?? null),
            'seoImage' => $this->galleryImageData($settings['seo_image'] ?? null),
            'mailPasswordConfigured' => $siteSettings->secretIsConfigured('mail_password'),
            'timezones' => \DateTimeZone::listIdentifiers(),
            ...$this->galleryPickerProps($request),
        ]);
    }

    public function update(UpdateSiteSettingsRequest $request, SiteSettingsService $siteSettings): RedirectResponse
    {
        $validated = $request->validated();
        $clearMailPassword = $request->boolean('mail_password_clear');
        $oldPaths = [];

        DB::transaction(function () use ($validated, $siteSettings, $clearMailPassword, &$oldPaths): void {
            foreach (self::SETTING_KEYS as $key) {
                if (in_array($key, ['logo', 'favicon', 'seo_image'], true)) {
                    $selectedPath = $validated["{$key}_path"] ?? null;

                    if ($selectedPath === null) {
                        continue;
                    }

                    $setting = Setting::query()->firstOrNew(['key' => $key]);
                    $oldPaths[$key] = $setting->value;
                    $setting->value = $selectedPath;
                    $setting->save();

                    continue;
                }

                $this->saveSetting($key, $validated[$key] ?? '');
            }

            if ($clearMailPassword) {
                $siteSettings->delete('mail_password');
            } elseif (($validated['mail_password'] ?? '') !== '') {
                $siteSettings->saveSecret('mail_password', $validated['mail_password']);
            }
        });

        $siteSettings->forgetCachedValues();

        foreach ($oldPaths as $oldPath) {
            if (! $this->isManagedAssetPath($oldPath)) {
                continue;
            }

            if (Setting::query()
                ->whereIn('key', ['logo', 'favicon', 'seo_image'])
                ->where('value', $oldPath)
                ->exists()) {
                continue;
            }

            if (! Storage::disk('public')->delete($oldPath)) {
                Log::warning('Unable to remove a replaced site settings image.', [
                    'path' => $oldPath,
                ]);
            }
        }

        return to_route('admin.setting.index')->with('success', 'Site settings updated successfully.');
    }

    public function testMail(Request $request, SiteSettingsService $siteSettings): RedirectResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ]);

        if (($siteSettings->values()['mail_mailer'] ?? null) !== 'smtp') {
            return back()->withErrors([
                'mail_test' => 'Select and save the SMTP mail driver before testing delivery.',
            ]);
        }

        $siteSettings->applyMailConfiguration();

        try {
            Mail::raw('This is a test email from your CMS mail settings.', function ($message) use ($validated): void {
                $message
                    ->to($validated['email'])
                    ->subject('CMS mail configuration test');
            });
        } catch (TransportExceptionInterface $exception) {
            report($exception);

            return back()->withErrors([
                'mail_test' => 'The test email could not be sent. Check your SMTP settings and try again.',
            ]);
        }

        return back()->with('success', 'Test email sent successfully.');
    }

    /**
     * @return array<string, mixed>
     */
    private function galleryPickerProps(Request $request): array
    {
        $requestedFilter = $request->query('filter', 'all');
        $filter = is_string($requestedFilter)
            && in_array($requestedFilter, ['all', 'image', 'video', 'other'], true)
                ? $requestedFilter
                : 'all';
        $requestedSearch = $request->query('search', '');
        $search = is_string($requestedSearch)
            ? mb_substr(trim($requestedSearch), 0, 100)
            : '';

        $query = Gallery::query()->where('disk', 'public');

        match ($filter) {
            'image' => $query->where('mime_type', 'like', 'image/%'),
            'video' => $query->where('mime_type', 'like', 'video/%'),
            'other' => $query->where('mime_type', 'not like', 'image/%')
                ->where('mime_type', 'not like', 'video/%'),
            default => null,
        };

        if ($search !== '') {
            $query->where(fn (Builder $builder) => $builder
                ->where('original_name', 'like', '%'.$search.'%')
                ->orWhere('alt', 'like', '%'.$search.'%'));
        }

        $countsQuery = Gallery::query()->where('disk', 'public');

        return [
            'media' => Inertia::scroll(fn () => $query
                ->latest()
                ->paginate(24)
                ->withQueryString()
                ->through(fn (Gallery $asset): array => $this->galleryAssetData($asset))),
            'pickerAsset' => $request->session()->pull('pickerAsset'),
            'counts' => [
                'all' => (clone $countsQuery)->count(),
                'image' => (clone $countsQuery)->where('mime_type', 'like', 'image/%')->count(),
                'video' => (clone $countsQuery)->where('mime_type', 'like', 'video/%')->count(),
                'other' => (clone $countsQuery)
                    ->where('mime_type', 'not like', 'image/%')
                    ->where('mime_type', 'not like', 'video/%')
                    ->count(),
            ],
            'filter' => $filter,
            'search' => $search,
            'filterUrl' => route('admin.setting.index'),
        ];
    }

    /**
     * @return array{id: int, name: string, alt: string, path: string, url: string, type: string, mimeType: string}
     */
    private function galleryAssetData(Gallery $asset): array
    {
        return [
            'id' => $asset->id,
            'name' => $asset->original_name,
            'alt' => $asset->alt,
            'path' => $asset->path,
            'url' => Storage::disk($asset->disk)->url($asset->path),
            'type' => match (true) {
                str_starts_with($asset->mime_type, 'image/') => 'image',
                str_starts_with($asset->mime_type, 'video/') => 'video',
                default => 'other',
            },
            'mimeType' => $asset->mime_type,
        ];
    }

    /**
     * @return array{id: int, name: string, alt: string, path: string, url: string, type: string, mimeType: string}|null
     */
    private function galleryImageData(?string $path): ?array
    {
        if ($path === null || $path === '') {
            return null;
        }

        $asset = Gallery::query()
            ->where('disk', 'public')
            ->where('path', $path)
            ->where('mime_type', 'like', 'image/%')
            ->first();

        return $asset === null ? null : $this->galleryAssetData($asset);
    }

    private function saveSetting(string $key, mixed $value): void
    {
        $setting = Setting::query()->firstOrNew(['key' => $key]);
        $setting->value = (string) $value;
        $setting->save();
    }

    private function publicAssetUrl(?string $path): ?string
    {
        if ($path === null || $path === '') {
            return null;
        }

        $galleryImage = $this->galleryImageData($path);

        if ($galleryImage !== null) {
            return $galleryImage['url'];
        }

        if (! $this->isManagedAssetPath($path)) {
            return null;
        }

        return Storage::disk('public')->url($path);
    }

    private function isManagedAssetPath(?string $path): bool
    {
        return $path !== null
            && preg_match('#\Asite-settings/[A-Za-z0-9][A-Za-z0-9_.-]*\z#D', $path) === 1
            && ! str_contains($path, '..');
    }
}
