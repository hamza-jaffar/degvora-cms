<?php

namespace App\Http\Requests\Admin\Page;

use App\Models\Page;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->input('parent_id') === '') {
            $this->merge(['parent_id' => null]);
        }
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        $page = $this->route('page');
        $pageId = $page instanceof Page ? $page->id : null;

        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/', Rule::unique('pages', 'slug')->ignore($pageId)],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'content' => ['nullable', 'string'],
            'parent_id' => ['nullable', 'integer', 'exists:pages,id', Rule::notIn([$pageId])],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'canonical_url' => ['nullable', 'url', 'max:2048'],
            'robots' => ['required', Rule::in(['index,follow', 'noindex,follow', 'index,nofollow', 'noindex,nofollow'])],
            'status' => ['required', Rule::in(['draft', 'published', 'scheduled', 'archived'])],
            'visibility' => ['required', Rule::in(['public', 'private', 'password'])],
            'password' => ['nullable', 'string', 'max:255'],
            'published_at' => ['nullable', 'date'],
            'template' => ['required', 'string', 'max:100'],
            'sort_order' => ['required', 'integer', 'min:0'],
            'featured_media' => ['nullable', 'string', 'max:2048', 'exists:galleries,path'],
        ];
    }

    /** @return array<string, mixed> */
    public function pageData(): array
    {
        $validated = $this->validated();
        $slug = $validated['slug'];
        $parent = $validated['parent_id'] !== null
            ? Page::find($validated['parent_id'])
            : null;

        $validated['path'] = $parent
            ? $parent->path.'/'.$slug
            : '/'.$slug;

        return $validated;
    }
}
