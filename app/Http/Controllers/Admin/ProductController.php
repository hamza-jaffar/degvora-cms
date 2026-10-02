<?php

namespace App\Http\Controllers\Admin;

use App\Helpers\SlugHelper;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProductRequest;
use App\Http\Requests\Admin\UpdateProductRequest;
use App\Models\Category;
use App\Models\Gallery;
use App\Models\Products;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $perPage = (int) $request->query('per_page', 10);
        $perPage = in_array($perPage, [10, 25, 50, 100], true) ? $perPage : 10;
        $filters = $this->filters($request);
        $filters['per_page'] = $perPage;

        $query = Products::query()->with('category:id,name,slug');
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
                    ->orWhere('sku', 'like', $search)
                    ->orWhere('barcode', 'like', $search)
                    ->orWhere('vendor', 'like', $search)
                    ->orWhere('brand', 'like', $search));
            })
            ->when($filters['category_id'] !== '', fn (Builder $builder) => $builder->where('category_id', $filters['category_id']))
            ->when($filters['status'] !== '', fn (Builder $builder) => $builder->where('status', $filters['status']))
            ->when($filters['product_type'] !== '', fn (Builder $builder) => $builder->where('product_type', $filters['product_type']))
            ->when($filters['vendor'] !== '', fn (Builder $builder) => $builder->where('vendor', $filters['vendor']))
            ->when($filters['brand'] !== '', fn (Builder $builder) => $builder->where('brand', $filters['brand']))
            ->when($filters['is_featured'] !== '', fn (Builder $builder) => $builder->where('is_featured', $filters['is_featured'] === '1'))
            ->when($filters['stock'] === 'in_stock', fn (Builder $builder) => $builder->where('track_inventory', true)->where('quantity', '>', 0))
            ->when($filters['stock'] === 'out_of_stock', fn (Builder $builder) => $builder->where('track_inventory', true)->where('quantity', 0))
            ->when($filters['stock'] === 'low_stock', fn (Builder $builder) => $builder->where('track_inventory', true)->where('quantity', '>', 0)->whereRaw('quantity <= COALESCE(low_stock_threshold, 5)'))
            ->when($filters['stock'] === 'not_tracked', fn (Builder $builder) => $builder->where('track_inventory', false))
            ->when($filters['min_price'] !== '', fn (Builder $builder) => $builder->where('price', '>=', $filters['min_price']))
            ->when($filters['max_price'] !== '', fn (Builder $builder) => $builder->where('price', '<=', $filters['max_price']));

        $products = $query
            ->orderBy($filters['sort'], $filters['direction'])
            ->paginate($perPage)
            ->withQueryString();

        $imageDisks = Gallery::query()
            ->whereIn('path', $products->getCollection()->pluck('main_image')->filter()->unique())
            ->pluck('disk', 'path');

        $products->getCollection()->transform(function (Products $product) use ($imageDisks): Products {
            $product->setAttribute(
                'main_image_url',
                $product->main_image === null
                    ? null
                    : Storage::disk($imageDisks[$product->main_image] ?? 'public')->url($product->main_image),
            );

            return $product;
        });

        return Inertia::render('admin/product/index', [
            'products' => $products,
            'filters' => $filters,
            'categories' => Category::query()->orderBy('name')->get(['id', 'name']),
            'vendors' => Products::withTrashed()->whereNotNull('vendor')->where('vendor', '<>', '')->distinct()->orderBy('vendor')->pluck('vendor'),
            'brands' => Products::withTrashed()->whereNotNull('brand')->where('brand', '<>', '')->distinct()->orderBy('brand')->pluck('brand'),
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('admin/product/create', [
            ...$this->formProps($request),
            'product' => null,
        ]);
    }

    public function store(StoreProductRequest $request): RedirectResponse
    {
        $data = $request->productData();
        $data['slug'] = SlugHelper::unique($data['name'], table: 'products');
        $data['published_at'] = $data['status'] === 'active'
            ? ($data['published_at'] ?? now())
            : null;

        Products::query()->create($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Product created successfully.')]);

        return to_route('admin.products.index');
    }

    public function show(Products $product): Response
    {
        $product->load('category:id,name,slug');

        return Inertia::render('admin/product/show', [
            'product' => $this->serializeProduct($product),
        ]);
    }

    public function edit(Request $request, Products $product): Response
    {
        $product->load('category:id,name,slug');

        return Inertia::render('admin/product/edit', [
            ...$this->formProps($request),
            'product' => $this->serializeProduct($product),
        ]);
    }

    public function update(UpdateProductRequest $request, Products $product): RedirectResponse
    {
        $data = $request->productData();
        $data['slug'] = SlugHelper::unique($data['name'], table: 'products', ignoreId: $product->id);
        $data['published_at'] = $data['status'] === 'active'
            ? ($data['published_at'] ?? $product->published_at ?? now())
            : null;

        $product->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Product updated successfully.')]);

        return to_route('admin.products.index');
    }

    public function destroy(Products $product): RedirectResponse
    {
        $product->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Product moved to trash successfully.')]);

        return to_route('admin.products.index');
    }

    public function restore(string $product): RedirectResponse
    {
        $model = Products::withTrashed()->findOrFail($product);
        $model->restore();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Product restored successfully.')]);

        return to_route('admin.products.index');
    }

    public function forceDelete(string $product): RedirectResponse
    {
        $model = Products::withTrashed()->findOrFail($product);
        $model->forceDelete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Product permanently deleted.')]);

        return to_route('admin.products.index');
    }

    /** @return array<string, mixed> */
    private function filters(Request $request): array
    {
        $string = static function (mixed $value, int $limit = 100): string {
            return is_string($value) ? mb_substr(trim($value), 0, $limit) : '';
        };
        $status = $string($request->query('status'));
        $trashed = $string($request->query('trashed'));
        $productType = $string($request->query('product_type'));
        $stock = $string($request->query('stock'));
        $featured = $string($request->query('is_featured'));
        $sort = $string($request->query('sort'));
        $direction = $string($request->query('direction'));
        $categoryId = $request->query('category_id');
        $minPrice = $request->query('min_price');
        $maxPrice = $request->query('max_price');

        return [
            'search' => $string($request->query('search'), 120),
            'category_id' => is_numeric($categoryId) ? (string) $categoryId : '',
            'status' => in_array($status, ['draft', 'active', 'archived'], true) ? $status : '',
            'trashed' => in_array($trashed, ['with', 'only'], true) ? $trashed : '',
            'product_type' => in_array($productType, ['physical', 'digital', 'service'], true) ? $productType : '',
            'vendor' => $string($request->query('vendor')),
            'brand' => $string($request->query('brand')),
            'is_featured' => in_array($featured, ['0', '1'], true) ? $featured : '',
            'stock' => in_array($stock, ['in_stock', 'out_of_stock', 'low_stock', 'not_tracked'], true) ? $stock : '',
            'min_price' => is_numeric($minPrice) && (float) $minPrice >= 0 ? (string) $minPrice : '',
            'max_price' => is_numeric($maxPrice) && (float) $maxPrice >= 0 ? (string) $maxPrice : '',
            'sort' => in_array($sort, ['name', 'price', 'quantity', 'created_at'], true) ? $sort : 'created_at',
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
            $mediaQuery->where(fn (Builder $builder) => $builder->where('original_name', 'like', '%'.$search.'%')->orWhere('alt', 'like', '%'.$search.'%'));
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
            'categories' => Category::query()->orderBy('name')->get(['id', 'name']),
        ];
    }

    /** @return array<string, mixed> */
    private function serializeProduct(Products $product): array
    {
        $data = $product->toArray();
        $data['main_image_asset'] = $this->galleryAssetForPath($product->main_image);
        $galleryAssets = [];
        $galleryPaths = $product->getAttribute('gallery');
        foreach (is_array($galleryPaths) ? $galleryPaths : [] as $path) {
            if (! is_string($path)) {
                continue;
            }

            $asset = $this->galleryAssetForPath($path);
            if ($asset !== null) {
                $galleryAssets[] = $asset;
            }
        }
        $data['gallery_assets'] = $galleryAssets;
        $data['og_image_asset'] = $this->galleryAssetForPath($product->og_image);

        return $data;
    }

    /** @return array<string, mixed>|null */
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
