<?php

namespace App\Http\Requests\Admin\Post;

use App\Models\Post;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'is_featured' => $this->boolean('is_featured'),
            'category_id' => $this->input('category_id') === '' || $this->input('category_id') === 'none' ? null : $this->input('category_id'),
            'robots' => $this->input('robots') ? str_replace(' ', '', (string) $this->input('robots')) : 'index,follow',
        ]);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Post|null $post */
        $post = $this->route('post');
        $postId = $post instanceof Post ? $post->id : null;

        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/', Rule::unique('posts', 'slug')->ignore($postId)],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'content' => ['nullable', 'string'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'featured_image' => ['nullable', 'string', 'max:2048', 'exists:galleries,path'],
            'tags' => ['nullable', 'array', 'max:30'],
            'tags.*' => ['string', 'max:50'],
            'tags_text' => ['nullable', 'string', 'max:500'],
            'is_featured' => ['required', 'boolean'],
            'status' => ['required', Rule::in(['draft', 'published', 'scheduled', 'archived'])],
            'visibility' => ['required', Rule::in(['public', 'private', 'password'])],
            'password' => ['nullable', 'string', 'max:255'],
            'published_at' => ['nullable', 'date'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'canonical_url' => ['nullable', 'url', 'max:2048'],
            'og_title' => ['nullable', 'string', 'max:255'],
            'og_description' => ['nullable', 'string', 'max:500'],
            'og_image' => ['nullable', 'string', 'max:2048', 'exists:galleries,path'],
            'robots' => ['required', Rule::in(['index,follow', 'noindex,follow', 'index,nofollow', 'noindex,nofollow'])],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function postData(): array
    {
        $validated = $this->validated();
        if (isset($validated['tags']) && is_array($validated['tags'])) {
            $tags = array_filter(array_map('trim', $validated['tags']));
        } else {
            $tags = array_filter(array_map('trim', explode(',', $validated['tags_text'] ?? '')));
        }
        $validated['tags'] = array_values(array_unique(array_slice($tags, 0, 30)));

        unset($validated['tags_text']);

        return $validated;
    }
}
