<?php

use App\Http\Controllers\PublicFormSubmitController;
use App\Http\Controllers\Storefront\PageController;
use App\Http\Controllers\Storefront\ShopController;
use App\Services\Theme\ThemeManager;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route;

Route::get('/', [PageController::class, 'home'])->name('home');

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

Route::get('/themes/{theme}/assets/{path}', static function (string $theme, string $path) {
    abort_unless(
        preg_match('/\A[a-z0-9]+(?:-[a-z0-9]+)*\z/', $theme) === 1,
        404
    );

    $themePath = base_path('themes'.DIRECTORY_SEPARATOR.$theme);
    $assetsPath = $themePath.DIRECTORY_SEPARATOR.'assets';
    $resolvedAssetsPath = realpath($assetsPath);

    abort_if($resolvedAssetsPath === false, 404);

    $normalizedPath = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $path);
    $filePath = $resolvedAssetsPath.DIRECTORY_SEPARATOR.$normalizedPath;
    $resolvedFilePath = realpath($filePath);

    abort_if(
        $resolvedFilePath === false
            || ! str_starts_with($resolvedFilePath, $resolvedAssetsPath)
            || ! is_file($resolvedFilePath),
        404
    );

    $extension = strtolower(pathinfo($resolvedFilePath, PATHINFO_EXTENSION));

    $mime = match ($extension) {
        'css' => 'text/css; charset=UTF-8',
        'js' => 'application/javascript; charset=UTF-8',
        'svg' => 'image/svg+xml',
        'png' => 'image/png',
        'jpg', 'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'webp' => 'image/webp',
        'woff' => 'font/woff',
        'woff2' => 'font/woff2',
        'ttf' => 'font/ttf',
        'eot' => 'application/vnd.ms-fontobject',
        'ico' => 'image/x-icon',
        default => File::mimeType($resolvedFilePath) ?: 'application/octet-stream',
    };

    return response(
        File::get($resolvedFilePath),
        200,
        ['Content-Type' => $mime]
    );
})->where('path', '.*')->name('theme.asset');

require __DIR__.'/admin.php';
require __DIR__.'/settings.php';

Route::get('/shop', [ShopController::class, 'index'])->name('shop.index');

Route::post('/forms/{form:slug}/submit', [PublicFormSubmitController::class, 'submit'])
    ->middleware('throttle:30,1')
    ->name('forms.submit');

Route::get('/blog/{slug}', [PageController::class, 'post'])->name('blog.show');
Route::get('/blogs/{slug}', [PageController::class, 'post'])->name('blogs.show');

Route::get('/{slug}', [PageController::class, 'show'])->where('slug', '.*');
