<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Models\Post;
use App\Services\SiteSettingsService;
use App\Services\Theme\DataManager\PostService;
use App\Services\Theme\ThemeManager;
use Illuminate\Contracts\View\View;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class PageController extends Controller
{
    public function home(ThemeManager $theme, SiteSettingsService $siteSettings): View
    {
        /** @var array<string, mixed>|null $pageAttributes */
        $pageAttributes = Cache::rememberForever(
            'storefront.pages.slug.v2.root',
            function (): ?array {
                Cache::forget('storefront.pages.slug.root');

                $page = Page::query()
                    ->where(function (Builder $query): void {
                        $query->where('slug', '/')
                            ->orWhere('path', '/');
                    })
                    ->where('status', 'published')
                    ->where('visibility', 'public')
                    ->first();

                if (! $page) {
                    $page = Page::query()
                        ->where('slug', 'home')
                        ->where('status', 'published')
                        ->where('visibility', 'public')
                        ->first();
                }

                return $page?->getAttributes();
            },
        );

        $page = $pageAttributes !== null
            ? (new Page)->newFromBuilder($pageAttributes)
            : new Page([
                'name' => 'Home',
                'slug' => '/',
                'path' => '/',
                'template' => 'home',
                'status' => 'published',
                'visibility' => 'public',
                'content' => '',
            ]);

        $template = $this->resolveStorefrontTemplate('/', $page->template, $theme);

        if ($template === null) {
            return view('page', [
                'page' => $page,
                'siteSettings' => $siteSettings->publicValues(),
            ]);
        }

        return $theme->view($template, [
            'page' => $page,
            'siteSettings' => $siteSettings->publicValues(),
        ]);
    }

    public function show(string $slug, ThemeManager $theme, SiteSettingsService $siteSettings): View
    {
        $normalizedPath = '/'.ltrim($slug, '/');
        $slugClean = ltrim($slug, '/');
        $lastSegment = basename($normalizedPath);
        $cacheSuffix = str_replace(['/', '\\'], '.', $slugClean);

        /** @var array<string, mixed> $pageAttributes */
        $pageAttributes = Cache::rememberForever(
            "storefront.pages.slug.v2.{$cacheSuffix}",
            function () use ($normalizedPath, $slugClean, $lastSegment): array {
                Cache::forget("storefront.pages.slug.{$slugClean}");

                return Page::query()
                    ->where(function (Builder $query) use ($normalizedPath, $slugClean, $lastSegment): void {
                        $query->where('path', $normalizedPath)
                            ->orWhere('path', $slugClean)
                            ->orWhere('slug', $slugClean)
                            ->orWhere('slug', $lastSegment);
                    })
                    ->where('status', 'published')
                    ->where('visibility', 'public')
                    ->orderByRaw('CASE WHEN path = ? THEN 1 WHEN path = ? THEN 2 WHEN slug = ? THEN 3 ELSE 4 END', [
                        $normalizedPath,
                        $slugClean,
                        $slugClean,
                    ])
                    ->firstOrFail()
                    ->getAttributes();
            },
        );
        $page = (new Page)->newFromBuilder($pageAttributes);

        $template = $this->resolveStorefrontTemplate($slugClean, $page->template, $theme);

        if ($template === null) {
            return view('page', [
                'page' => $page,
                'siteSettings' => $siteSettings->publicValues(),
            ]);
        }

        $data = [
            'page' => $page,
            'siteSettings' => $siteSettings->publicValues(),
        ];

        if ($template === 'blogs' || str_ends_with($template, '/blogs')) {
            $data['posts'] = app(PostService::class)->paginate();
            $data['blogs'] = $data['posts'];
        }

        return $theme->view($template, $data);
    }

    public function post(string $slug, ThemeManager $theme, SiteSettingsService $siteSettings): View
    {
        $cleanSlug = ltrim($slug, '/');
        if (str_starts_with($cleanSlug, 'blog/')) {
            $cleanSlug = substr($cleanSlug, 5);
        } elseif (str_starts_with($cleanSlug, 'blogs/')) {
            $cleanSlug = substr($cleanSlug, 6);
        }

        $post = Post::query()
            ->published()
            ->with(['category:id,name,slug', 'author:id,name'])
            ->where('slug', $cleanSlug)
            ->firstOrFail();

        $template = $theme->hasTemplate('single')
            ? 'single'
            : ($theme->hasTemplate('post') ? 'post' : 'blogs');

        $page = new Page([
            'name' => $post->title,
            'slug' => 'blog/'.$post->slug,
            'meta_title' => $post->meta_title ?: $post->title,
            'meta_description' => $post->meta_description ?: ($post->excerpt ?: Str::limit(strip_tags($post->content), 150)),
        ]);

        return $theme->view($template, [
            'post' => $post,
            'page' => $page,
            'siteSettings' => $siteSettings->publicValues(),
        ]);
    }

    /**
     * Resolve the storefront theme template for a page.
     * Returns null if the page should render without active theme layout (blank/raw/page fallback).
     */
    private function resolveStorefrontTemplate(string $slug, ?string $template, ThemeManager $theme): ?string
    {
        if ($template !== null && $template !== '') {
            $normalizedTemplate = trim(str_replace('\\', '/', $template), '/');

            if ($normalizedTemplate === 'blank' || $normalizedTemplate === 'raw') {
                return null;
            }

            if ($normalizedTemplate === '404' || str_ends_with($normalizedTemplate, '/404')) {
                return null;
            }

            // 1. Explicit theme template specified on the page (e.g. 'home', 'moving', 'moving-in-dubai', 'moving/ssssss', 'moving/dubai')
            if ($normalizedTemplate !== 'template' && $normalizedTemplate !== 'default' && $normalizedTemplate !== 'page') {
                if ($theme->hasTemplate($normalizedTemplate)) {
                    return $normalizedTemplate;
                }

                return null;
            }
        }

        // 2. Root / home
        if ($slug === '/' || $slug === 'home' || $template === 'home') {
            if ($theme->hasTemplate('home')) {
                return 'home';
            }

            return $theme->hasTemplate('page') ? 'page' : null;
        }

        // 3. Theme template matching page slug (e.g. /moving matches moving.blade.php in active theme)
        if ($theme->hasTemplate($slug)) {
            return $slug;
        }

        $lastSegment = basename($slug);
        if ($lastSegment !== $slug && $theme->hasTemplate($lastSegment)) {
            return $lastSegment;
        }

        // 4. Active theme default page template when page specifies 'template' or 'default'
        if ($template === 'template' || $template === 'default') {
            return $theme->hasTemplate('page') ? 'page' : null;
        }

        // 5. Explicit 'page' template or unmatched template uses standard page view without active theme layout
        return null;
    }
}
