<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Gallery;
use App\Models\Products;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ShopController extends Controller
{
    public function index(Request $request): Response
    {
        $perPage = (int) $request->query('per_page', 16);
        $perPage = in_array($perPage, [16, 32, 48], true) ? $perPage : 16;
        $filters = $this->filters($request);
        $filters['per_page'] = $perPage;

        $query = Products::query()
            ->with('category:id,name,slug')
            ->where('status', 'active');

        $query
            ->when($filters['search'] !== '', function (Builder $builder) use ($filters): void {
                $search = '%'.$filters['search'].'%';
                $builder->where(fn (Builder $nested) => $nested
                    ->where('name', 'like', $search)
                    ->orWhere('slug', 'like', $search)
                    ->orWhere('vendor', 'like', $search)
                    ->orWhere('brand', 'like', $search)
                    ->orWhere('short_description', 'like', $search));
            })
            ->when($filters['category_id'] !== '', fn (Builder $builder) => $builder->where('category_id', $filters['category_id']))
            ->when($filters['vendor'] !== '', fn (Builder $builder) => $builder->where('vendor', $filters['vendor']))
            ->when($filters['brand'] !== '', fn (Builder $builder) => $builder->where('brand', $filters['brand']))
            ->when($filters['min_price'] !== '', fn (Builder $builder) => $builder->where('price', '>=', $filters['min_price']))
            ->when($filters['max_price'] !== '', fn (Builder $builder) => $builder->where('price', '<=', $filters['max_price']))
            ->when($filters['in_stock'] === '1', fn (Builder $builder) => $builder->where(fn (Builder $b) => $b
                ->where('track_inventory', false)
                ->orWhere(fn (Builder $inner) => $inner->where('track_inventory', true)->where('quantity', '>', 0))
            ));

        $products = $query
            ->orderBy($filters['sort'], $filters['direction'])
            ->paginate($perPage)
            ->withQueryString();

        $imagePaths = $products->getCollection()->pluck('main_image')->filter()->unique();
        $imageDisks = Gallery::query()
            ->whereIn('path', $imagePaths)
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

        $categories = Category::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        $vendors = Products::query()
            ->where('status', 'active')
            ->whereNotNull('vendor')
            ->where('vendor', '<>', '')
            ->distinct()
            ->orderBy('vendor')
            ->pluck('vendor');

        $brands = Products::query()
            ->where('status', 'active')
            ->whereNotNull('brand')
            ->where('brand', '<>', '')
            ->distinct()
            ->orderBy('brand')
            ->pluck('brand');

        $priceRange = Products::query()
            ->where('status', 'active')
            ->selectRaw('MIN(price) as min_price, MAX(price) as max_price')
            ->first();

        return Inertia::render('shop/index', [
            'products' => $products,
            'filters' => $filters,
            'categories' => $categories,
            'vendors' => $vendors,
            'brands' => $brands,
            'priceRange' => [
                'min' => (float) ($priceRange?->min_price ?? 0),
                'max' => (float) ($priceRange?->max_price ?? 10000),
            ],
        ]);
    }

    /** @return array<string, mixed> */
    private function filters(Request $request): array
    {
        $string = static function (mixed $value, int $limit = 100): string {
            return is_string($value) ? mb_substr(trim($value), 0, $limit) : '';
        };

        $sort = $string($request->query('sort'));
        $direction = $string($request->query('direction'));
        $categoryId = $request->query('category_id');
        $minPrice = $request->query('min_price');
        $maxPrice = $request->query('max_price');

        return [
            'search' => $string($request->query('search'), 120),
            'category_id' => is_numeric($categoryId) ? (string) $categoryId : '',
            'vendor' => $string($request->query('vendor')),
            'brand' => $string($request->query('brand')),
            'in_stock' => $request->query('in_stock') === '1' ? '1' : '',
            'min_price' => is_numeric($minPrice) && (float) $minPrice >= 0 ? (string) $minPrice : '',
            'max_price' => is_numeric($maxPrice) && (float) $maxPrice >= 0 ? (string) $maxPrice : '',
            'sort' => in_array($sort, ['name', 'price', 'created_at'], true) ? $sort : 'created_at',
            'direction' => in_array($direction, ['asc', 'desc'], true) ? $direction : 'desc',
            'per_page' => (int) $request->query('per_page', 16),
        ];
    }
}
