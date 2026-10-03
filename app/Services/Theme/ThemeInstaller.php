<?php

namespace App\Services\Theme;

use Illuminate\Filesystem\Filesystem;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use ZipArchive;

class ThemeInstaller
{
    public function __construct(
        private Filesystem $filesystem,
        private ThemeValidator $validator,
    ) {}

    /**
     * @return array{name: string, slug: string, version: string, author: string, description: string, requires: array{degvoracms: string}}
     */
    public function install(UploadedFile $uploadedFile): array
    {
        $temporaryDirectory = storage_path('app/temp/themes/'.Str::uuid());
        $archivePath = $temporaryDirectory.DIRECTORY_SEPARATOR.'theme.zip';
        $extractDirectory = $temporaryDirectory.DIRECTORY_SEPARATOR.'extracted';
        $archive = new ZipArchive;
        $archiveIsOpen = false;

        $this->makeDirectory($temporaryDirectory);

        try {
            $uploadedFile->move($temporaryDirectory, 'theme.zip');

            if ($archive->open($archivePath) !== true) {
                $this->reject('The uploaded file is not a readable ZIP archive.');
            }

            $archiveIsOpen = true;
            $inspection = $this->validator->inspectArchive($archive);
            $this->makeDirectory($extractDirectory);
            $extractRoot = realpath($extractDirectory);

            if ($extractRoot === false) {
                throw new RuntimeException('The temporary theme extraction directory could not be resolved.');
            }

            $this->extractArchive($archive, $inspection['entries'], $extractRoot);

            if (! $archive->close()) {
                $this->reject('The uploaded ZIP archive could not be read.');
            }

            $archiveIsOpen = false;

            $stagedThemeDirectory = $extractRoot.DIRECTORY_SEPARATOR.$inspection['root'];
            $manifest = $this->validator->validateThemeDirectory(
                $stagedThemeDirectory,
                $inspection['root'],
            );
            $this->validator->assertCompatible($manifest);

            $themesRoot = $this->themesRoot(create: true);
            $installationPath = $themesRoot.DIRECTORY_SEPARATOR.$manifest['slug'];

            if (file_exists($installationPath) || is_link($installationPath)) {
                $this->reject('This theme is already installed.');
            }

            if (! $this->filesystem->moveDirectory($stagedThemeDirectory, $installationPath)) {
                throw new RuntimeException('The validated theme could not be moved into the themes directory.');
            }

            return $manifest;
        } finally {
            if ($archiveIsOpen) {
                $archive->close();
            }

            $this->filesystem->deleteDirectory($temporaryDirectory);

            if (file_exists($temporaryDirectory)) {
                throw new RuntimeException('Temporary theme files could not be cleaned up.');
            }
        }
    }

    /**
     * @return array{name: string, slug: string, version: string, author: string, description: string, requires: array{degvoracms: string}}
     */
    public function validateInstalledTheme(string $slug): array
    {
        $slug = $this->resolveInstalledThemeSlug($slug);

        $themePath = $this->themePath($slug);
        $manifest = $this->validator->validateThemeDirectory($themePath, $slug);
        $this->validator->assertCompatible($manifest);

        return $manifest;
    }

    public function delete(string $slug): string
    {
        $slug = $this->resolveInstalledThemeSlug($slug);

        $themePath = $this->themePath($slug);

        if (is_link($themePath) || ! is_dir($themePath)) {
            $this->reject('Theme not found.');
        }

        $themesRoot = $this->themesRoot();
        $resolvedThemePath = realpath($themePath);

        if (
            $resolvedThemePath === false
            || dirname($resolvedThemePath) !== $themesRoot
        ) {
            throw new RuntimeException('The theme directory is outside the themes directory.');
        }

        if (! $this->filesystem->deleteDirectory($resolvedThemePath) || file_exists($resolvedThemePath)) {
            throw new RuntimeException('The theme directory could not be deleted.');
        }

        return $slug;
    }

