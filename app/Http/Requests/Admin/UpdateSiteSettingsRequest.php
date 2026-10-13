<?php

namespace App\Http\Requests\Admin;

use Illuminate\Database\Query\Builder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSiteSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'location' => ['nullable', 'string', 'max:255'],
            'tagline' => ['nullable', 'string', 'max:255'],
            'country' => ['nullable', 'string', 'alpha:ascii', 'size:2'],
            'currency' => ['nullable', 'string', 'max:100'],
            'currency_code' => ['nullable', 'string', 'alpha:ascii', 'size:3'],
            'timezone' => ['required', 'timezone'],
            'locale' => ['required', 'string', 'alpha_dash', 'max:12'],
            'logo_path' => [
                'nullable',
                'string',
                'max:2048',
                Rule::exists('galleries', 'path')
                    ->where('disk', 'public')
                    ->where(fn (Builder $query) => $query->where('mime_type', 'like', 'image/%')),
            ],
            'footer_logo_path' => [
                'nullable',
                'string',
                'max:2048',
                Rule::exists('galleries', 'path')
                    ->where('disk', 'public')
                    ->where(fn (Builder $query) => $query->where('mime_type', 'like', 'image/%')),
            ],
            'favicon_path' => [
                'nullable',
                'string',
                'max:2048',
                Rule::exists('galleries', 'path')
                    ->where('disk', 'public')
                    ->where(fn (Builder $query) => $query->where('mime_type', 'like', 'image/%')),
            ],
            'seo_image_path' => [
                'nullable',
                'string',
                'max:2048',
                Rule::exists('galleries', 'path')
                    ->where('disk', 'public')
                    ->where(fn (Builder $query) => $query->where('mime_type', 'like', 'image/%')),
            ],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'meta_keywords' => ['nullable', 'string', 'max:500'],
            'social_facebook' => ['nullable', 'url:http,https', 'max:2048'],
            'social_instagram' => ['nullable', 'url:http,https', 'max:2048'],
            'social_youtube' => ['nullable', 'url:http,https', 'max:2048'],
            'social_x' => ['nullable', 'url:http,https', 'max:2048'],
            'social_linkedin' => ['nullable', 'url:http,https', 'max:2048'],
            'social_tiktok' => ['nullable', 'url:http,https', 'max:2048'],
            'footer_text' => ['nullable', 'string', 'max:500'],
            'posts_per_page' => ['required', 'integer', 'between:1,100'],
            'google_analytics_id' => ['nullable', 'regex:/\AG-[A-Z0-9]{4,20}\z/i'],
            'google_tag_manager_id' => ['nullable', 'regex:/\AGTM-[A-Z0-9]{4,20}\z/i'],
            'meta_pixel_id' => ['nullable', 'regex:/\A[0-9]{5,30}\z/'],
            'google_site_verification' => ['nullable', 'alpha_dash', 'max:255'],
            'mail_mailer' => ['required', Rule::in(['smtp', 'log'])],
            'mail_host' => ['nullable', 'required_if:mail_mailer,smtp', 'string', 'max:255'],
            'mail_port' => ['nullable', 'required_if:mail_mailer,smtp', 'integer', 'between:1,65535'],
            'mail_encryption' => ['required', Rule::in(['tls', 'ssl', 'none'])],
            'mail_username' => ['nullable', 'string', 'max:255'],
            'mail_password' => ['nullable', 'string', 'max:2048'],
            'mail_password_clear' => ['sometimes', 'boolean'],
            'mail_from_name' => ['nullable', 'string', 'max:255'],
            'mail_from_address' => ['nullable', 'required_if:mail_mailer,smtp', 'email', 'max:255'],
            'shipping_enabled' => ['nullable', 'string', 'in:0,1,true,false'],
            'shipping_rate_type' => ['nullable', 'string', Rule::in(['flat', 'free', 'weight_based'])],
            'shipping_flat_rate' => ['nullable', 'numeric', 'min:0'],
            'shipping_free_threshold' => ['nullable', 'numeric', 'min:0'],
            'shipping_origin_country' => ['nullable', 'string', 'alpha:ascii', 'size:2'],
            'shipping_origin_city' => ['nullable', 'string', 'max:255'],
            'shipping_origin_address' => ['nullable', 'string', 'max:255'],
            'shipping_origin_postal_code' => ['nullable', 'string', 'max:30'],
            'shipping_estimated_delivery' => ['nullable', 'string', 'max:255'],
            'shipping_policy' => ['nullable', 'string', 'max:2000'],
            'product_variations' => ['nullable', 'string', 'json'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $normalizedValues = [];

        foreach (['country', 'currency_code', 'shipping_origin_country', 'google_analytics_id', 'google_tag_manager_id'] as $key) {
            if ($this->has($key) && is_string($this->input($key))) {
                $normalizedValues[$key] = strtoupper(trim($this->input($key)));
            }
        }

        if ($normalizedValues !== []) {
            $this->merge($normalizedValues);
        }
    }
}
