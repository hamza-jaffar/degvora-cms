<?php

use App\Models\Category;
use App\Models\Gallery;
use App\Models\Products;
use App\Models\User;
use Inertia\Testing\AssertableInertia;
use Inertia\Testing\AssertableInertia as Assert;

it('persists products using the products table and casts structured fields', function () {
    $product = Products::create([
        'name' => 'Trail bottle',
        'slug' => 'trail-bottle',
        'price' => 19.5,
        'tags' => ['outdoor', 'hydration'],
        'variants' => [['name' => 'Color', 'value' => 'Blue']],
        'is_featured' => true,
    ]);

    $this->assertDatabaseHas('products', [
        'id' => $product->id,
        'slug' => 'trail-bottle',
    ]);

    expect($product->fresh()->tags)->toBe(['outdoor', 'hydration'])
        ->and($product->fresh()->variants[0]['value'])->toBe('Blue')
        ->and($product->fresh()->is_featured)->toBeTrue();
});

it('lists products through the admin index route', function () {
    $user = User::factory()->create();
    Products::create([
        'name' => 'Trail bottle',
        'slug' => 'trail-bottle',
        'price' => 19.5,
    ]);

    $this->actingAs($user)
        ->get(route('admin.products.index'))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('admin/product/index')
            ->has('products.data', 1)
            ->where('products.data.0.name', 'Trail bottle'));
});

it('creates a product with gallery paths and structured fields', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('admin.products.store'), productPayload([
            'pricing_mode' => 'variants',
            'variant_options_json' => '[{"name":"Color","values":["Blue","Black"]},{"name":"Size","values":["Small","Large"]}]',
            'variant_price_options_json' => '["Color"]',
            'variant_items_json' => '[{"options":{"Color":"Blue","Size":"Small"},"price":19.5,"compare_at_price":25,"sku":"TRAIL-BLUE-S","quantity":2},{"options":{"Color":"Blue","Size":"Large"},"price":19.5,"compare_at_price":25,"sku":"TRAIL-BLUE-L","quantity":2},{"options":{"Color":"Black","Size":"Small"},"price":21,"compare_at_price":27,"sku":"TRAIL-BLACK-S","quantity":3},{"options":{"Color":"Black","Size":"Large"},"price":21,"compare_at_price":27,"sku":"TRAIL-BLACK-L","quantity":3}]',
        ]))
        ->assertRedirect(route('admin.products.index'));

    $product = Products::query()->sole();
    expect($product->slug)->toBe('trail-bottle')
        ->and($product->tags)->toBe(['outdoor', 'hydration'])
        ->and($product->variants['pricing_mode'])->toBe('variants')
        ->and($product->variants['price_options'])->toBe(['Color'])
        ->and($product->variants['items'][1]['options'])->toBe(['Color' => 'Blue', 'Size' => 'Large'])
        ->and($product->metadata)->toBe(['source' => 'admin'])
        ->and($product->price)->toBe('19.50')
        ->and($product->quantity)->toBe(10)
        ->and($product->is_featured)->toBeTrue()
        ->and($product->published_at)->not->toBeNull();
});

it('rejects different prices for combinations that share a price dimension', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from(route('admin.products.create'))
        ->post(route('admin.products.store'), productPayload([
            'pricing_mode' => 'variants',
            'variant_options_json' => '[{"name":"Color","values":["Blue"]},{"name":"Size","values":["Small","Large"]}]',
            'variant_price_options_json' => '["Color"]',
            'variant_items_json' => '[{"options":{"Color":"Blue","Size":"Small"},"price":10,"compare_at_price":null,"sku":"BLUE-S","quantity":1},{"options":{"Color":"Blue","Size":"Large"},"price":11,"compare_at_price":null,"sku":"BLUE-L","quantity":1}]',
        ]))
        ->assertRedirect(route('admin.products.create'))
        ->assertSessionHasErrors('variant_items_json');
});

