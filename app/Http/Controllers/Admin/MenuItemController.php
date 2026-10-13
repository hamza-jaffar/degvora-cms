<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Menu\ReorderMenuItemsRequest;
use App\Http\Requests\Admin\Menu\StoreMenuItemRequest;
use App\Http\Requests\Admin\Menu\UpdateMenuItemRequest;
use App\Models\Category;
use App\Models\Menu;
use App\Models\MenuItem;
use App\Models\Page;
use App\Models\Products;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class MenuItemController extends Controller
{
    public function index(Menu $menu): Response
    {
        return Inertia::render('admin/menus/items', [
            'menu' => $menu,
            'items' => Cache::rememberForever(
                "admin.menus.{$menu->id}.items.v2",
                fn () => $menu->menuItems()
                    ->orderBy('sort_order')
                    ->orderBy('id')
                    ->get([
                        'id',
                        'menu_id',
                        'parent_id',
                        'label',
                        'type',
                        'url',
                        'reference_id',
                        'sort_order',
                        'target',
                        'is_active',
                    ])
                    ->toArray(),
            ),
            'pages' => Cache::rememberForever(
                'admin.menu_items.pages.v2',
                fn () => Page::query()
                    ->where('status', 'published')
                    ->where('visibility', 'public')
                    ->orderBy('name')
                    ->get(['id', 'name', 'slug'])
                    ->toArray(),
            ),
            'products' => Products::query()
                ->where('status', 'active')
                ->orderBy('name')
                ->get(['id', 'name', 'slug'])
                ->toArray(),
            'categories' => Category::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'slug'])
                ->toArray(),
        ]);
    }

    public function store(
        StoreMenuItemRequest $request,
        Menu $menu,
    ): RedirectResponse {
        $data = $request->validated();

        DB::transaction(function () use ($menu, $data): void {
            $parentId = $this->nullableInteger($data['parent_id'] ?? null);
            $this->assertValidParent($menu, $parentId);

            $sortOrder = $menu->menuItems()
                ->where('parent_id', $parentId)
                ->count();

            $menu->menuItems()->create([
                ...$this->itemAttributes($data),
                'parent_id' => $parentId,
                'sort_order' => $sortOrder,
            ]);
        });
        $this->forgetMenuItemsCache($menu);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Menu item added successfully.'),
        ]);

        return to_route('admin.menus.items.index', $menu);
    }

    public function update(
        UpdateMenuItemRequest $request,
        Menu $menu,
        MenuItem $menuItem,
    ): RedirectResponse {
        $data = $request->validated();

        DB::transaction(function () use ($menu, $menuItem, $data): void {
            $items = $menu->menuItems()
                ->lockForUpdate()
                ->get(['id', 'parent_id', 'sort_order']);
            $existing = $items->firstWhere('id', $menuItem->id);

            if ($existing === null) {
                throw (new ModelNotFoundException)->setModel(MenuItem::class, [$menuItem->id]);
            }

            $oldParentId = $this->nullableInteger($existing->parent_id);
            $newParentId = $this->nullableInteger($data['parent_id'] ?? null);
            $this->assertValidParent($menu, $newParentId, $menuItem->id, $items);

            $sortOrder = $oldParentId === $newParentId
                ? $existing->sort_order
                : $items->where('parent_id', $newParentId)->count();

            $menuItem->update([
                ...$this->itemAttributes($data),
                'parent_id' => $newParentId,
                'sort_order' => $sortOrder,
            ]);

            if ($oldParentId !== $newParentId) {
                $this->normalizeSiblingOrder($items, $oldParentId, $menuItem->id);
            }
        });
        $this->forgetMenuItemsCache($menu);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Menu item updated successfully.'),
        ]);

        return to_route('admin.menus.items.index', $menu);
    }

    public function destroy(
        Menu $menu,
        MenuItem $menuItem,
    ): RedirectResponse {
        DB::transaction(function () use ($menu, $menuItem): void {
            $menu->menuItems()->whereKey($menuItem->id)->firstOrFail()->delete();
        });
        $this->forgetMenuItemsCache($menu);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Menu item and its nested items deleted successfully.'),
        ]);

        return to_route('admin.menus.items.index', $menu);
    }

    public function reorder(
        ReorderMenuItemsRequest $request,
        Menu $menu,
    ): RedirectResponse {
        $items = $request->validated('items');

        DB::transaction(function () use ($menu, $items): void {
            $currentItems = $menu->menuItems()->lockForUpdate()->get();
            $currentIds = $currentItems->modelKeys();
            $currentItemsById = $currentItems->keyBy('id');
            $submittedIds = collect($items)
                ->pluck('id')
                ->map(static fn (int|string $id): int => (int) $id)
                ->all();

            sort($currentIds);
            sort($submittedIds);

            if ($currentIds !== $submittedIds) {
                throw ValidationException::withMessages([
                    'items' => 'The menu structure is out of date. Refresh the page and try again.',
                ]);
            }

            $parentIds = collect($items)->mapWithKeys(
                fn (array $item): array => [
                    (int) $item['id'] => $this->nullableInteger($item['parent_id']),
                ],
            );

            foreach ($parentIds as $id => $parentId) {
                if ($parentId !== null && ! $parentIds->has($parentId)) {
                    throw ValidationException::withMessages([
                        'items' => 'Every parent must be another item in this menu.',
                    ]);
                }

                $visited = [];
                $cursor = $id;

                while ($cursor !== null) {
                    if (isset($visited[$cursor])) {
                        throw ValidationException::withMessages([
                            'items' => 'Menu items cannot form a circular hierarchy.',
                        ]);
                    }

                    $visited[$cursor] = true;
                    $cursor = $parentIds->get($cursor);
                }
            }

            $now = now();
            $updates = [];

            foreach (collect($items)->groupBy(
                fn (array $item): string => $item['parent_id'] === null
                    ? 'root'
                    : (string) $item['parent_id'],
            ) as $siblings) {
                $siblings = $siblings
                    ->sortBy([
                        ['sort_order', 'asc'],
                        ['id', 'asc'],
                    ])
                    ->values();

                foreach ($siblings as $sortOrder => $item) {
                    /** @var MenuItem $currentItem */
                    $currentItem = $currentItemsById->get((int) $item['id']);

                    $updates[] = [
                        'id' => $currentItem->id,
                        'menu_id' => $menu->id,
                        'parent_id' => $this->nullableInteger($item['parent_id']),
                        'label' => $currentItem->label,
                        'type' => $currentItem->type,
                        'url' => $currentItem->url,
                        'reference_id' => $currentItem->reference_id,
                        'sort_order' => $sortOrder,
                        'target' => $currentItem->target,
                        'is_active' => $currentItem->is_active,
                        'created_at' => $currentItem->created_at,
                        'updated_at' => $now,
                    ];
                }
            }

            if ($updates !== []) {
                MenuItem::query()->upsert(
                    $updates,
                    ['id'],
                    ['parent_id', 'sort_order', 'updated_at'],
                );
            }
        });
        $this->forgetMenuItemsCache($menu);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Menu order saved.'),
        ]);

        return to_route('admin.menus.items.index', $menu);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array{label: string, type: string, url: string|null, reference_id: int|null, target: string, is_active: bool}
     */
    private function itemAttributes(array $data): array
    {
        $type = (string) $data['type'];

        return [
            'label' => (string) $data['label'],
            'type' => $type,
            'url' => $type === 'custom' ? (string) $data['url'] : null,
            'reference_id' => $type === 'custom' ? null : (int) $data['reference_id'],
            'target' => (string) $data['target'],
            'is_active' => (bool) $data['is_active'],
        ];
    }

    /**
     * @param  Collection<int, MenuItem>  $items
     */
    private function assertValidParent(
        Menu $menu,
        ?int $parentId,
        ?int $movingItemId = null,
        ?Collection $items = null,
    ): void {
        if ($parentId === null) {
            return;
        }

        $items ??= $menu->menuItems()->get(['id', 'parent_id']);
        $parents = $items->mapWithKeys(
            fn (MenuItem $item): array => [
                $item->id => $this->nullableInteger($item->parent_id),
            ],
        );

        if (! $parents->has($parentId)) {
            throw ValidationException::withMessages([
                'parent_id' => 'Choose a parent item in this menu.',
            ]);
        }

        $visited = [];
        $cursor = $parentId;

        while ($cursor !== null) {
            if ($cursor === $movingItemId || isset($visited[$cursor])) {
                throw ValidationException::withMessages([
                    'parent_id' => 'An item cannot be moved beneath itself or one of its descendants.',
                ]);
            }

            $visited[$cursor] = true;
            $cursor = $parents->get($cursor);
        }
    }

    /**
     * @param  Collection<int, MenuItem>  $items
     */
    private function normalizeSiblingOrder(Collection $items, ?int $parentId, int $exceptId): void
    {
        $siblings = $items
            ->where('parent_id', $parentId)
            ->where('id', '!=', $exceptId)
            ->sortBy([
                ['sort_order', 'asc'],
                ['id', 'asc'],
            ])
            ->values();

        foreach ($siblings as $sortOrder => $sibling) {
            $sibling->newQuery()
                ->whereKey($sibling->id)
                ->update(['sort_order' => $sortOrder]);
        }
    }

    private function nullableInteger(mixed $value): ?int
    {
        return $value === null || $value === '' ? null : (int) $value;
    }

    private function forgetMenuItemsCache(Menu $menu): void
    {
        Cache::forget("admin.menus.{$menu->id}.items");
        Cache::forget("admin.menus.{$menu->id}.items.v2");
    }
}
