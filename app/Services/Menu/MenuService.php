<?php

namespace App\Services\Menu;

use App\Models\Menu;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class MenuService
{
    public function paginate(): LengthAwarePaginator
    {
        return Menu::query()
            ->withCount('menuItems')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();
    }

    /**
     * @param  array{name: string, location?: string|null}  $data
     */
    public function create(array $data): Menu
    {
        return Menu::query()->create([
            'name' => $data['name'],
            'location' => $data['location'] ?? null,
        ]);
    }

    /**
     * @param  array{name: string, location?: string|null}  $data
     */
    public function update(Menu $menu, array $data): void
    {
        $menu->update([
            'name' => $data['name'],
            'location' => $data['location'] ?? null,
        ]);
    }

    public function delete(Menu $menu): void
    {
        DB::transaction(fn () => $menu->delete());
    }
}
