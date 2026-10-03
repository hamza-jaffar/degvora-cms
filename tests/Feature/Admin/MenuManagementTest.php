<?php

use App\Models\Category;
use App\Models\Menu;
use App\Models\Page;
use App\Models\Products;
use App\Models\User;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

it('lists menus with item counts and loads the item collection in one query', function () {
    $user = User::factory()->create();
    $menu = Menu::query()->create(['name' => 'Main menu']);

    foreach (range(1, 12) as $number) {
        $menu->menuItems()->create([
            'label' => "Link {$number}",
            'type' => 'custom',
            'url' => "/link-{$number}",
            'sort_order' => $number - 1,
        ]);
    }

    $itemQueries = 0;
    DB::listen(function (QueryExecuted $query) use (&$itemQueries): void {
        if (preg_match('/^\s*select\b.*\bfrom\s+["`]?menu_items["`]?(?:\s|$)/i', $query->sql) === 1) {
            $itemQueries++;
        }
    });

    $this->actingAs($user)
        ->get(route('admin.menus.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/menus/index')
            ->where('menus.data.0.name', 'Main menu')
            ->where('menus.data.0.menu_items_count', 12));

    $itemQueries = 0;
    $this->actingAs($user)
        ->get(route('admin.menus.items.index', $menu))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/menus/items')
            ->has('items', 12));

    expect($itemQueries)->toBe(1);
});

it('creates a menu and redirects to its item manager', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('admin.menus.store'), [
            'name' => 'Main Menu',
            'location' => 'header',
        ]);

    $menu = Menu::query()->sole();
    $response->assertRedirect(route('admin.menus.items.index', $menu));

    expect($menu->name)->toBe('Main Menu')
        ->and($menu->location)->toBe('header');
});

it('rejects a duplicate menu name', function () {
    $user = User::factory()->create();
    Menu::query()->create(['name' => 'Main Menu']);

    $this->actingAs($user)
        ->from(route('admin.menus.create'))
        ->post(route('admin.menus.store'), ['name' => 'Main Menu'])
        ->assertRedirect(route('admin.menus.create'))
        ->assertSessionHasErrors(['name']);

    expect(Menu::query()->count())->toBe(1);
});

it('updates a menu while allowing its current name and rejects another menu name', function () {
    $user = User::factory()->create();
    $menu = Menu::query()->create(['name' => 'Main menu', 'location' => 'header']);
    Menu::query()->create(['name' => 'Footer menu']);

    $this->actingAs($user)
        ->put(route('admin.menus.update', $menu), [
            'name' => 'Main menu',
            'location' => 'primary',
        ])
        ->assertRedirect(route('admin.menus.edit', $menu));

    expect($menu->fresh()->location)->toBe('primary');

    $this->actingAs($user)
        ->from(route('admin.menus.edit', $menu))
        ->put(route('admin.menus.update', $menu), [
            'name' => 'Footer menu',
            'location' => 'footer',
        ])
        ->assertSessionHasErrors(['name']);

    expect($menu->fresh()->name)->toBe('Main menu');
});

it('deletes a menu and its menu items', function () {
    $user = User::factory()->create();
    $menu = Menu::query()->create(['name' => 'Main menu']);
    $item = $menu->menuItems()->create([
        'label' => 'Products',
        'type' => 'custom',
        'url' => '/products',
    ]);
    $child = $menu->menuItems()->create([
        'parent_id' => $item->id,
        'label' => 'Shoes',
        'type' => 'custom',
        'url' => '/shoes',
    ]);

    $this->actingAs($user)
        ->delete(route('admin.menus.destroy', $menu))
        ->assertRedirect(route('admin.menus.index'));

    $this->assertDatabaseMissing('menus', ['id' => $menu->id]);
    $this->assertDatabaseMissing('menu_items', ['id' => $item->id]);
    $this->assertDatabaseMissing('menu_items', ['id' => $child->id]);
});

it('creates a custom URL item with target and inactive state', function () {
    $user = User::factory()->create();
    $menu = Menu::query()->create(['name' => 'Footer menu']);

    $this->actingAs($user)
        ->post(route('admin.menus.items.store', $menu), menuItemPayload([
            'label' => 'Contact',
            'url' => '/contact',
            'target' => '_blank',
            'is_active' => false,
        ]))
        ->assertRedirect(route('admin.menus.items.index', $menu));

    $item = $menu->menuItems()->sole();
    expect($item->label)->toBe('Contact')
        ->and($item->url)->toBe('/contact')
        ->and($item->target)->toBe('_blank')
        ->and($item->is_active)->toBeFalse()
        ->and($item->reference_id)->toBeNull();
});

