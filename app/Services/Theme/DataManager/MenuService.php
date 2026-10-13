<?php

namespace App\Services\Theme\DataManager;

use App\Models\Menu;
use App\Models\MenuItem;
use App\Models\Page;
use Illuminate\Database\Eloquent\Collection;

class MenuService
{
    public function get(string $name): ?Menu
    {
        $menu = Menu::query()->where('name', $name)->first();

        if ($menu === null) {
            return null;
        }

        $items = $menu->menuItems()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();
        $itemsByParent = $items->groupBy(
            fn (MenuItem $item): int => $item->parent_id === null
                ? 0
                : (int) $item->parent_id,
        );
        $pageSlugs = Page::query()
            ->whereIn(
                'id',
                $items->where('type', 'page')->pluck('reference_id')->filter()->unique(),
            )
            ->pluck('slug', 'id');

        foreach ($items as $item) {
            $item->setRelation(
                'children',
                $itemsByParent->get((int) $item->id, new Collection),
            );
            $item->setAttribute(
                'href',
                match ($item->type) {
                    'custom' => $item->url,
                    'page' => isset($pageSlugs[$item->reference_id])
                        ? '/'.$pageSlugs[$item->reference_id]
                        : '#',
                    default => '#',
                },
            );
        }

        $menu->setRelation(
            'menuItems',
            $itemsByParent->get(0, new Collection),
        );

        return $menu;
    }
}
