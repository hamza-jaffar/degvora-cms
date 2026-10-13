<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Menu\StoreMenuRequest;
use App\Http\Requests\Admin\Menu\UpdateMenuRequest;
use App\Models\Menu;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class MenuController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/menus/index', [
            'menus' => Menu::query()
                ->withCount('menuItems')
                ->orderBy('name')
                ->paginate(15)
                ->withQueryString(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/menus/create');
    }

    public function store(StoreMenuRequest $request): RedirectResponse
    {
        $menu = Menu::query()->create($request->validated());

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
    ): RedirectResponse {
        $menu->update($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Menu updated successfully.'),
        ]);

        return to_route('admin.menus.edit', $menu);
    }

    public function destroy(Menu $menu): RedirectResponse
    {
        DB::transaction(fn () => $menu->delete());
        Cache::forget("admin.menus.{$menu->id}.items");
        Cache::forget("admin.menus.{$menu->id}.items.v2");

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Menu deleted successfully.'),
        ]);

        return to_route('admin.menus.index');
    }
}
