<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class SiteSettingsService
{
    private const CACHE_KEY = 'site_settings.values';

    /**
     * @return array<string, string>
     */
    public function values(): array
    {
        $cachedValues = Cache::get(self::CACHE_KEY);

        if (is_array($cachedValues)) {
            return $cachedValues;
        }

        if (! Schema::hasTable('settings')) {
            return [];
        }

        return Cache::rememberForever(
            self::CACHE_KEY,
            fn (): array => Setting::query()
                ->pluck('value', 'key')
                ->map(fn (mixed $value): string => (string) $value)
                ->all(),
        );
    }

    /**
     * @return array<string, string>
     */
    public function publicValues(): array
    {
        $values = $this->values();
        $publicValues = array_intersect_key($values, array_flip([
            'name',
            'tagline',
            'email',
            'phone',
            'location',
            'country',
            'currency',
            'currency_code',
            'posts_per_page',
            'logo',
            'favicon',
            'timezone',
            'locale',
            'meta_title',
            'meta_description',
            'meta_keywords',
            'seo_image',
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
        ]));

        foreach (['logo', 'favicon', 'seo_image'] as $key) {
            if (! empty($publicValues[$key])) {
                $publicValues["{$key}_url"] = Storage::disk('public')->url($publicValues[$key]);
            }
        }

        return $publicValues;
    }

    public function save(string $key, string $value): void
    {
        $setting = Setting::query()->firstOrNew(['key' => $key]);
        $setting->value = $value;
        $setting->save();
        $this->forgetCachedValues();
    }

    public function delete(string $key): void
    {
        Setting::query()->where('key', $key)->delete();
        $this->forgetCachedValues();
    }

    public function saveSecret(string $key, string $value): void
    {
        $this->save($key, Crypt::encryptString($value));
    }

    public function secretIsConfigured(string $key): bool
    {
        return ($this->values()[$key] ?? '') !== '';
    }

    public function secret(string $key): ?string
    {
        $ciphertext = $this->values()[$key] ?? null;

        return $ciphertext === null || $ciphertext === ''
            ? null
            : Crypt::decryptString($ciphertext);
    }

    public function applyRuntimeConfiguration(): void
    {
        $values = $this->values();

        if (isset($values['timezone']) && in_array($values['timezone'], timezone_identifiers_list(), true)) {
            config(['app.timezone' => $values['timezone']]);
            date_default_timezone_set($values['timezone']);
        }

        if (isset($values['locale']) && preg_match('/\A[a-z]{2}(?:-[A-Z]{2})?\z/', $values['locale']) === 1) {
            app()->setLocale($values['locale']);
            config(['app.locale' => $values['locale']]);
        }

        $this->applyMailConfiguration($values);
    }

    /**
     * @param  array<string, string>|null  $values
     */
    public function applyMailConfiguration(?array $values = null): void
    {
        $values ??= $this->values();
        $mailer = $values['mail_mailer'] ?? null;

        if (! in_array($mailer, ['smtp', 'log'], true)) {
            return;
        }

        config([
            'mail.default' => $mailer,
            'mail.from.address' => $values['mail_from_address'] ?? config('mail.from.address'),
            'mail.from.name' => $values['mail_from_name'] ?? config('mail.from.name'),
        ]);

        if ($mailer === 'smtp') {
            config([
                'mail.mailers.smtp.transport' => 'smtp',
                'mail.mailers.smtp.url' => null,
                'mail.mailers.smtp.scheme' => match ($values['mail_encryption'] ?? 'tls') {
                    'ssl' => 'smtps',
                    'none' => null,
                    default => 'smtp',
                },
                'mail.mailers.smtp.host' => $values['mail_host'] ?? '',
                'mail.mailers.smtp.port' => (int) ($values['mail_port'] ?? 587),
                'mail.mailers.smtp.username' => $values['mail_username'] ?? null,
                'mail.mailers.smtp.password' => $this->secret('mail_password'),
            ]);
        }

        Mail::purge($mailer);
    }

    public function forgetCachedValues(): void
    {
        Cache::forget(self::CACHE_KEY);
    }
}
