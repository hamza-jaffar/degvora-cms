<?php

namespace App\Services\Theme;

use App\Models\Setting;
use Illuminate\Contracts\View\View as ViewContract;
use Illuminate\Support\Facades\View;
use Illuminate\View\FileViewFinder;
use RuntimeException;

class ThemeManager
{
    public function active(): string
    {
        $configuredTheme = Setting::query()
            ->where('key', 'active_theme')
            ->value('value');

        if (
            is_string($configuredTheme)
            && $this->hasRequiredPageTemplate(
                $this->viewsDirectory($configuredTheme)
            )
        ) {
            return $configuredTheme;
        }

        if ($this->hasRequiredPageTemplate($this->viewsDirectory('default'))) {
            return 'default';
        }

        throw new RuntimeException(
            'The active theme and the default theme are unavailable or invalid.'
        );
    }

    public function register(): void
    {
        $viewsDirectory = $this->viewsDirectory($this->active());

        if ($viewsDirectory === null) {
            throw new RuntimeException('The active theme views directory is unavailable.');
        }

        $finder = View::getFinder();
        $registeredPaths = $finder instanceof FileViewFinder
            ? ($finder->getHints()['theme'] ?? [])
            : [];

        if ($registeredPaths !== [$viewsDirectory]) {
            View::replaceNamespace('theme', $viewsDirectory);
            View::flushFinderCache();
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function view(string $template, array $data = []): ViewContract
    {
        $this->register();

        $view = preg_match('/\A[a-zA-Z0-9_-]+\z/', $template) === 1
            ? "theme::templates.{$template}"
            : 'theme::templates.page';

        if (! View::exists($view)) {
            $view = 'theme::templates.page';
        }

        if (! View::exists($view)) {
            throw new RuntimeException(
                'The active theme does not contain views/templates/page.blade.php.'
            );
        }

        return View::make($view, $data);
    }

    private function viewsDirectory(string $theme): ?string
    {
        if (preg_match('/\A[a-z0-9]+(?:-[a-z0-9]+)*\z/', $theme) !== 1) {
            return null;
        }

        $themesPath = base_path('themes');
        $themesRoot = realpath($themesPath);
        $projectRoot = realpath(base_path());

        if (
            is_link($themesPath)
            || $themesRoot === false
            || $projectRoot === false
            || ! $this->pathsAreEqual(dirname($themesRoot), $projectRoot)
        ) {
            return null;
        }

        $themePath = $themesRoot.DIRECTORY_SEPARATOR.$theme;

        if (is_link($themePath) || ! is_dir($themePath)) {
            return null;
        }

        $themeRoot = realpath($themePath);

        if (
            $themeRoot === false
            || ! $this->pathsAreEqual(dirname($themeRoot), $themesRoot)
        ) {
            return null;
        }

        $viewsPath = $themeRoot.DIRECTORY_SEPARATOR.'views';

        if (is_link($viewsPath) || ! is_dir($viewsPath)) {
            return null;
        }

        $viewsDirectory = realpath($viewsPath);
        $themePrefix = rtrim($themeRoot, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR;

        if (
            $viewsDirectory === false
            || ! $this->pathIsWithin($viewsDirectory, $themePrefix)
        ) {
            return null;
        }

        return $viewsDirectory;
    }

    private function hasRequiredPageTemplate(?string $viewsDirectory): bool
    {
        return $viewsDirectory !== null
            && is_file(
                $viewsDirectory.DIRECTORY_SEPARATOR.'templates'
                    .DIRECTORY_SEPARATOR.'page.blade.php'
            );
    }

    private function pathsAreEqual(string $left, string $right): bool
    {
        return DIRECTORY_SEPARATOR === '\\'
            ? strcasecmp($left, $right) === 0
            : $left === $right;
    }

    private function pathIsWithin(string $path, string $directoryPrefix): bool
    {
        return DIRECTORY_SEPARATOR === '\\'
            ? strncasecmp($path, $directoryPrefix, strlen($directoryPrefix)) === 0
            : str_starts_with($path, $directoryPrefix);
    }
}