it('allows price to vary by both color and size', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('admin.products.store'), productPayload([
            'pricing_mode' => 'variants',
            'variant_options_json' => '[{"name":"Color","values":["Blue"]},{"name":"Size","values":["Small","Large"]}]',
            'variant_price_options_json' => '["Color","Size"]',
            'variant_items_json' => '[{"options":{"Color":"Blue","Size":"Small"},"price":10,"compare_at_price":null,"sku":"BLUE-S","quantity":1},{"options":{"Color":"Blue","Size":"Large"},"price":12,"compare_at_price":null,"sku":"BLUE-L","quantity":1}]',
        ]))
        ->assertRedirect(route('admin.products.index'));

    $product = Products::query()->sole();
    expect($product->variants['price_options'])->toBe(['Color', 'Size'])
        ->and($product->variants['items'][0]['price'])->toBe(10)
        ->and($product->variants['items'][1]['price'])->toBe(12);
});

it('allows single price for all variations when price_options is empty', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('admin.products.store'), productPayload([
            'pricing_mode' => 'variants',
            'variant_options_json' => '[{"name":"Color","values":["Red","Blue"]},{"name":"Size","values":["Small","Large"]}]',
            'variant_price_options_json' => '[]',
            'variant_items_json' => '[{"options":{"Color":"Red","Size":"Small"},"price":15,"compare_at_price":20,"sku":"RED-S","quantity":5},{"options":{"Color":"Red","Size":"Large"},"price":15,"compare_at_price":20,"sku":"RED-L","quantity":5},{"options":{"Color":"Blue","Size":"Small"},"price":15,"compare_at_price":20,"sku":"BLUE-S","quantity":5},{"options":{"Color":"Blue","Size":"Large"},"price":15,"compare_at_price":20,"sku":"BLUE-L","quantity":5}]',
        ]))
        ->assertRedirect(route('admin.products.index'));

    $product = Products::query()->sole();
    expect($product->variants['price_options'])->toBe([])
        ->and($product->variants['items'][0]['price'])->toBe(15)
        ->and($product->variants['items'][3]['price'])->toBe(15);
});

it('rejects price dimensions that are not defined as product options', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from(route('admin.products.create'))
        ->post(route('admin.products.store'), productPayload([
            'pricing_mode' => 'variants',
            'variant_options_json' => '[{"name":"Color","values":["Blue"]}]',
            'variant_price_options_json' => '[{"invalid":"Color"}]',
            'variant_items_json' => '[{"options":{"Color":"Blue"},"price":10,"compare_at_price":null,"sku":"BLUE-001","quantity":1}]',
        ]))
        ->assertRedirect(route('admin.products.create'))
        ->assertSessionHasErrors('variant_price_options_json');
});

it('stores product images as references to existing gallery assets', function () {
    $user = User::factory()->create();
    $imagePath = 'gallery/trail-bottle.jpg';
    Gallery::create([
        'disk' => 'public',
        'filename' => 'trail-bottle.jpg',
        'original_name' => 'trail-bottle.jpg',
        'path' => $imagePath,
        'mime_type' => 'image/jpeg',
        'alt' => 'Blue trail bottle',
        'size' => '24',
        'width' => '1',
        'height' => '1',
    ]);

    $this->actingAs($user)
        ->post(route('admin.products.store'), productPayload([
            'main_image' => $imagePath,
            'gallery' => [$imagePath],
            'og_image' => $imagePath,
        ]))
        ->assertRedirect(route('admin.products.index'));

    $product = Products::query()->sole();
    expect($product->main_image)->toBe($imagePath)
        ->and($product->gallery)->toBe([$imagePath])
        ->and($product->og_image)->toBe($imagePath);
});

it('rejects invalid product prices and missing product names', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from(route('admin.products.create'))
        ->post(route('admin.products.store'), productPayload([
            'name' => '',
            'price' => '-1',
        ]))
        ->assertRedirect(route('admin.products.create'))
        ->assertSessionHasErrors(['name', 'price']);
});

