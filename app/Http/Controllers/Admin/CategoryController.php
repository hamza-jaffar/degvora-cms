<?php

namespace App\Http\Controllers\Admin;

use App\Helpers\SlugHelper;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Categry\CreateCategoryRequest;
use App\Models\Category;
use App\Models\Gallery;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->input('per_page', 10);

        $perPage = in_array($perPage, [10, 25, 50, 100], true)
            ? $perPage
            : 10;

        $parentCategorySlug = $request->input('parent_category_slug');

        $requestedStatus = $request->input('status', '');
        $requestedFeatured = $request->input('is_featured', '');

        $status = in_array($requestedStatus, ['active', 'inactive'], true)
            ? $requestedStatus
            : '';

        $featured = in_array((string) $requestedFeatured, ['1', '0'], true)
            ? (string) $requestedFeatured
            : '';

        $categories = Category::query()
            ->with('parent:id,name,slug')
            ->when(
                $parentCategorySlug,
                function ($query) use ($parentCategorySlug) {
                    $query->whereHas('parent', function ($parent) use ($parentCategorySlug) {
                        $parent->where('slug', $parentCategorySlug);
                    });
                },
                function ($query) {
                    $query->whereNull('parent_id');
                }
            )
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->input('search');

                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($status !== '', function ($query) use ($status) {
                $query->where('is_active', $status === 'active');
            })
            ->when($featured !== '', function ($query) use ($featured) {
                $query->where('is_featured', $featured === '1');
            })
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (Category $category): Category {
                $category->setAttribute(
                    'image_url',
                    $category->image !== null
                        ? Storage::disk('public')->url($category->image)
                        : null,
                );

                return $category;
            });

        return Inertia::render('admin/category/index', [
            'categories' => $categories,

            'filters' => [
                'search' => $request->input('search', ''),
                'per_page' => $perPage,
                'parent_category_slug' => $parentCategorySlug ?? '',
                'is_featured' => $featured,
                'status' => $status,
            ],

            'parent_categories' => Category::query()
                ->select('id', 'name', 'slug', 'parent_id')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function create(Request $request): Response
    {
        $parentCategorySlug = $request->query('parent_category_slug');

        return Inertia::render('admin/category/create', [
            ...$this->galleryPickerProps($request),
            'parent_categories' => Category::query()
                ->select('id', 'name', 'slug', 'parent_id')
                ->orderBy('name')
                ->get(),
            'parent_category_slug' => is_string($parentCategorySlug)
                ? $parentCategorySlug
                : '',
            'initial_parent_id' => is_string($parentCategorySlug)
                ? Category::query()->where('slug', $parentCategorySlug)->value('id')
                : null,
        ]);
    }

    public function store(CreateCategoryRequest $request)
    {
        try {
            $validated = $request->validated();

            $validated['slug'] = SlugHelper::unique($validated['name'],
                table: 'categories', );

            if ($request->hasFile('image')) {
                $validated['image'] = $request->file('image')
                    ->store('categories', 'public');
            }

            $category = Category::create([
                'parent_id' => $validated['parent_id'] ?? null,
                'name' => $validated['name'],
                'slug' => $validated['slug'],
                'description' => $validated['description'] ?? null,
                'image' => $validated['image'] ?? null,
                'sort_order' => $validated['sort_order'] ?? 0,
                'is_active' => $validated['is_active'] ?? true,
                'is_featured' => $validated['is_featured'] ?? false,
                'meta_title' => $validated['meta_title'] ?? null,
                'meta_description' => $validated['meta_description'] ?? null,
            ]);

            Inertia::flash('toast', [
                'type' => 'success',
                'message' => __('Category created successfully.'),
            ]);

            return redirect()->route('admin.category.index');

        } catch (\Exception $e) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => __('Failed to create category.'),
            ]);

            return back()->withInput();
        }
    }

    public function edit(Request $request, Category $category): Response
    {
        return Inertia::render('admin/category/edit', [
            'category' => $category,
            'initialImage' => $this->categoryImageData($category),
            'parent_categories' => Category::query()
                ->select('id', 'name', 'slug', 'parent_id')
                ->whereKeyNot($category->id)
                ->orderBy('name')
                ->get(),
            ...$this->galleryPickerProps($request),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'id' => ['required', 'integer', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'parent_id' => ['nullable', 'integer', 'exists:categories,id'],
            'description' => ['nullable', 'string'],
            'image' => ['nullable', 'string'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'is_featured' => ['sometimes', 'boolean'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
        ]);

        $category = Category::query()->findOrFail($validated['id']);
        $category->update([
            'parent_id' => $validated['parent_id'] ?? null,
            'name' => $validated['name'],
            'slug' => SlugHelper::unique(
                $validated['name'],
                table: 'categories',
                ignoreId: $category->id,
            ),
            'description' => $validated['description'] ?? null,
            'image' => $validated['image'] ?? null,
            'sort_order' => $validated['sort_order'] ?? $category->sort_order,
            'is_active' => $request->boolean('is_active'),
            'is_featured' => $request->boolean('is_featured'),
            'meta_title' => $validated['meta_title'] ?? null,
            'meta_description' => $validated['meta_description'] ?? null,
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Category updated successfully.'),
        ]);

        return redirect()->route('admin.category.index');
    }

    public function delete(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'id' => ['required', 'integer', 'exists:categories,id'],
        ]);

        Category::query()->findOrFail($validated['id'])->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Category deleted successfully.'),
        ]);

        return redirect()->route('admin.category.index');
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

        $query = Gallery::query();

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

        return [
            'media' => Inertia::scroll(fn () => $query
                ->latest()
                ->paginate(24)
                ->withQueryString()
                ->through(fn (Gallery $asset): array => $this->galleryAssetData($asset))),
            'pickerAsset' => $request->session()->pull('pickerAsset'),
            'counts' => [
                'all' => Gallery::query()->count(),
                'image' => Gallery::query()->where('mime_type', 'like', 'image/%')->count(),
                'video' => Gallery::query()->where('mime_type', 'like', 'video/%')->count(),
                'other' => Gallery::query()
                    ->where('mime_type', 'not like', 'image/%')
                    ->where('mime_type', 'not like', 'video/%')
                    ->count(),
            ],
            'filter' => $filter,
            'search' => $search,
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
    private function categoryImageData(Category $category): ?array
    {
        if ($category->image === null || $category->image === '') {
            return null;
        }

        $asset = Gallery::query()->where('path', $category->image)->first();

        if ($asset !== null) {
            return $this->galleryAssetData($asset);
        }

        return [
            'id' => 0,
            'name' => basename($category->image),
            'alt' => '',
            'path' => $category->image,
            'url' => Storage::disk('public')->url($category->image),
            'type' => 'image',
            'mimeType' => 'image/*',
        ];
    }
}
