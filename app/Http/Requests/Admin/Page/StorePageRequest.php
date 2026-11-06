<?php

namespace App\Http\Requests\Admin\Page;

use App\Models\Page;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->input('slug') === '/') {
            $this->merge(['parent_id' => null]);
        } elseif ($this->input('parent_id') === '') {
            $this->merge(['parent_id' => null]);
        }

        if ($this->has('template') && is_string($this->input('template'))) {
            $this->merge(['template' => trim(str_replace('\\', '/', $this->input('template')), '/')]);
        }
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'regex:/^(\/|[a-z0-9-]+)$/', Rule::unique('pages', 'slug')],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'content' => ['nullable', 'string'],
            'parent_id' => ['nullable', 'integer', 'exists:pages,id'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'canonical_url' => ['nullable', 'url', 'max:2048'],
            'robots' => ['required', Rule::in(['index,follow', 'noindex,follow', 'index,nofollow', 'noindex,nofollow'])],
            'status' => ['required', Rule::in(['draft', 'published', 'scheduled', 'archived'])],
            'visibility' => ['required', Rule::in(['public', 'private', 'password'])],
            'password' => ['nullable', 'string', 'max:255'],
            'published_at' => ['nullable', 'date'],
            'template' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-zA-Z0-9_\-\/]+$/',
                Rule::notIn(['404']),
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (is_string($value) && (str_ends_with($value, '/404') || str_contains($value, '..'))) {
                        $fail('The selected template is invalid or restricted.');
                    }
                },
            ],
            'sort_order' => ['required', 'integer', 'min:0'],
            'featured_media' => ['nullable', 'string', 'max:2048', 'exists:galleries,path'],
        ];
    }

    /** @return array<string, mixed> */
    public function pageData(): array
    {
        $validated = $this->validated();
        $slug = $validated['slug'];

        if ($slug === '/') {
            $validated['parent_id'] = null;
            $validated['path'] = '/';

            return $validated;
        }

        $parentId = $validated['parent_id'] ?? null;
        $parent = $parentId !== null
            ? Page::find($parentId)
            : null;

        $parentPath = $parent ? rtrim($parent->path, '/') : '';

        $validated['path'] = $parentPath !== ''
            ? $parentPath.'/'.$slug
            : '/'.$slug;

        return $validated;
    }
}
