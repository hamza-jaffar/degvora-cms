<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Page\StorePageRequest;
use App\Http\Requests\Admin\Page\UpdatePageRequest;
use App\Models\Gallery;
use App\Models\Page;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller
{
    public function index(Request $request): Response
    {
        $perPage = (int) $request->query('per_page', 10);
        $perPage = in_array($perPage, [10, 25, 50, 100], true) ? $perPage : 10;
        $filters = $this->filters($request);
        $filters['per_page'] = $perPage;

        $query = Page::query()->with('parent:id,name,slug');

        if ($filters['trashed'] === 'only') {
            $query->onlyTrashed();
        } elseif ($filters['trashed'] === 'with') {
            $query->withTrashed();
        }

        $query
            ->when($filters['search'] !== '', function (Builder $builder) use ($filters): void {
                $search = '%'.$filters['search'].'%';
                $builder->where(fn (Builder $nested) => $nested
                    ->where('name', 'like', $search)
                    ->orWhere('slug', 'like', $search)
                    ->orWhere('excerpt', 'like', $search));
            })
            ->when($filters['status'] !== '', fn (Builder $builder) => $builder->where('status', $filters['status']));

        $pages = $query
            ->orderBy($filters['sort'], $filters['direction'])
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Page $page) => $this->serializePage($page));

        return Inertia::render('admin/page/index', [
            'pages' => $pages,
            'filters' => $filters,
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('admin/page/create', [
            ...$this->formProps($request),
            'page' => null,
        ]);
    }

    public function store(StorePageRequest $request): RedirectResponse
    {
        $data = $request->pageData();
        $data['published_at'] = $data['status'] === 'published'
            ? ($data['published_at'] ?? now())
            : ($data['status'] === 'scheduled' ? $data['published_at'] : null);

        Page::query()->create($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Page created successfully.')]);

        return to_route('admin.page.index');
    }

    public function edit(Request $request, Page $page): Response
    {
        $page->load('parent:id,name,slug');

        return Inertia::render('admin/page/edit', [
            ...$this->formProps($request),
            'page' => $this->serializePage($page),
        ]);
    }

    public function update(UpdatePageRequest $request, Page $page): RedirectResponse
    {
        $data = $request->pageData();
        $data['published_at'] = $data['status'] === 'published'
            ? ($data['published_at'] ?? $page->published_at ?? now())
            : ($data['status'] === 'scheduled' ? $data['published_at'] : null);

        $page->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Page updated successfully.')]);

        return to_route('admin.page.index');
    }

    public function destroy(Page $page): RedirectResponse
    {
        $page->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Page moved to trash successfully.')]);

        return to_route('admin.page.index');
    }

    public function restore(string $page): RedirectResponse
    {
        $model = Page::withTrashed()->findOrFail($page);
        $model->restore();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Page restored successfully.')]);

        return to_route('admin.page.index');
    }

    public function forceDelete(string $page): RedirectResponse
    {
        $model = Page::withTrashed()->findOrFail($page);
        $model->forceDelete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Page permanently deleted.')]);

        return to_route('admin.page.index');
    }

    /** @return array<string, string> */
    private function filters(Request $request): array
    {
        $string = static function (mixed $value, int $limit = 100): string {
            return is_string($value) ? mb_substr(trim($value), 0, $limit) : '';
        };

        $status = $string($request->query('status'));
        $trashed = $string($request->query('trashed'));
        $sort = $string($request->query('sort'));
        $direction = $string($request->query('direction'));

        return [
            'search' => $string($request->query('search'), 120),
            'status' => in_array($status, ['draft', 'published', 'scheduled', 'archived'], true) ? $status : '',
            'trashed' => in_array($trashed, ['with', 'only'], true) ? $trashed : '',
            'sort' => in_array($sort, ['name', 'created_at', 'sort_order', 'published_at'], true) ? $sort : 'created_at',
            'direction' => in_array($direction, ['asc', 'desc'], true) ? $direction : 'desc',
            'per_page' => (int) $request->query('per_page', 10),
        ];
    }

    /** @return array<string, mixed> */
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
            'parentPages' => Page::query()->whereNull('parent_id')->orderBy('name')->get(['id', 'name', 'slug']),
        ];
    }

    /** @return array<string, mixed> */
    private function serializePage(Page $page): array
    {
        $data = $page->toArray();
        $data['featured_media_asset'] = $this->galleryAssetForPath($page->featured_media);

        return $data;
    }

    /** @return array<string, mixed>|null */
    private function galleryAssetForPath(?string $path): ?array
    {
        if ($path === null || $path === '') {
            return null;
        }

        $asset = Gallery::query()->where('path', $path)->first(['id', 'disk', 'original_name', 'alt', 'mime_type']);

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

    /** @return array<string, mixed> */
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
