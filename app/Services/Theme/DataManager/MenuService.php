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
        $menu = Menu::query()
            ->where('name', $name)
            ->orWhere('location', $name)
            ->first();

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
        $pages = Page::query()
            ->whereIn(
                'id',
                $items->where('type', 'page')->pluck('reference_id')->filter()->unique(),
            )
            ->get(['id', 'slug', 'path'])
            ->keyBy('id');

        foreach ($items as $item) {
            $item->setRelation(
                'children',
                $itemsByParent->get((int) $item->id, new Collection),
            );

            $href = '#';
            if ($item->type === 'custom') {
                $href = $item->url ?? '#';
            } elseif ($item->type === 'page' && isset($pages[$item->reference_id])) {
                $page = $pages[$item->reference_id];
                $href = ! empty($page->path)
                    ? '/'.ltrim($page->path, '/')
                    : ($page->slug === '/' ? '/' : '/'.ltrim($page->slug, '/'));
            }

            $item->setAttribute('href', $href);
        }

        $menu->setRelation(
            'menuItems',
            $itemsByParent->get(0, new Collection),
        );

        return $menu;
    }
}
