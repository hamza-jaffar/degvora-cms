<?php

use App\Http\Controllers\Storefront\PageController;
use App\Http\Controllers\Storefront\ShopController;
use App\Services\Theme\ThemeManager;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::get('/theme-styles/{stylesheet}', static function (
    ThemeManager $theme,
    string $stylesheet
) {
    abort_unless(
        preg_match('/\A[a-zA-Z0-9_-]+\.css\z/', $stylesheet) === 1,
        404
    );

    $themePath = base_path('themes'.DIRECTORY_SEPARATOR.$theme->active());
    $assetsPath = $themePath.DIRECTORY_SEPARATOR.'assets';
    $cssPath = $assetsPath.DIRECTORY_SEPARATOR.'css';

    abort_if(
        is_link($themePath) || is_link($assetsPath) || is_link($cssPath),
        404
    );

    $resolvedThemePath = realpath($themePath);
    $resolvedAssetsPath = realpath($assetsPath);
    $resolvedCssPath = realpath($cssPath);

    abort_if(
        $resolvedThemePath === false
            || $resolvedAssetsPath === false
            || $resolvedCssPath === false
            || dirname($resolvedAssetsPath) !== $resolvedThemePath
            || dirname($resolvedCssPath) !== $resolvedAssetsPath,
        404
    );

    $stylesheetPath = $resolvedCssPath.DIRECTORY_SEPARATOR.$stylesheet;
    $resolvedStylesheetPath = realpath($stylesheetPath);

    abort_if(
        is_link($stylesheetPath)
            || $resolvedStylesheetPath === false
            || dirname($resolvedStylesheetPath) !== $resolvedCssPath
            || ! is_file($resolvedStylesheetPath),
        404
    );

    return response(
        File::get($resolvedStylesheetPath),
        200,
        ['Content-Type' => 'text/css; charset=UTF-8']
    );
})->where('stylesheet', '[a-zA-Z0-9_-]+\.css')
    ->name('theme.stylesheet');

require __DIR__.'/admin.php';
require __DIR__.'/settings.php';

Route::get('/shop', [ShopController::class, 'index'])->name('shop.index');

Route::get('/{slug}', [PageController::class, 'show']);
