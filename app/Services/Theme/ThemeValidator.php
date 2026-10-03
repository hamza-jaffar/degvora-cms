<?php

namespace App\Services\Theme;

use Illuminate\Validation\ValidationException;
use ZipArchive;

class ThemeValidator
{
    private const MAX_ARCHIVE_ENTRIES = 5000;

    private const MAX_UNCOMPRESSED_BYTES = 104857600;

    /**
     * @return array{root: string, entries: list<array{name: string, path: string, directory: bool, size: int}>}
     */
    public function inspectArchive(ZipArchive $archive): array
    {
        if ($archive->numFiles === 0 || $archive->numFiles > self::MAX_ARCHIVE_ENTRIES) {
            $this->reject('The ZIP archive is empty or contains too many files.');
        }

        $entries = [];
        $entryPaths = [];
        $roots = [];
        $uncompressedBytes = 0;

        for ($index = 0; $index < $archive->numFiles; $index++) {
            $name = $archive->getNameIndex($index);
            $stat = $archive->statIndex($index);

            if ($name === false || $stat === false) {
                $this->reject('The uploaded ZIP archive could not be read.');
            }

            $directory = str_ends_with($name, '/');
            $path = rtrim($name, '/');
            $segments = explode('/', $path);

            if (
                $path === ''
                || str_contains($name, "\0")
                || str_contains($name, '\\')
                || str_starts_with($name, '/')
                || preg_match('/^[a-zA-Z]:/', $name) === 1
            ) {
                $this->reject('The ZIP contains an unsafe file path.');
            }

            foreach ($segments as $segment) {
                if (
                    $segment === ''
                    || $segment === '.'
                    || $segment === '..'
                    || str_contains($segment, '..')
                    || preg_match('/[<>:"|?*\x00-\x1F]/', $segment) === 1
                    || preg_match('/[. ]$/', $segment) === 1
                    || preg_match('/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/i', $segment) === 1
                ) {
                    $this->reject('The ZIP contains an unsafe file path.');
                }
            }

            $root = $segments[0];

            if (! $this->isSafeSlug($root)) {
                $this->reject('The ZIP must contain one theme root directory with a safe slug.');
            }

            $roots[$root] = true;

            if (! $directory && count($segments) < 2) {
                $this->reject('The ZIP must contain one theme root directory.');
            }

            $normalizedPath = implode('/', $segments);
            $pathKey = strtolower($normalizedPath);

            if (array_key_exists($pathKey, $entryPaths)) {
                $this->reject('The ZIP contains duplicate file paths.');
            }

            $entryPaths[$pathKey] = $directory;

            $operatingSystem = 0;
            $externalAttributes = 0;

            if (
                $archive->getExternalAttributesIndex($index, $operatingSystem, $externalAttributes)
                && $operatingSystem === ZipArchive::OPSYS_UNIX
                && (($externalAttributes >> 16) & 0170000) === 0120000
            ) {
                $this->reject('The ZIP contains an unsafe symbolic link.');
            }

            $size = $stat['size'];

            if (! $directory) {
                $uncompressedBytes += $size;

                if ($uncompressedBytes > self::MAX_UNCOMPRESSED_BYTES) {
                    $this->reject('The uncompressed theme is larger than the allowed limit.');
                }
            }

            $entries[] = [
                'name' => $name,
                'path' => $normalizedPath,
                'directory' => $directory,
                'size' => $size,
            ];
        }

        if (count($roots) !== 1) {
            $this->reject('The ZIP must contain exactly one theme root directory.');
        }

        foreach ($entries as $entry) {
            if ($entry['directory']) {
                continue;
            }

            $segments = explode('/', $entry['path']);
            array_pop($segments);

            while (count($segments) > 0) {
                $parentPath = strtolower(implode('/', $segments));

                if (array_key_exists($parentPath, $entryPaths) && $entryPaths[$parentPath] === false) {
                    $this->reject('The ZIP contains conflicting file paths.');
                }

                array_pop($segments);
            }
        }

        return [
            'root' => (string) array_key_first($roots),
            'entries' => $entries,
        ];
    }