    /**
     * @param  list<array{name: string, path: string, directory: bool, size: int}>  $entries
     */
    private function extractArchive(ZipArchive $archive, array $entries, string $extractRoot): void
    {
        foreach ($entries as $entry) {
            $destination = $extractRoot.DIRECTORY_SEPARATOR.str_replace(
                '/',
                DIRECTORY_SEPARATOR,
                $entry['path'],
            );

            if ($entry['directory']) {
                $this->makeDirectory($destination);
                $this->assertInsideDirectory(realpath($destination), $extractRoot);

                continue;
            }

            $destinationDirectory = dirname($destination);
            $this->makeDirectory($destinationDirectory);
            $this->assertInsideDirectory(realpath($destinationDirectory), $extractRoot);

            $input = $archive->getStream($entry['name']);
            $output = fopen($destination, 'xb');

            if ($input === false || $output === false) {
                if (is_resource($input)) {
                    fclose($input);
                }

                if (is_resource($output)) {
                    fclose($output);
                }

                $this->reject('The uploaded ZIP archive could not be extracted safely.');
            }

            try {
                $bytesWritten = stream_copy_to_stream($input, $output);
            } finally {
                fclose($input);
                fclose($output);
            }

            if ($bytesWritten !== $entry['size']) {
                $this->reject('The uploaded ZIP archive could not be extracted safely.');
            }
        }
    }

    private function themePath(string $slug): string
    {
        return $this->themesRoot().DIRECTORY_SEPARATOR.$slug;
    }

    private function resolveInstalledThemeSlug(string $identifier): string
    {
        if (preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $identifier) === 1) {
            return $identifier;
        }

        $matchingSlugs = [];

        foreach ($this->filesystem->directories($this->themesRoot()) as $directory) {
            if (is_link($directory)) {
                continue;
            }

            $slug = basename($directory);

            if (preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug) !== 1) {
                continue;
            }

            $manifestPath = $directory.DIRECTORY_SEPARATOR.'theme.json';

            if (is_link($manifestPath) || ! is_file($manifestPath)) {
                continue;
            }

            $manifestContents = file_get_contents($manifestPath);

            if ($manifestContents === false) {
                continue;
            }

            try {
                $manifest = json_decode($manifestContents, true, 512, JSON_THROW_ON_ERROR);
            } catch (\JsonException) {
                continue;
            }

            if (
                is_array($manifest)
                && ($manifest['name'] ?? null) === $identifier
                && ($manifest['slug'] ?? null) === $slug
            ) {
                $matchingSlugs[] = $slug;
            }
        }

        if (count($matchingSlugs) === 1) {
            return $matchingSlugs[0];
        }

        if (count($matchingSlugs) > 1) {
            $this->reject('Theme name is ambiguous; use its theme slug.');
        }

        $this->reject('Theme not found.');
    }

    private function themesRoot(bool $create = false): string
    {
        $themesDirectory = base_path('themes');

        if ($create) {
            $this->makeDirectory($themesDirectory);
        }

        if (is_link($themesDirectory)) {
            throw new RuntimeException('The themes directory must not be a symbolic link.');
        }

        $themesRoot = realpath($themesDirectory);
        $projectRoot = realpath(base_path());

        if ($themesRoot === false || ! is_dir($themesRoot)) {
            $this->reject('Theme not found.');
        }

        if (
            $projectRoot === false
            || ! $this->isWithinDirectory($themesRoot, $projectRoot)
            || ! $this->samePath(dirname($themesRoot), $projectRoot)
        ) {
            throw new RuntimeException('The themes directory must be inside the project root.');
        }

        return $themesRoot;
    }

    private function makeDirectory(string $path): void
    {
        if (! is_dir($path) && ! $this->filesystem->makeDirectory($path, 0755, true, true)) {
            throw new RuntimeException("The directory {$path} could not be created.");
        }
    }

    private function assertInsideDirectory(string|false $path, string $directory): void
    {
        if ($path === false || ! $this->isWithinDirectory($path, $directory)) {
            $this->reject('The ZIP contains an unsafe file path.');
        }
    }

    private function isWithinDirectory(string|false $path, string|false $directory): bool
    {
        if ($path === false || $directory === false) {
            return false;
        }

        $prefix = rtrim($directory, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR;

        return DIRECTORY_SEPARATOR === '\\'
            ? strncasecmp($path, $prefix, strlen($prefix)) === 0
            : str_starts_with($path, $prefix);
    }

    private function samePath(string $first, string $second): bool
    {
        return DIRECTORY_SEPARATOR === '\\'
            ? strcasecmp($first, $second) === 0
            : $first === $second;
    }

    private function reject(string $message): never
    {
        throw ValidationException::withMessages(['theme' => $message]);
    }
}