it('saves products as drafts without a publish timestamp', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('admin.products.store'), productPayload([
            'status' => 'draft',
            'published_at' => null,
        ]))
        ->assertRedirect(route('admin.products.index'));

    $product = Products::query()->sole();
    expect($product->status)->toBe('draft')
        ->and($product->published_at)->toBeNull();
});

it('requires pricing and inventory details for every generated variant', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from(route('admin.products.create'))
        ->post(route('admin.products.store'), productPayload([
            'pricing_mode' => 'variants',
            'variant_options_json' => '[{"name":"Size","values":["Small","Large"]}]',
            'variant_price_options_json' => '["Size"]',
            'variant_items_json' => '[{"options":{"Size":"Small"},"price":24.5,"compare_at_price":null,"sku":"SMALL-001","quantity":3}]',
        ]))
        ->assertRedirect(route('admin.products.create'))
        ->assertSessionHasErrors('variant_items_json');
});

it('filters products by catalog and inventory attributes', function () {
    $user = User::factory()->create();
    $category = Category::create([
        'name' => 'Travel',
        'slug' => 'travel',
    ]);
    Products::query()->create(productPayload([
        'name' => 'Blue travel bottle',
        'slug' => 'blue-travel-bottle',
        'category_id' => $category->id,
        'vendor' => 'Northstar',
        'brand' => 'Summit',
        'product_type' => 'physical',
        'status' => 'active',
        'is_featured' => true,
        'price' => '35.00',
        'quantity' => 4,
    ]));
    Products::query()->create(productPayload([
        'name' => 'Digital map',
        'slug' => 'digital-map',
        'sku' => 'MAP-001',
        'product_type' => 'digital',
        'status' => 'draft',
        'is_featured' => false,
        'price' => '8.00',
        'quantity' => 0,
    ]));

    $this->actingAs($user)
        ->get(route('admin.products.index', [
            'category_id' => $category->id,
            'status' => 'active',
            'product_type' => 'physical',
            'vendor' => 'Northstar',
            'brand' => 'Summit',
            'is_featured' => '1',
            'stock' => 'low_stock',
            'min_price' => 30,
            'max_price' => 40,
        ]))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/product/index')
            ->has('products.data', 1)
            ->where('products.data.0.slug', 'blue-travel-bottle')
            ->where('filters.stock', 'low_stock'));
});

it('shows and edits a product by its resource route', function () {
    $user = User::factory()->create();
    $product = Products::query()->create(productPayload());

    $this->actingAs($user)
        ->get(route('admin.products.show', $product))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/product/show')
            ->where('product.id', $product->id));

    $this->actingAs($user)
        ->get(route('admin.products.edit', $product))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/product/edit')
            ->where('product.id', $product->id)
            ->has('categories')
            ->has('media.data'));
});

it('updates product details and soft deletes products', function () {
    $user = User::factory()->create();
    $product = Products::query()->create(productPayload());

    $this->actingAs($user)
        ->put(route('admin.products.update', $product), productPayload([
            'name' => 'Updated trail bottle',
            'sku' => 'UPDATED-001',
            'price' => '42.00',
            'is_featured' => '0',
        ]))
        ->assertRedirect(route('admin.products.index'));

    expect($product->fresh()->name)->toBe('Updated trail bottle')
        ->and($product->fresh()->sku)->toBe('UPDATED-001')
        ->and($product->fresh()->price)->toBe('42.00')
        ->and($product->fresh()->is_featured)->toBeFalse();

    $this->actingAs($user)
        ->delete(route('admin.products.destroy', $product->fresh()))
        ->assertRedirect(route('admin.products.index'));

    expect($product->fresh()->trashed())->toBeTrue();
});