it('edits a menu item and persists its enabled state', function () {
    $user = User::factory()->create();
    $menu = Menu::query()->create(['name' => 'Main menu']);
    $item = $menu->menuItems()->create([
        'label' => 'Contact',
        'type' => 'custom',
        'url' => '/contact',
        'is_active' => true,
    ]);

    $this->actingAs($user)
        ->put(route('admin.menus.items.update', [$menu, $item]), menuItemPayload([
            'label' => 'Support',
            'url' => 'https://example.test/support',
            'target' => '_blank',
            'is_active' => false,
        ]))
        ->assertRedirect(route('admin.menus.items.index', $menu));

    expect($item->fresh()->label)->toBe('Support')
        ->and($item->fresh()->url)->toBe('https://example.test/support')
        ->and($item->fresh()->target)->toBe('_blank')
        ->and($item->fresh()->is_active)->toBeFalse();
});

it('rejects unsafe custom URL schemes', function () {
    $user = User::factory()->create();
    $menu = Menu::query()->create(['name' => 'Main menu']);

    $this->actingAs($user)
        ->from(route('admin.menus.items.index', $menu))
        ->post(route('admin.menus.items.store', $menu), menuItemPayload([
            'url' => 'javascript:alert(1)',
        ]))
        ->assertSessionHasErrors(['url']);

    expect($menu->menuItems()->count())->toBe(0);
});

it('creates resource items using their reference IDs without storing static URLs', function () {
    $user = User::factory()->create();
    $menu = Menu::query()->create(['name' => 'Main menu']);
    $page = Page::query()->create([
        'name' => 'About',
        'slug' => 'about',
        'path' => 'about',
        'status' => 'published',
        'visibility' => 'public',
    ]);
    $product = Products::query()->create([
        'name' => 'Trail Shoes',
        'slug' => 'trail-shoes',
        'price' => 50,
        'status' => 'active',
    ]);
    $category = Category::query()->create([
        'name' => 'Footwear',
        'slug' => 'footwear',
        'is_active' => true,
    ]);

    foreach ([
        ['type' => 'page', 'reference_id' => $page->id, 'label' => 'About'],
        ['type' => 'product', 'reference_id' => $product->id, 'label' => 'Trail Shoes'],
        ['type' => 'category', 'reference_id' => $category->id, 'label' => 'Footwear'],
    ] as $payload) {
        $this->actingAs($user)
            ->post(route('admin.menus.items.store', $menu), menuItemPayload($payload))
            ->assertRedirect(route('admin.menus.items.index', $menu));
    }

    expect($menu->menuItems()->orderBy('id')->pluck('reference_id')->all())
        ->toBe([$page->id, $product->id, $category->id]);
    expect($menu->menuItems()->whereNotNull('url')->count())->toBe(0);
});

it('rejects unavailable or missing referenced resources', function (string $type) {
    $user = User::factory()->create();
    $menu = Menu::query()->create(['name' => "Menu for {$type}"]);

    $this->actingAs($user)
        ->from(route('admin.menus.items.index', $menu))
        ->post(route('admin.menus.items.store', $menu), menuItemPayload([
            'type' => $type,
            'url' => '',
            'reference_id' => 999999,
        ]))
        ->assertSessionHasErrors(['reference_id']);

    expect($menu->menuItems()->count())->toBe(0);
})->with([
    'page' => 'page',
    'product' => 'product',
    'category' => 'category',
]);

it('does not offer or accept a private page reference', function () {
    $user = User::factory()->create();
    $menu = Menu::query()->create(['name' => 'Main menu']);
    $privatePage = Page::query()->create([
        'name' => 'Draft page',
        'slug' => 'draft-page',
        'path' => 'draft-page',
        'status' => 'draft',
        'visibility' => 'private',
    ]);

    $this->actingAs($user)
        ->from(route('admin.menus.items.index', $menu))
        ->post(route('admin.menus.items.store', $menu), menuItemPayload([
            'type' => 'page',
            'url' => '',
            'reference_id' => $privatePage->id,
        ]))
        ->assertSessionHasErrors(['reference_id']);
});

