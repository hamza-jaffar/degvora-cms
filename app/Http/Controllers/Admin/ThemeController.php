<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ThemeInstallRequest;
use App\Models\Setting;
use App\Services\Theme\ThemeInstaller;
use App\Services\Theme\ThemeValidator;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ThemeController extends Controller
{
    /**
     * File extensions permitted to be read and edited.
     */
    private const EDITABLE_EXTENSIONS = [
        'php', 'html', 'htm', 'blade.php',
        'css', 'scss', 'sass', 'less',
        'js', 'ts', 'jsx', 'tsx', 'vue',
        'json', 'xml', 'svg',
        'md', 'txt', 'env', 'htaccess',
        'yaml', 'yml', 'toml', 'ini',
    ];

    public function index(ThemeValidator $validator): Response
    {
        $themesPath = base_path('themes');

        if (is_link($themesPath)) {
            abort(500, 'The themes directory must not be a symbolic link.');
        }

        if (! File::exists($themesPath)) {
            File::makeDirectory($themesPath, 0755, true);
        }

        $themesRoot = realpath($themesPath);
        $projectRoot = realpath(base_path());

        if (
            $themesRoot === false
            || $projectRoot === false
            || (DIRECTORY_SEPARATOR === '\\'
                ? strcasecmp(dirname($themesRoot), $projectRoot) !== 0
                : dirname($themesRoot) !== $projectRoot)
        ) {
            abort(500, 'The themes directory must be inside the project root.');
        }

        $directories = File::directories($themesRoot);
        $themes = [];
        $activeTheme = Setting::query()->where('key', 'active_theme')->value('value');

        foreach ($directories as $dir) {
            if (is_link($dir)) {
                continue;
            }

            $slug = basename($dir);
            $manifest = null;
            $error = null;

            try {
                $manifest = $validator->validateThemeDirectory($dir, $slug);
            } catch (ValidationException $exception) {
                $error = collect($exception->errors())->flatten()->first();
            }

            $compatible = $manifest !== null;

            if ($manifest !== null) {
                try {
                    $validator->assertCompatible($manifest);
                } catch (ValidationException $exception) {
                    $compatible = false;
                    $error = collect($exception->errors())->flatten()->first();
                }
            }

            $themes[] = [
                'name' => $manifest['name'] ?? $slug,
                'slug' => $slug,
                'version' => $manifest['version'] ?? null,
                'author' => $manifest['author'] ?? null,
                'description' => $manifest['description'] ?? null,
                'is_active' => $slug === $activeTheme,
                'is_valid' => $manifest !== null,
                'is_compatible' => $compatible,
                'error' => $error,
            ];
        }

        return Inertia::render('admin/themes/index', [
            'themes' => $themes,
        ]);
    }

    public function editor(): Response|RedirectResponse
    {
        $activeTheme = Setting::where('key', 'active_theme')->value('value');

        if (! $activeTheme) {
            return redirect()->route('admin.themes.index')
                ->with('error', 'No active theme set. Please activate a theme first.');
        }

        $themePath = base_path('themes/'.$activeTheme);

        if (! File::exists($themePath)) {
            return redirect()->route('admin.themes.index')
                ->with('error', 'Active theme directory not found.');
        }

        $tree = $this->buildFileTree($themePath, $themePath);

        return Inertia::render('admin/themes/editor', [
            'theme_name' => $activeTheme,
            'file_tree' => $tree,
        ]);
    }

    public function getFile(Request $request): JsonResponse
    {
        $request->validate([
            'path' => ['required', 'string'],
        ]);

        $resolvedPath = $this->resolveThemePath($request->path);

        if (! $resolvedPath || ! File::isFile($resolvedPath)) {
            abort(404, 'File not found.');
        }

        if (! $this->isEditable($resolvedPath)) {
            abort(403, 'This file type cannot be edited.');
        }

        return response()->json([
            'content' => File::get($resolvedPath),
            'path' => $request->path,
        ]);
    }

    public function saveFile(Request $request, Filesystem $filesystem): JsonResponse
    {
        $request->validate([
            'path' => ['required', 'string'],
            'content' => ['required', 'string'],
        ]);

        $resolvedPath = $this->resolveThemePath($request->path);

        if (! $resolvedPath || ! File::isFile($resolvedPath)) {
            abort(404, 'File not found.');
        }

        if (! $this->isEditable($resolvedPath)) {
            abort(403, 'This file type cannot be edited.');
        }

        $filesystem->put($resolvedPath, $request->input('content'));

        return response()->json(['message' => 'File saved successfully.']);
    }

    public function deleteFile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'path' => ['required', 'string', 'max:2000'],
        ]);

        $path = $this->resolveThemeFileForDeletion($validated['path']);

        if (! File::delete($path)) {
            abort(500, 'The theme file could not be deleted.');
        }

        return response()->json([
            'message' => 'File deleted successfully.',
            'path' => $validated['path'],
        ]);
    }

    public function createFile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'parent' => ['nullable', 'string', 'max:2000'],
            'name' => [
                'required',
                'string',
                'max:255',
                'regex:/^[^\/\\\\<>:"|?*\x00-\x1F]+$/u',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (
                        $value === '.'
                        || $value === '..'
                        || preg_match('/[. ]$/', $value) === 1
                    ) {
                        $fail('Enter a valid file name.');
                    }
                },
            ],
        ]);

        $directory = $this->resolveThemeDirectory($validated['parent'] ?? '');
        $path = $directory.DIRECTORY_SEPARATOR.$validated['name'];

        if (! $this->isEditable($path)) {
            throw ValidationException::withMessages([
                'name' => 'This file type cannot be created in the theme editor.',
            ]);
        }

        $handle = @fopen($path, 'x+b');

        if ($handle === false) {
            throw ValidationException::withMessages([
                'name' => 'A file with this name already exists or cannot be created.',
            ]);
        }

        fclose($handle);

        return response()->json([
            'message' => 'File created successfully.',
            'path' => $this->relativeThemePath($path),
        ], 201);
    }

    public function createDirectory(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'parent' => ['nullable', 'string', 'max:2000'],
            'name' => [
                'required',
                'string',
                'max:255',
                'regex:/^[^\/\\\\<>:"|?*\x00-\x1F]+$/u',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (
                        $value === '.'
                        || $value === '..'
                        || preg_match('/[. ]$/', $value) === 1
                    ) {
                        $fail('Enter a valid folder name.');
                    }
                },
            ],
        ]);

        $parentDirectory = $this->resolveThemeDirectory($validated['parent'] ?? '');
        $path = $parentDirectory.DIRECTORY_SEPARATOR.$validated['name'];

        if (! @mkdir($path, 0755)) {
            throw ValidationException::withMessages([
                'name' => 'A folder with this name already exists or cannot be created.',
            ]);
        }

        return response()->json([
            'message' => 'Folder created successfully.',
            'path' => $this->relativeThemePath($path),
        ], 201);
    }

    public function upload(ThemeInstallRequest $request, ThemeInstaller $installer): RedirectResponse
    {
        $manifest = $installer->install($request->uploadedTheme());

        return back()->with('success', "{$manifest['name']} was installed successfully.");
    }

    public function setActive(Request $request, ThemeInstaller $installer): RedirectResponse
    {
        $validated = $request->validate([
            'theme' => ['required', 'string', 'max:255'],
        ]);

        $manifest = $installer->validateInstalledTheme($validated['theme']);
        $themeSlug = $manifest['slug'];

        Setting::updateOrCreate(
            ['key' => 'active_theme'],
            ['value' => $themeSlug]
        );

        return redirect()->back()->with('success', 'Theme activated successfully.');
    }

    public function destroy(string $theme, ThemeInstaller $installer): RedirectResponse
    {
        $activeTheme = Setting::query()->where('key', 'active_theme')->value('value');
        $deletedThemeSlug = $installer->delete($theme);

        if ($deletedThemeSlug === $activeTheme) {
            Setting::query()
                ->where('key', 'active_theme')
                ->where('value', $deletedThemeSlug)
                ->delete();
        }

        return back()->with('success', 'Theme deleted successfully.');
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    /**
     * Resolve a relative theme path to an absolute path, preventing directory traversal.
     */
    private function resolveThemePath(string $relativePath): ?string
    {
        $activeTheme = Setting::where('key', 'active_theme')->value('value');
        if (! $activeTheme) {
            return null;
        }

        $themeRoot = realpath(base_path('themes/'.$activeTheme));
        if (! $themeRoot) {
            return null;
        }

        // Prevent directory traversal: normalize and ensure the path is inside the theme root
        $fullPath = realpath($themeRoot.DIRECTORY_SEPARATOR.ltrim($relativePath, '/\\'));
        if (! $fullPath || ! str_starts_with($fullPath, $themeRoot.DIRECTORY_SEPARATOR)) {
            return null;
        }

        return $fullPath;
    }

    private function resolveThemeDirectory(string $relativePath): string
    {
        $activeTheme = Setting::query()->where('key', 'active_theme')->value('value');

        if (
            ! is_string($activeTheme)
            || preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $activeTheme) !== 1
        ) {
            abort(404, 'Active theme not found.');
        }

        $themeRootPath = base_path('themes'.DIRECTORY_SEPARATOR.$activeTheme);

        if (is_link($themeRootPath)) {
            abort(404, 'Active theme not found.');
        }

        $themeRoot = realpath($themeRootPath);
        $themesRoot = realpath(base_path('themes'));

        if (
            $themeRoot === false
            || $themesRoot === false
            || (DIRECTORY_SEPARATOR === '\\'
                ? strcasecmp(dirname($themeRoot), $themesRoot) !== 0
                : dirname($themeRoot) !== $themesRoot)
        ) {
            abort(404, 'Active theme not found.');
        }

        if ($relativePath === '') {
            return $themeRoot;
        }

        if (str_contains($relativePath, '\\') || str_starts_with($relativePath, '/')) {
            throw ValidationException::withMessages([
                'parent' => 'The selected folder path is invalid.',
            ]);
        }

        $directory = $themeRoot;

        foreach (explode('/', $relativePath) as $segment) {
            if (
                $segment === ''
                || $segment === '.'
                || $segment === '..'
                || preg_match('/^[^<>:"|?*\x00-\x1F]+$/u', $segment) !== 1
            ) {
                throw ValidationException::withMessages([
                    'parent' => 'The selected folder path is invalid.',
                ]);
            }

            $directory .= DIRECTORY_SEPARATOR.$segment;

            if (is_link($directory) || ! is_dir($directory)) {
                throw ValidationException::withMessages([
                    'parent' => 'The selected folder does not exist in the active theme.',
                ]);
            }
        }

        $resolvedDirectory = realpath($directory);
        $themePrefix = rtrim($themeRoot, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR;

        if (
            $resolvedDirectory === false
            || (DIRECTORY_SEPARATOR === '\\'
                ? strncasecmp($resolvedDirectory, $themePrefix, strlen($themePrefix)) !== 0
                : ! str_starts_with($resolvedDirectory, $themePrefix))
        ) {
            throw ValidationException::withMessages([
                'parent' => 'The selected folder path is invalid.',
            ]);
        }

        return $resolvedDirectory;
    }

    private function resolveThemeFileForDeletion(string $relativePath): string
    {
        if ($relativePath === '' || str_contains($relativePath, '\\') || str_starts_with($relativePath, '/')) {
            throw ValidationException::withMessages([
                'path' => 'The selected file path is invalid.',
            ]);
        }

        $segments = explode('/', $relativePath);
        $fileName = array_pop($segments);

        foreach ($segments as $segment) {
            if (
                $segment === ''
                || $segment === '.'
                || $segment === '..'
                || preg_match('/[<>:"|?*\x00-\x1F]/u', $segment) !== 0
            ) {
                throw ValidationException::withMessages([
                    'path' => 'The selected file path is invalid.',
                ]);
            }
        }

        if (
            $fileName === null
            || $fileName === ''
            || $fileName === '.'
            || $fileName === '..'
            || preg_match('/[. ]$/', $fileName) === 1
            || preg_match('/[<>:"|?*\x00-\x1F]/u', $fileName) !== 0
        ) {
            throw ValidationException::withMessages([
                'path' => 'The selected file path is invalid.',
            ]);
        }

        $parentDirectory = $this->resolveThemeDirectory(implode('/', $segments));
        $path = $parentDirectory.DIRECTORY_SEPARATOR.$fileName;

        if (is_link($path) || ! File::isFile($path)) {
            abort(404, 'File not found.');
        }

        return $path;
    }

    private function relativeThemePath(string $absolutePath): string
    {
        $activeTheme = (string) Setting::query()->where('key', 'active_theme')->value('value');
        $themeRoot = realpath(base_path('themes'.DIRECTORY_SEPARATOR.$activeTheme));

        if ($themeRoot === false) {
            abort(404, 'Active theme not found.');
        }

        $relativePath = substr($absolutePath, strlen($themeRoot) + 1);

        return str_replace(DIRECTORY_SEPARATOR, '/', $relativePath);
    }

    /**
     * Recursively build the file tree for the editor sidebar.
     *
     * @return array<int, array{name: string, path: string, type: string, children?: array<int, mixed>, editable?: bool}>
     */
    private function buildFileTree(string $directory, string $themeRoot): array
    {
        $items = [];

        $entries = collect(File::directories($directory))
            ->map(fn ($dir) => ['type' => 'directory', 'path' => $dir])
            ->merge(
                collect(File::files($directory))
                    ->map(fn ($file) => ['type' => 'file', 'path' => $file->getPathname()])
            )
            ->sortBy('type'); // directories first

        foreach ($entries as $entry) {
            $absolutePath = $entry['path'];
            $relativePath = str_replace(
                DIRECTORY_SEPARATOR,
                '/',
                ltrim(str_replace($themeRoot, '', $absolutePath), '/\\')
            );
            $name = basename($absolutePath);

            if ($entry['type'] === 'directory') {
                $items[] = [
                    'name' => $name,
                    'path' => $relativePath,
                    'type' => 'directory',
                    'children' => $this->buildFileTree($absolutePath, $themeRoot),
                ];
            } else {
                $items[] = [
                    'name' => $name,
                    'path' => $relativePath,
                    'type' => 'file',
                    'editable' => $this->isEditable($absolutePath),
                ];
            }
        }

        return $items;
    }

    /**
     * Check whether a file is safe and permitted to be edited.
     */
    private function isEditable(string $absolutePath): bool
    {
        $filename = basename($absolutePath);

        if (in_array(strtolower($filename), ['.env', '.htaccess'], true)) {
            return true;
        }

        // Allow .blade.php as a special case
        if (str_ends_with($filename, '.blade.php')) {
            return true;
        }

        $extension = strtolower(pathinfo($absolutePath, PATHINFO_EXTENSION));

        return in_array($extension, self::EDITABLE_EXTENSIONS, true);
    }
}
