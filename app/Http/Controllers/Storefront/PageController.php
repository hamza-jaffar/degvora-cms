<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Services\Theme\ThemeManager;
use Illuminate\Contracts\View\View;

class PageController extends Controller
{
    public function show(string $slug, ThemeManager $theme): View
    {
        $page = Page::query()
            ->where('slug', $slug)
            ->where('status', 'published')
            ->where('visibility', 'public')
            ->firstOrFail();

        if ($page->template !== 'template') {
            return view('page', [
                'page' => $page,
            ]);
        }

        return $theme->view('page', [
            'page' => $page,
        ]);
    }
}