it('rejects a parent item that belongs to another menu', function () {
    $user = User::factory()->create();
    $menu = Menu::query()->create(['name' => 'Main menu']);
    $otherMenu = Menu::query()->create(['name' => 'Footer menu']);
    $otherItem = $otherMenu->menuItems()->create([
        'label' => 'Footer link',
        'type' => 'custom',
        'url' => '/footer',
    ]);

    $this->actingAs($user)
        ->from(route('admin.menus.items.index', $menu))
        ->post(route('admin.menus.items.store', $menu), menuItemPayload([
            'parent_id' => $otherItem->id,
        ]))
        ->assertSessionHasErrors(['parent_id']);

    expect($menu->menuItems()->count())->toBe(0);
});

it('returns available resource choices and a flat item list for the hierarchy editor', function () {
    $user = User::factory()->create();
    $menu = Menu::query()->create(['name' => 'Main menu']);
    $parent = $menu->menuItems()->create([
        'label' => 'Products',
        'type' => 'custom',
        'url' => '/products',
    ]);
    $menu->menuItems()->create([
        'parent_id' => $parent->id,
        'label' => 'Shoes',
        'type' => 'custom',
        'url' => '/shoes',
    ]);
    Page::query()->create([
        'name' => 'About',
        'slug' => 'about',
        'path' => 'about',
        'status' => 'published',
        'visibility' => 'public',
    ]);
    Products::query()->create([
        'name' => 'Trail Shoes',
        'slug' => 'trail-shoes',
        'price' => 50,
        'status' => 'active',
    ]);
    Category::query()->create([
        'name' => 'Footwear',
        'slug' => 'footwear',
        'is_active' => true,
    ]);

    $this->actingAs($user)
        ->get(route('admin.menus.items.index', $menu))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/menus/items')
            ->has('items', 2)
            ->where('items.1.parent_id', $parent->id)
            ->where('pages.0.name', 'About')
            ->where('products.0.name', 'Trail Shoes')
            ->where('categories.0.name', 'Footwear'));
});

it('moves an item to a new parent and rejects self-parenting and circular updates', function () {
    $user = User::factory()->create();
    $menu = Menu::query()->create(['name' => 'Main menu']);
    $parent = $menu->menuItems()->create([
        'label' => 'Products',
        'type' => 'custom',
        'url' => '/products',
    ]);
    $child = $menu->menuItems()->create([
        'parent_id' => $parent->id,
        'label' => 'Shoes',
        'type' => 'custom',
        'url' => '/shoes',
    ]);

    $this->actingAs($user)
        ->from(route('admin.menus.items.index', $menu))
        ->put(route('admin.menus.items.update', [$menu, $parent]), menuItemPayload([
            'label' => 'Products',
            'url' => '/products',
            'parent_id' => $child->id,
        ]))
        ->assertSessionHasErrors(['parent_id']);

    $this->actingAs($user)
        ->from(route('admin.menus.items.index', $menu))
        ->put(route('admin.menus.items.update', [$menu, $child]), menuItemPayload([
            'label' => 'Shoes',
            'url' => '/shoes',
            'parent_id' => $child->id,
        ]))
        ->assertSessionHasErrors(['parent_id']);

    expect($parent->fresh()->parent_id)->toBeNull()
        ->and($child->fresh()->parent_id)->toBe($parent->id);
});

it('reorders siblings and moves an item beneath another parent atomically', function () {
    $user = User::factory()->create();
    $menu = Menu::query()->create(['name' => 'Main menu']);
    $products = $menu->menuItems()->create([
        'label' => 'Products',
        'type' => 'custom',
        'url' => '/products',
        'sort_order' => 0,
    ]);
    $about = $menu->menuItems()->create([
        'label' => 'About',
        'type' => 'custom',
        'url' => '/about',
        'sort_order' => 1,
    ]);
    $shoes = $menu->menuItems()->create([
        'label' => 'Shoes',
        'type' => 'custom',
        'url' => '/shoes',
        'sort_order' => 2,
    ]);

    $this->actingAs($user)
        ->put(route('admin.menus.items.reorder', $menu), [
            'items' => [
                ['id' => $about->id, 'parent_id' => null, 'sort_order' => 0],
                ['id' => $products->id, 'parent_id' => null, 'sort_order' => 1],
                ['id' => $shoes->id, 'parent_id' => $products->id, 'sort_order' => 0],
            ],
        ])
        ->assertRedirect(route('admin.menus.items.index', $menu));

    expect($about->fresh()->sort_order)->toBe(0)
        ->and($products->fresh()->sort_order)->toBe(1)
        ->and($shoes->fresh()->parent_id)->toBe($products->id)
        ->and($shoes->fresh()->sort_order)->toBe(0);
});

