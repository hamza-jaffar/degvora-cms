<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Menu\StoreMenuRequest;
use App\Http\Requests\Admin\Menu\UpdateMenuRequest;
use App\Models\Menu;
use App\Services\Menu\MenuService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class MenuController extends Controller
{
    public function index(MenuService $menus): Response
    {
        return Inertia::render('admin/menus/index', [
            'menus' => $menus->paginate(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/menus/create');
    }

    public function store(StoreMenuRequest $request, MenuService $menus): RedirectResponse
    {
        $menu = $menus->create($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Menu created successfully.'),
        ]);

        return to_route('admin.menus.items.index', $menu);
    }

    public function edit(Menu $menu): Response
    {
        return Inertia::render('admin/menus/edit', [
            'menu' => $menu,
        ]);
    }

    public function update(
        UpdateMenuRequest $request,
        Menu $menu,
        MenuService $menus,
    ): RedirectResponse {
        $menus->update($menu, $request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Menu updated successfully.'),
        ]);

        return to_route('admin.menus.edit', $menu);
    }

    public function destroy(Menu $menu, MenuService $menus): RedirectResponse
    {
        $menus->delete($menu);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Menu deleted successfully.'),
        ]);

        return to_route('admin.menus.index');
    }
}
