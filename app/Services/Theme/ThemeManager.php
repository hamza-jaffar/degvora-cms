<?php

namespace App\Services\Theme;

use App\Models\Setting;
use Illuminate\Contracts\View\View as ViewContract;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Str;
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

        if ($this->hasRequiredPageTemplate($this->viewsDirectory('store-front'))) {
            return 'store-front';
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

        $viewsDir = $this->viewsDirectory($this->active());
        $prefix = $this->templatesPrefix($viewsDir);

        $sanitized = $this->sanitizeTemplatePath($template);
        $dotTemplate = $sanitized !== null ? str_replace('/', '.', $sanitized) : null;

        $view = ($dotTemplate !== null && View::exists("theme::{$prefix}.{$dotTemplate}"))
            ? "theme::{$prefix}.{$dotTemplate}"
            : "theme::{$prefix}.page";

        if (! View::exists($view)) {
            $view = "theme::{$prefix}.page";
        }

        $data['theme'] = app(ThemeContext::class);

        if (! View::exists($view)) {
            throw new RuntimeException(
                "The active theme does not contain views/{$prefix}/page.blade.php."
            );
        }

        return View::make($view, $data);
    }

    /**
     * Check if a specific template exists in the active theme.
     */
    public function hasTemplate(string $template): bool
    {
        $sanitized = $this->sanitizeTemplatePath($template);

        if ($sanitized === null) {
            return false;
        }

        try {
            $viewsDir = $this->viewsDirectory($this->active());
        } catch (\Throwable) {
            return false;
        }

        if ($viewsDir === null) {
            return false;
        }

        $templatesDir = $this->templatesDirectory($viewsDir);

        if ($templatesDir === null) {
            return false;
        }

        $relativePath = str_replace('/', DIRECTORY_SEPARATOR, $sanitized);
        $templateFile = $templatesDir.DIRECTORY_SEPARATOR."{$relativePath}.blade.php";

        return is_file($templateFile);
    }

    /**
     * @return array<int, array{value: string, label: string}>
     */
    public function pageTemplates(): array
    {
        try {
            $viewsDir = $this->viewsDirectory($this->active());
        } catch (\Throwable) {
            return $this->fallbackPageTemplates();
        }

        if ($viewsDir === null) {
            return $this->fallbackPageTemplates();
        }

        $templatesDir = $this->templatesDirectory($viewsDir);

        if ($templatesDir === null) {
            return $this->fallbackPageTemplates();
        }

        $templates = [];

        foreach (File::allFiles($templatesDir) as $file) {
            $relativePath = str_replace('\\', '/', $file->getRelativePathname());

            if (! str_ends_with($relativePath, '.blade.php')) {
                continue;
            }

            $templateName = substr($relativePath, 0, -10);

            // 404 is restricted
            if ($templateName === '404' || str_ends_with($templateName, '/404')) {
                continue;
            }

            $sanitized = $this->sanitizeTemplatePath($templateName);

            if ($sanitized === null) {
                continue;
            }

            if ($sanitized === 'page') {
                $templates[] = [
                    'value' => 'template',
                    'label' => 'Page (page.blade.php)',
                ];
            } else {
                $templates[] = [
                    'value' => $sanitized,
                    'label' => $this->formatTemplateLabel($sanitized),
                ];
            }
        }

        usort($templates, function (array $a, array $b): int {
            if ($a['value'] === 'template') {
                return -1;
            }
            if ($b['value'] === 'template') {
                return 1;
            }
            if ($a['value'] === 'home') {
                return -1;
            }
            if ($b['value'] === 'home') {
                return 1;
            }

            return strcasecmp($a['label'], $b['label']);
        });

        $templates[] = [
            'value' => 'page',
            'label' => 'Default Page (No Theme Layout)',
        ];
        $templates[] = [
            'value' => 'blank',
            'label' => 'Blank Page (No Layout)',
        ];

        return array_values($templates);
    }

    /**
     * Sanitize and validate a template path, preventing directory traversal.
     */
    public function sanitizeTemplatePath(string $template): ?string
    {
        $template = trim(str_replace('\\', '/', $template), '/');

        if ($template === '') {
            return null;
        }

        if (str_contains($template, '..') || str_contains($template, "\0")) {
            return null;
        }

        $segments = explode('/', $template);

        foreach ($segments as $segment) {
            if (preg_match('/\A[a-zA-Z0-9_-]+\z/', $segment) !== 1) {
                return null;
            }
        }

        if ($template === '404' || end($segments) === '404') {
            return null;
        }

        return $template;
    }

    public function templatesDirectory(?string $viewsDir): ?string
    {
        if ($viewsDir === null) {
            return null;
        }

        if (is_dir($viewsDir.DIRECTORY_SEPARATOR.'templates')) {
            return $viewsDir.DIRECTORY_SEPARATOR.'templates';
        }

        if (is_dir($viewsDir.DIRECTORY_SEPARATOR.'template')) {
            return $viewsDir.DIRECTORY_SEPARATOR.'template';
        }

        return null;
    }

    public function templatesPrefix(?string $viewsDir): string
    {
        if ($viewsDir !== null && is_dir($viewsDir.DIRECTORY_SEPARATOR.'template') && ! is_dir($viewsDir.DIRECTORY_SEPARATOR.'templates')) {
            return 'template';
        }

        return 'templates';
    }

    private function formatTemplateLabel(string $template): string
    {
        $parts = explode('/', $template);
        $headline = implode(' / ', array_map(fn (string $part): string => Str::headline(str_replace(['-', '_'], ' ', $part)), $parts));

        return "{$headline} ({$template}.blade.php)";
    }

    /**
     * @return array<int, array{value: string, label: string}>
     */
    private function fallbackPageTemplates(): array
    {
        return [
            ['value' => 'template', 'label' => 'Page (page.blade.php)'],
            ['value' => 'page', 'label' => 'Default Page (No Theme Layout)'],
            ['value' => 'blank', 'label' => 'Blank Page (No Layout)'],
        ];
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
            && (
                is_file(
                    $viewsDirectory.DIRECTORY_SEPARATOR.'templates'
                        .DIRECTORY_SEPARATOR.'page.blade.php'
                ) || is_file(
                    $viewsDirectory.DIRECTORY_SEPARATOR.'template'
                        .DIRECTORY_SEPARATOR.'page.blade.php'
                )
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