    /**
     * @return array{name: string, slug: string, version: string, author: string, description: string, requires: array{degvoracms: string}}
     */
    public function validateThemeDirectory(string $directory, string $expectedSlug): array
    {
        $this->assertSafeSlug($expectedSlug);

        if (is_link($directory) || ! is_dir($directory) || basename($directory) !== $expectedSlug) {
            $this->reject('The theme directory does not match its expected slug.');
        }

        $manifestPath = $directory.DIRECTORY_SEPARATOR.'theme.json';

        if (is_link($manifestPath) || ! is_file($manifestPath)) {
            $this->reject('theme.json is missing.');
        }

        $manifestSize = filesize($manifestPath);

        if ($manifestSize === false || $manifestSize > 1048576) {
            $this->reject('theme.json is larger than the allowed limit.');
        }

        try {
            $manifestContents = file_get_contents($manifestPath);

            if ($manifestContents === false) {
                $this->reject('theme.json could not be read.');
            }

            $manifest = json_decode(
                $manifestContents,
                true,
                512,
                JSON_THROW_ON_ERROR,
            );
        } catch (\JsonException) {
            $this->reject('theme.json contains invalid JSON.');
        }

        if (! is_array($manifest) || array_is_list($manifest)) {
            $this->reject('theme.json must contain a JSON object.');
        }

        foreach (['name', 'slug', 'version', 'author', 'description'] as $field) {
            if (! is_string($manifest[$field] ?? null) || trim($manifest[$field]) === '') {
                $this->reject('Theme '.ucfirst($field).' is required.');
            }
        }

        $slug = $manifest['slug'];
        $this->assertSafeSlug($slug);

        if ($slug !== $expectedSlug) {
            $this->reject('The theme slug must match the installation directory.');
        }

        if (! $this->isVersion($manifest['version'])) {
            $this->reject('Theme version must be a valid semantic version.');
        }

        $requirements = $manifest['requires'] ?? null;

        if (! is_array($requirements)) {
            $this->reject('Theme requires.degvoracms is required.');
        }

        $cmsRequirement = $requirements['degvoracms'] ?? null;

        if (! is_string($cmsRequirement) || trim($cmsRequirement) === '') {
            $this->reject('Theme requires.degvoracms is required.');
        }

        if (! $this->isVersionConstraint($cmsRequirement)) {
            $this->reject('Theme requires an unsupported DegvoraCMS version constraint.');
        }

        foreach ([
            'views/layouts',
            'views/templates',
        ] as $requiredDirectory) {
            $requiredPath = $directory.DIRECTORY_SEPARATOR.str_replace('/', DIRECTORY_SEPARATOR, $requiredDirectory);

            if (is_link($requiredPath) || ! is_dir($requiredPath)) {
                $this->reject("Required theme directory {$requiredDirectory} is missing.");
            }
        }

        foreach ([
            'views/layouts/app.blade.php',
            'views/templates/page.blade.php',
        ] as $requiredFile) {
            $requiredPath = $directory.DIRECTORY_SEPARATOR.str_replace('/', DIRECTORY_SEPARATOR, $requiredFile);

            if (is_link($requiredPath) || ! is_file($requiredPath)) {
                $this->reject("Required template {$requiredFile} is missing.");
            }
        }

        return [
            'name' => trim($manifest['name']),
            'slug' => $slug,
            'version' => trim($manifest['version']),
            'author' => trim($manifest['author']),
            'description' => trim($manifest['description']),
            'requires' => ['degvoracms' => trim($cmsRequirement)],
        ];
    }

    /**
     * @param  array{name: string, slug: string, version: string, author: string, description: string, requires: array{degvoracms: string}}  $manifest
     */
    public function assertCompatible(array $manifest): void
    {
        if (preg_match('/^(>=|>|<=|<|==|=)\s*(.+)$/', $manifest['requires']['degvoracms'], $matches) !== 1) {
            $this->reject('Theme requires an unsupported DegvoraCMS version constraint.');
        }

        $operator = $matches[1];
        $requiredVersion = $matches[2];
        $cmsVersion = (string) config('app.version', '1.0.0');

        if (! version_compare($cmsVersion, $requiredVersion, $operator)) {
            $this->reject('The theme requires a newer version of DegvoraCMS.');
        }
    }

    public function assertSafeSlug(string $slug): void
    {
        if (! $this->isSafeSlug($slug)) {
            $this->reject('Theme slug is invalid.');
        }
    }

    private function isSafeSlug(string $slug): bool
    {
        return preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug) === 1;
    }

    private function isVersion(string $version): bool
    {
        return preg_match('/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/', $version) === 1;
    }

    private function isVersionConstraint(string $constraint): bool
    {
        return preg_match(
            '/^(>=|>|<=|<|==|=)\s*\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/',
            trim($constraint),
        ) === 1;
    }

    private function reject(string $message): never
    {
        throw ValidationException::withMessages(['theme' => $message]);
    }
}
