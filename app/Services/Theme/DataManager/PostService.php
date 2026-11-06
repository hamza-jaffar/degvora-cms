<?php

namespace App\Services\Theme\DataManager;

use App\Models\Category;
use App\Models\Post;
use App\Models\Setting;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class PostService
{
    /**
     * Get paginated published posts.
     */
    public function paginate(?int $perPage = null, ?string $category = null): LengthAwarePaginator
    {
        $defaultPerPage = (int) Setting::query()->where('key', 'posts_per_page')->value('value');
        $perPage = $perPage ?? ($defaultPerPage > 0 ? $defaultPerPage : 9);

        return $this->query($category)
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * Get latest published posts.
     *
     * @return Collection<int, Post>
     */
    public function latest(int $limit = 3, ?string $category = null): Collection
    {
        return $this->query($category)
            ->take($limit)
            ->get();
    }

    /**
     * Get featured published posts.
     *
     * @return Collection<int, Post>
     */
    public function featured(int $limit = 3): Collection
    {
        return Post::query()
            ->published()
            ->featured()
            ->with(['category:id,name,slug', 'author:id,name'])
            ->latest('published_at')
            ->take($limit)
            ->get();
    }

    /**
     * Get all published posts.
     *
     * @return Collection<int, Post>
     */
    public function all(?string $category = null): Collection
    {
        return $this->query($category)->get();
    }

    /**
     * Find a published post by slug or ID.
     */
    public function find(string|int $slugOrId): ?Post
    {
        return Post::query()
            ->published()
            ->with(['category:id,name,slug', 'author:id,name'])
            ->where(function (Builder $builder) use ($slugOrId): void {
                if (is_numeric($slugOrId)) {
                    $builder->where('id', (int) $slugOrId);
                } else {
                    $builder->where('slug', $slugOrId);
                }
            })
            ->first();
    }

    /**
     * Get related posts for a given post.
     *
     * @return Collection<int, Post>
     */
    public function related(Post $post, int $limit = 3): Collection
    {
        return Post::query()
            ->published()
            ->where('id', '!=', $post->id)
            ->when($post->category_id !== null, function (Builder $query) use ($post): void {
                $query->where('category_id', $post->category_id);
            })
            ->with(['category:id,name,slug', 'author:id,name'])
            ->latest('published_at')
            ->take($limit)
            ->get();
    }

    /**
     * Get published posts query builder.
     */
    public function query(?string $category = null): Builder
    {
        return Post::query()
            ->published()
            ->with(['category:id,name,slug', 'author:id,name'])
            ->when($category !== null && $category !== '', function (Builder $query) use ($category): void {
                $query->whereHas('category', function (Builder $catQuery) use ($category): void {
                    $catQuery->where('slug', $category)
                        ->orWhere('name', $category);
                });
            })
            ->latest('published_at');
    }

    /**
     * Get active categories that have published posts.
     *
     * @return Collection<int, Category>
     */
    public function categories(): Collection
    {
        return Category::query()
            ->whereHas('posts', fn (Builder $q) => $q->published())
            ->withCount(['posts' => fn (Builder $q) => $q->published()])
            ->orderBy('name')
            ->get();
    }
}
