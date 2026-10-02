<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable('name', 'slug', 'sku', 'barcode', 'category_id', 'subtitle', 'description', 'short_description', 'product_type', 'vendor', 'variants', 'brand', 'condition', 'price', 'compare_at_price', 'cost_per_item', 'currency', 'main_image', 'gallery', 'track_inventory', 'quantity', 'allow_backorder', 'low_stock_threshold', 'requires_shipping', 'weight', 'weight_unit', 'length', 'width', 'height', 'dimension_unit', 'is_featured', 'sort_order', 'tags', 'meta_title', 'meta_description', 'canonical_url', 'og_title', 'og_description', 'og_image', 'robots', 'status', 'published_at', 'metadata')]
class Products extends Model
{
    use SoftDeletes;

    protected $table = 'products';

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    protected function casts(): array
    {
        return [
            'variants' => 'array',
            'gallery' => 'array',
            'tags' => 'array',
            'metadata' => 'array',
            'track_inventory' => 'boolean',
            'allow_backorder' => 'boolean',
            'requires_shipping' => 'boolean',
            'is_featured' => 'boolean',
            'quantity' => 'integer',
            'low_stock_threshold' => 'integer',
            'sort_order' => 'integer',
            'price' => 'decimal:2',
            'compare_at_price' => 'decimal:2',
            'cost_per_item' => 'decimal:2',
            'weight' => 'decimal:3',
            'length' => 'decimal:2',
            'width' => 'decimal:2',
            'height' => 'decimal:2',
            'published_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Category, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
