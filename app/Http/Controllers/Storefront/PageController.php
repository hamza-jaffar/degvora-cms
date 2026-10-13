<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Services\SiteSettingsService;
use App\Services\Theme\ThemeManager;
use Illuminate\Contracts\View\View;
use Illuminate\Support\Facades\Cache;

class PageController extends Controller
{
    public function show(string $slug, ThemeManager $theme, SiteSettingsService $siteSettings): View
    {
        /** @var array<string, mixed> $pageAttributes */
        $pageAttributes = Cache::rememberForever(
            "storefront.pages.slug.v2.{$slug}",
            function () use ($slug): array {
                Cache::forget("storefront.pages.slug.{$slug}");

                return Page::query()
                    ->where('slug', $slug)
                    ->where('status', 'published')
                    ->where('visibility', 'public')
                    ->firstOrFail()
                    ->getAttributes();
            },
        );
        $page = (new Page)->newFromBuilder($pageAttributes);

        if ($page->template !== 'template') {
            return view('page', [
                'page' => $page,
                'siteSettings' => $siteSettings->publicValues(),
            ]);
        }

        return $theme->view('page', [
            'page' => $page,
            'siteSettings' => $siteSettings->publicValues(),
        ]);
    }
}
