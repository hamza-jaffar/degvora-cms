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
use App\Services\Menu\MenuItemService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class MenuItemController extends Controller
{
    public function index(Menu $menu, MenuItemService $menuItems): Response
    {
        return Inertia::render('admin/menus/items', [
            'menu' => $menu,
            'items' => $menuItems->getItems($menu),
            'pages' => Page::query()
                ->where('status', 'published')
                ->where('visibility', 'public')
                ->orderBy('name')
                ->get(['id', 'name', 'slug']),
            'products' => Products::query()
                ->where('status', 'active')
                ->orderBy('name')
                ->get(['id', 'name', 'slug']),
            'categories' => Category::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'slug']),
        ]);
    }

    public function store(
        StoreMenuItemRequest $request,
        Menu $menu,
        MenuItemService $menuItems,
    ): RedirectResponse {
        $menuItems->create($menu, $request->validated());

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
        MenuItemService $menuItems,
    ): RedirectResponse {
        $menuItems->update($menu, $menuItem, $request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Menu item updated successfully.'),
        ]);

        return to_route('admin.menus.items.index', $menu);
    }

    public function destroy(
        Menu $menu,
        MenuItem $menuItem,
        MenuItemService $menuItems,
    ): RedirectResponse {
        $menuItems->delete($menu, $menuItem);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Menu item and its nested items deleted successfully.'),
        ]);

        return to_route('admin.menus.items.index', $menu);
    }

    public function reorder(
        ReorderMenuItemsRequest $request,
        Menu $menu,
        MenuItemService $menuItems,
    ): RedirectResponse {
        $menuItems->reorder($menu, $request->validated('items'));

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Menu order saved.'),
        ]);

        return to_route('admin.menus.items.index', $menu);
    }
}
