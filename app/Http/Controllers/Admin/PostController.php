<?php

namespace App\Http\Controllers\Admin;

use App\Helpers\SlugHelper;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Post\StorePostRequest;
use App\Http\Requests\Admin\Post\UpdatePostRequest;
use App\Models\Category;
use App\Models\Gallery;
use App\Models\Post;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PostController extends Controller
{
    public function index(Request $request): Response
    {
        $perPage = (int) $request->query('per_page', 10);
        $perPage = in_array($perPage, [10, 25, 50, 100], true) ? $perPage : 10;
        $filters = $this->filters($request);
        $filters['per_page'] = $perPage;

        $query = Post::query()->with(['category:id,name,slug', 'author:id,name,email']);

        if ($filters['trashed'] === 'only') {
            $query->onlyTrashed();
        } elseif ($filters['trashed'] === 'with') {
            $query->withTrashed();
        }

        $query
            ->when($filters['search'] !== '', function (Builder $builder) use ($filters): void {
                $search = '%'.$filters['search'].'%';
                $builder->where(fn (Builder $nested) => $nested
                    ->where('title', 'like', $search)
                    ->orWhere('slug', 'like', $search)
                    ->orWhere('excerpt', 'like', $search));
            })
            ->when($filters['status'] !== '', fn (Builder $builder) => $builder->where('status', $filters['status']))
            ->when($filters['category_id'] !== '', fn (Builder $builder) => $builder->where('category_id', $filters['category_id']))
            ->when($filters['is_featured'] !== '', fn (Builder $builder) => $builder->where('is_featured', $filters['is_featured'] === '1'));

        $posts = $query
            ->orderBy($filters['sort'], $filters['direction'])
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Post $post) => $this->serializePost($post));

        return Inertia::render('admin/post/index', [
            'posts' => $posts,
            'filters' => $filters,
            'categories' => Category::query()->orderBy('name')->get(['id', 'name', 'slug']),
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('admin/post/create', [
            ...$this->formProps($request),
            'post' => null,
        ]);
    }

    public function store(StorePostRequest $request): RedirectResponse
    {
        $data = $request->postData();
        $data['slug'] = SlugHelper::unique($data['title'], table: 'posts');
        $data['published_at'] = $data['status'] === 'published'
            ? ($data['published_at'] ?? now())
            : ($data['status'] === 'scheduled' ? $data['published_at'] : null);

        Post::query()->create($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Blog post created successfully.')]);

        return to_route('admin.posts.index');
    }

    public function edit(Request $request, Post $post): Response
    {
        $post->load(['category:id,name,slug', 'author:id,name,email']);

        return Inertia::render('admin/post/edit', [
            ...$this->formProps($request),
            'post' => $this->serializePost($post),
        ]);
    }

    public function update(UpdatePostRequest $request, Post $post): RedirectResponse
    {
        $data = $request->postData();
        $data['slug'] = SlugHelper::unique($data['title'], table: 'posts', ignoreId: $post->id);
        $data['published_at'] = $data['status'] === 'published'
            ? ($data['published_at'] ?? $post->published_at ?? now())
            : ($data['status'] === 'scheduled' ? $data['published_at'] : null);

        $post->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Blog post updated successfully.')]);

        return to_route('admin.posts.index');
    }

    public function destroy(Post $post): RedirectResponse
    {
        $post->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Blog post moved to trash successfully.')]);

        return to_route('admin.posts.index');
    }

    public function restore(string $post): RedirectResponse
    {
        $model = Post::withTrashed()->findOrFail($post);
        $model->restore();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Blog post restored successfully.')]);

        return to_route('admin.posts.index');
    }

    public function forceDelete(string $post): RedirectResponse
    {
        $model = Post::withTrashed()->findOrFail($post);
        $model->forceDelete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Blog post permanently deleted.')]);

        return to_route('admin.posts.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function filters(Request $request): array
    {
        $string = static function (mixed $value, int $limit = 100): string {
            return is_string($value) ? mb_substr(trim($value), 0, $limit) : '';
        };

        $status = $string($request->query('status'));
        $trashed = $string($request->query('trashed'));
        $featured = $string($request->query('is_featured'));
        $sort = $string($request->query('sort'));
        $direction = $string($request->query('direction'));
        $categoryId = $request->query('category_id');

        return [
            'search' => $string($request->query('search'), 120),
            'category_id' => is_numeric($categoryId) ? (string) $categoryId : '',
            'status' => in_array($status, ['draft', 'published', 'scheduled', 'archived'], true) ? $status : '',
            'trashed' => in_array($trashed, ['with', 'only'], true) ? $trashed : '',
            'is_featured' => in_array($featured, ['0', '1'], true) ? $featured : '',
            'sort' => in_array($sort, ['title', 'created_at', 'published_at'], true) ? $sort : 'created_at',
            'direction' => in_array($direction, ['asc', 'desc'], true) ? $direction : 'desc',
            'per_page' => (int) $request->query('per_page', 10),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function formProps(Request $request): array
    {
        $filter = $request->query('filter', 'image');
        $filter = is_string($filter) && in_array($filter, ['all', 'image', 'video', 'other'], true)
            ? $filter
            : 'image';
        $search = $request->query('search', '');
        $search = is_string($search) ? mb_substr(trim($search), 0, 100) : '';

        $mediaQuery = Gallery::query();
        match ($filter) {
            'image' => $mediaQuery->where('mime_type', 'like', 'image/%'),
            'video' => $mediaQuery->where('mime_type', 'like', 'video/%'),
            'other' => $mediaQuery->where('mime_type', 'not like', 'image/%')->where('mime_type', 'not like', 'video/%'),
            default => null,
        };

        if ($search !== '') {
            $mediaQuery->where(fn (Builder $builder) => $builder
                ->where('original_name', 'like', '%'.$search.'%')
                ->orWhere('alt', 'like', '%'.$search.'%'));
        }

        $allCounts = [
            'all' => Gallery::query()->count(),
            'image' => Gallery::query()->where('mime_type', 'like', 'image/%')->count(),
            'video' => Gallery::query()->where('mime_type', 'like', 'video/%')->count(),
            'other' => Gallery::query()->where('mime_type', 'not like', 'image/%')->where('mime_type', 'not like', 'video/%')->count(),
        ];

        return [
            'media' => Inertia::scroll(fn () => $mediaQuery->latest()->paginate(24)->withQueryString()->through(fn (Gallery $asset): array => $this->serializeGalleryAsset($asset))),
            'counts' => $allCounts,
            'filter' => $filter,
            'search' => $search,
            'categories' => Category::query()->orderBy('name')->get(['id', 'name', 'slug']),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializePost(Post $post): array
    {
        $data = $post->toArray();
        $data['featured_image_asset'] = $this->galleryAssetForPath($post->featured_image);
        $data['og_image_asset'] = $this->galleryAssetForPath($post->og_image);

        return $data;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function galleryAssetForPath(?string $path): ?array
    {
        if ($path === null || $path === '') {
            return null;
        }

        $asset = DB::table('galleries')
            ->where('path', $path)
            ->first(['id', 'disk', 'original_name', 'alt', 'mime_type']);

        if ($asset === null) {
            return [
                'id' => 0,
                'name' => basename($path),
                'alt' => '',
                'path' => $path,
                'url' => Storage::disk('public')->url($path),
                'type' => 'image',
                'mimeType' => 'image/*',
            ];
        }

        return [
            'id' => $asset->id,
            'name' => $asset->original_name,
            'alt' => $asset->alt,
            'path' => $path,
            'url' => Storage::disk($asset->disk)->url($path),
            'type' => 'image',
            'mimeType' => $asset->mime_type,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeGalleryAsset(Gallery $asset): array
    {
        return [
            'id' => $asset->id,
            'name' => $asset->original_name,
            'alt' => $asset->alt,
            'path' => $asset->path,
            'url' => Storage::disk($asset->disk)->url($asset->path),
            'type' => str_starts_with($asset->mime_type, 'image/') ? 'image' : (str_starts_with($asset->mime_type, 'video/') ? 'video' : 'other'),
            'mimeType' => $asset->mime_type,
        ];
    }
}
