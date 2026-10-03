<?php

namespace App\Http\Requests\Admin\Menu;

use App\Models\Menu;
use App\Models\MenuItem;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

abstract class MenuItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    protected function itemRules(?MenuItem $menuItem = null): array
    {
        $menu = $this->route('menu');
        $menuId = $menu instanceof Menu ? $menu->id : 0;
        $type = $this->input('type');

        $referenceRule = match ($type) {
            'page' => Rule::exists('pages', 'id')
                ->where('status', 'published')
                ->where('visibility', 'public')
                ->whereNull('deleted_at'),
            'product' => Rule::exists('products', 'id')
                ->where('status', 'active')
                ->whereNull('deleted_at'),
            'category' => Rule::exists('categories', 'id')
                ->where('is_active', true),
            default => null,
        };

        $parentRules = [
            'nullable',
            'integer',
            Rule::exists('menu_items', 'id')->where('menu_id', $menuId),
        ];

        if ($menuItem !== null) {
            $parentRules[] = Rule::notIn([$menuItem->id]);
        }

        return [
            'label' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::in(['custom', 'page', 'product', 'category'])],
            'url' => [
                'exclude_unless:type,custom',
                'required',
                'string',
                'max:255',
                function (string $attribute, mixed $value, Closure $fail): void {
                    if (! is_string($value) || ! $this->isSafeCustomUrl($value)) {
                        $fail('Enter an http(s) URL or a site-relative path beginning with a single slash.');
                    }
                },
            ],
            'reference_id' => [
                'exclude_if:type,custom',
                'required',
                'integer',
                ...($referenceRule === null ? ['prohibited'] : [$referenceRule]),
            ],
            'parent_id' => $parentRules,
            'target' => ['required', Rule::in(['_self', '_blank'])],
            'is_active' => ['required', 'boolean'],
        ];
    }

    private function isSafeCustomUrl(string $url): bool
    {
        $url = trim($url);

        if ($url === '' || preg_match('/[\x00-\x20\\\\]/', $url) === 1) {
            return false;
        }

        if (str_starts_with($url, '/') && ! str_starts_with($url, '//')) {
            return true;
        }

        $scheme = parse_url($url, PHP_URL_SCHEME);

        return filter_var($url, FILTER_VALIDATE_URL) !== false
            && in_array(strtolower((string) $scheme), ['http', 'https'], true);
    }
}
