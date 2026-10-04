<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', $siteSettings['locale'] ?? app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>{{ $page->meta_title ?: ($siteSettings['meta_title'] ?? $page->name) }}</title>
        @if($page->meta_description ?: ($siteSettings['meta_description'] ?? $siteSettings['tagline'] ?? null))
            <meta name="description" content="{{ $page->meta_description ?: ($siteSettings['meta_description'] ?? $siteSettings['tagline']) }}">
        @endif
        <meta property="og:title" content="{{ $page->meta_title ?: ($siteSettings['meta_title'] ?? $page->name) }}">
        @if($page->meta_description ?: ($siteSettings['meta_description'] ?? $siteSettings['tagline'] ?? null))
            <meta property="og:description" content="{{ $page->meta_description ?: ($siteSettings['meta_description'] ?? $siteSettings['tagline']) }}">
        @endif
        <meta property="og:type" content="website">
        <meta property="og:url" content="{{ $page->canonical_url ?: url()->current() }}">
        @if(!empty($siteSettings['name']))
            <meta property="og:site_name" content="{{ $siteSettings['name'] }}">
        @endif
        @if(!empty($siteSettings['meta_keywords']))
            <meta name="keywords" content="{{ $siteSettings['meta_keywords'] }}">
        @endif
        @if(!empty($siteSettings['google_site_verification']))
            <meta name="google-site-verification" content="{{ $siteSettings['google_site_verification'] }}">
        @endif
        <meta name="robots" content="{{ $page->robots }}">
        <link rel="icon" href="{{ $siteSettings['favicon_url'] ?? '/assets/degvora-cms-logo.png' }}">
        @if(!empty($siteSettings['seo_image_url']))
            <meta property="og:image" content="{{ $siteSettings['seo_image_url'] }}">
            <meta name="twitter:card" content="summary_large_image">
        @endif
        @include('components.site-head-integrations')
    </head>
    <body>
        @if(!empty($siteSettings['google_tag_manager_id']))
            <noscript>
                <iframe
                    src="https://www.googletagmanager.com/ns.html?id={{ rawurlencode($siteSettings['google_tag_manager_id']) }}"
                    height="0"
                    width="0"
                    style="display:none;visibility:hidden"
                ></iframe>
            </noscript>
        @endif
        <div>
            {!! $page->content !!}
        </div>
        @if(!empty($siteSettings['footer_text']))
            <footer>{{ $siteSettings['footer_text'] }}</footer>
        @endif
        @include('components.site-body-integrations')
    </body>
</html>