it('rejects circular reorder submissions without changing the saved hierarchy', function () {
    $user = User::factory()->create();
    $menu = Menu::query()->create(['name' => 'Main menu']);
    $first = $menu->menuItems()->create([
        'label' => 'First',
        'type' => 'custom',
        'url' => '/first',
    ]);
    $second = $menu->menuItems()->create([
        'label' => 'Second',
        'type' => 'custom',
        'url' => '/second',
    ]);

    $this->actingAs($user)
        ->from(route('admin.menus.items.index', $menu))
        ->put(route('admin.menus.items.reorder', $menu), [
            'items' => [
                ['id' => $first->id, 'parent_id' => $second->id, 'sort_order' => 0],
                ['id' => $second->id, 'parent_id' => $first->id, 'sort_order' => 0],
            ],
        ])
        ->assertSessionHasErrors(['items']);

    expect($first->fresh()->parent_id)->toBeNull()
        ->and($second->fresh()->parent_id)->toBeNull();
});

it('rejects partial reorder submissions to avoid losing items', function () {
    $user = User::factory()->create();
    $menu = Menu::query()->create(['name' => 'Main menu']);
    $first = $menu->menuItems()->create([
        'label' => 'First',
        'type' => 'custom',
        'url' => '/first',
    ]);
    $second = $menu->menuItems()->create([
        'label' => 'Second',
        'type' => 'custom',
        'url' => '/second',
    ]);

    $this->actingAs($user)
        ->from(route('admin.menus.items.index', $menu))
        ->put(route('admin.menus.items.reorder', $menu), [
            'items' => [
                ['id' => $first->id, 'parent_id' => null, 'sort_order' => 0],
            ],
        ])
        ->assertSessionHasErrors(['items']);

    expect($second->fresh()->sort_order)->toBe(0);
});

it('deletes a menu item and safely cascades through its child subtree', function () {
    $user = User::factory()->create();
    $menu = Menu::query()->create(['name' => 'Main menu']);
    $parent = $menu->menuItems()->create([
        'label' => 'Products',
        'type' => 'custom',
        'url' => '/products',
    ]);
    $child = $menu->menuItems()->create([
        'parent_id' => $parent->id,
        'label' => 'Shoes',
        'type' => 'custom',
        'url' => '/shoes',
    ]);
    $grandchild = $menu->menuItems()->create([
        'parent_id' => $child->id,
        'label' => 'Boots',
        'type' => 'custom',
        'url' => '/boots',
    ]);

    $this->actingAs($user)
        ->delete(route('admin.menus.items.destroy', [$menu, $parent]))
        ->assertRedirect(route('admin.menus.items.index', $menu));

    $this->assertDatabaseMissing('menu_items', ['id' => $parent->id]);
    $this->assertDatabaseMissing('menu_items', ['id' => $child->id]);
    $this->assertDatabaseMissing('menu_items', ['id' => $grandchild->id]);
});

it('returns 404 when managing an item through a different menu', function () {
    $user = User::factory()->create();
    $firstMenu = Menu::query()->create(['name' => 'First menu']);
    $secondMenu = Menu::query()->create(['name' => 'Second menu']);
    $item = $firstMenu->menuItems()->create([
        'label' => 'Home',
        'type' => 'custom',
        'url' => '/',
    ]);

    $this->actingAs($user)
        ->delete(route('admin.menus.items.destroy', [$secondMenu, $item]))
        ->assertNotFound();

    $this->assertDatabaseHas('menu_items', ['id' => $item->id]);
});

it('redirects guests away from menu management', function () {
    $this->get(route('admin.menus.index'))
        ->assertRedirect(route('login'));
});

/**
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function menuItemPayload(array $overrides = []): array
{
    return array_merge([
        'label' => 'Home',
        'type' => 'custom',
        'url' => '/',
        'reference_id' => null,
        'parent_id' => null,
        'target' => '_self',
        'is_active' => true,
    ], $overrides);
}