it('updates variant prices and recalculates product-level price and inventory', function () {
    $user = User::factory()->create();
    $product = Products::query()->create(productPayload([
        'pricing_mode' => 'variants',
        'price' => '12.00',
        'quantity' => 5,
        'sku' => null,
        'variants' => [
            'pricing_mode' => 'variants',
            'options' => [['name' => 'Size', 'values' => ['Small', 'Large']]],
            'price_options' => ['Size'],
            'items' => [
                ['options' => ['Size' => 'Small'], 'price' => 12, 'compare_at_price' => null, 'sku' => 'SMALL-001', 'quantity' => 2],
                ['options' => ['Size' => 'Large'], 'price' => 15, 'compare_at_price' => null, 'sku' => 'LARGE-001', 'quantity' => 3],
            ],
        ],
    ]));

    $this->actingAs($user)
        ->put(route('admin.products.update', $product), productPayload([
            'pricing_mode' => 'variants',
            'variant_options_json' => '[{"name":"Size","values":["Small","Large"]}]',
            'variant_price_options_json' => '["Size"]',
            'variant_items_json' => '[{"options":{"Size":"Small"},"price":14,"compare_at_price":null,"sku":"SMALL-001","quantity":4},{"options":{"Size":"Large"},"price":18,"compare_at_price":null,"sku":"LARGE-001","quantity":7}]',
        ]))
        ->assertRedirect(route('admin.products.index'));

    expect($product->fresh()->price)
        ->toBe('14.00')
        ->and($product->fresh()->quantity)->toBe(11)
        ->and($product->fresh()->variants['items'][1]['price'])->toBe(18);
});

/** @return array<string, mixed> */
it('restores soft deleted products and force deletes them', function () {
    $user = User::factory()->create();
    $product = Products::create([
        'name' => 'Deleted bottle',
        'slug' => 'deleted-bottle',
        'price' => 19.5,
    ]);

    $product->delete();
    expect($product->fresh()->trashed())->toBeTrue();

    $this->actingAs($user)
        ->post(route('admin.products.restore', $product->id))
        ->assertRedirect(route('admin.products.index'));

    expect($product->fresh()->trashed())->toBeFalse();

    $this->actingAs($user)
        ->delete(route('admin.products.force-delete', $product->id))
        ->assertRedirect(route('admin.products.index'));

    expect(Products::withTrashed()->find($product->id))->toBeNull();
});

function productPayload(array $overrides = []): array
{
    return array_replace([
        'name' => 'Trail bottle',
        'slug' => 'trail-bottle',
        'sku' => 'TRAIL-001',
        'barcode' => '',
        'category_id' => null,
        'subtitle' => 'Lightweight hydration',
        'description' => '<p>Insulated bottle</p>',
        'short_description' => 'A lightweight bottle for travel.',
        'product_type' => 'physical',
        'vendor' => 'Northstar',
        'brand' => 'Summit',
        'condition' => 'new',
        'price' => '24.50',
        'compare_at_price' => null,
        'cost_per_item' => null,
        'currency' => 'PKR',
        'main_image' => null,
        'gallery' => null,
        'track_inventory' => '1',
        'quantity' => '8',
        'allow_backorder' => '0',
        'low_stock_threshold' => '5',
        'requires_shipping' => '1',
        'weight' => '0.350',
        'weight_unit' => 'kg',
        'length' => '20',
        'width' => '8',
        'height' => '8',
        'dimension_unit' => 'cm',
        'is_featured' => '1',
        'sort_order' => '0',
        'tags_text' => 'outdoor, hydration',
        'pricing_mode' => 'single',
        'variant_options_json' => '[]',
        'variant_price_options_json' => '[]',
        'variant_items_json' => '[]',
        'meta_title' => 'Trail bottle',
        'meta_description' => 'Insulated travel bottle',
        'canonical_url' => null,
        'og_title' => 'Trail bottle',
        'og_description' => 'Stay hydrated on the trail',
        'og_image' => null,
        'robots' => 'index,follow',
        'status' => 'active',
        'published_at' => null,
        'metadata_json' => '{"source":"admin"}',
    ], $overrides);
}
