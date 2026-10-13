<?php

use App\Models\Setting;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

it('serves the storefront navbar stylesheet from the theme assets directory', function () {
    $themeSlug = 'storefront-'.Str::lower(Str::random(12));
    $themePath = base_path("themes/{$themeSlug}");
    $templatesPath = $themePath.'/views/templates';
    $cssPath = $themePath.'/assets/css';

    File::makeDirectory($templatesPath, 0755, true);
    File::put($templatesPath.'/page.blade.php', 'Theme page');
    File::makeDirectory($cssPath, 0755, true);
    File::put($cssPath.'/storefront-navbar.css', '.theme-stylesheet-test { color: red; }');
    File::put($cssPath.'/index.css', ':root { --theme-test: red; }');
    File::put($cssPath.'/storefront-footer.css', 'footer { color: red; }');

    Setting::query()->create([
        'key' => 'active_theme',
        'value' => $themeSlug,
    ]);

    try {
        foreach ([
            'index.css' => '--theme-test',
            'storefront-navbar.css' => '.theme-stylesheet-test',
            'storefront-footer.css' => 'footer',
        ] as $stylesheet => $expectedContent) {
            $stylesheetUrl = stylesheet($stylesheet);

            expect($stylesheetUrl)
                ->toBe(route('theme.stylesheet', ['stylesheet' => $stylesheet]));

            $this->get($stylesheetUrl)
                ->assertOk()
                ->assertHeader('Content-Type', 'text/css; charset=UTF-8')
                ->assertSee($expectedContent, false);
        }
    } finally {
        File::deleteDirectory($themePath);
    }
});
