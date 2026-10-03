<?php

use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use ZipArchive;

it('installs a valid theme and lists its metadata', function () {
    $user = User::factory()->create();
    $slug = testThemeSlug();

    try {
        $this->actingAs($user)
            ->from(route('admin.themes.index'))
            ->post(route('admin.themes.upload'), [
                'theme' => makeThemeZip(themeFiles($slug)),
            ])
            ->assertRedirect(route('admin.themes.index'))
            ->assertSessionHasNoErrors();

        expect(File::exists(base_path("themes/{$slug}/theme.json")))->toBeTrue();

        $this->actingAs($user)
            ->get(route('admin.themes.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/themes/index')
                ->where('themes', fn (Collection $themes) => $themes->contains(
                    fn (array $theme) => $theme['slug'] === $slug
                        && $theme['name'] === 'Modern Shop'
                        && $theme['version'] === '1.0.0'
                        && $theme['author'] === 'Degvora'
                        && $theme['is_valid'] === true
                        && $theme['is_compatible'] === true,
                )));
    } finally {
        File::deleteDirectory(base_path("themes/{$slug}"));
    }
});

it('rejects a file that is not a readable zip archive', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from(route('admin.themes.index'))
        ->post(route('admin.themes.upload'), [
            'theme' => UploadedFile::fake()->createWithContent('theme.zip', 'not a zip archive'),
        ])
        ->assertRedirect(route('admin.themes.index'))
        ->assertSessionHasErrors([
            'theme' => 'The uploaded file is not a readable ZIP archive.',
        ]);
});

it('rejects a zip path traversal entry before writing outside temporary storage', function () {
    $user = User::factory()->create();
    $slug = testThemeSlug();
    $outsideFile = base_path('theme-installer-'.Str::uuid().'.txt');
    $entries = themeFiles($slug);
    $entries[$slug.'/../../'.basename($outsideFile)] = 'must not be written';

    $this->actingAs($user)
        ->from(route('admin.themes.index'))
        ->post(route('admin.themes.upload'), [
            'theme' => makeThemeZip($entries),
        ])
        ->assertRedirect(route('admin.themes.index'))
        ->assertSessionHasErrors([
            'theme' => 'The ZIP contains an unsafe file path.',
        ]);

    expect(file_exists($outsideFile))->toBeFalse()
        ->and(File::exists(base_path("themes/{$slug}")))->toBeFalse();
});

it('rejects invalid theme json and preserves its useful validation message', function () {
    $user = User::factory()->create();
    $slug = testThemeSlug();
    $entries = themeFiles($slug);
    $entries[$slug.'/theme.json'] = '{invalid json';

    $this->actingAs($user)
        ->from(route('admin.themes.index'))
        ->post(route('admin.themes.upload'), [
            'theme' => makeThemeZip($entries),
        ])
        ->assertRedirect(route('admin.themes.index'))
        ->assertSessionHasErrors([
            'theme' => 'theme.json contains invalid JSON.',
        ]);

    expect(File::exists(base_path("themes/{$slug}")))->toBeFalse();
});

it('rejects a theme when the manifest slug does not match its root directory', function () {
    $user = User::factory()->create();
    $slug = testThemeSlug();
    $entries = themeFiles($slug, ['slug' => 'different-theme-slug']);

    $this->actingAs($user)
        ->from(route('admin.themes.index'))
        ->post(route('admin.themes.upload'), [
            'theme' => makeThemeZip($entries),
        ])
        ->assertRedirect(route('admin.themes.index'))
        ->assertSessionHasErrors([
            'theme' => 'The theme slug must match the installation directory.',
        ]);

    expect(File::exists(base_path("themes/{$slug}")))->toBeFalse();
});

it('rejects archives containing more than one theme root directory', function () {
    $user = User::factory()->create();
    $slug = testThemeSlug();
    $entries = themeFiles($slug);
    $entries['second-theme/README.txt'] = 'A second root is not allowed.';

    $this->actingAs($user)
        ->from(route('admin.themes.index'))
        ->post(route('admin.themes.upload'), [
            'theme' => makeThemeZip($entries),
        ])
        ->assertRedirect(route('admin.themes.index'))
        ->assertSessionHasErrors([
            'theme' => 'The ZIP must contain exactly one theme root directory.',
        ]);

    expect(File::exists(base_path("themes/{$slug}")))->toBeFalse();
});

it('rejects themes that omit the required page template', function () {
    $user = User::factory()->create();
    $slug = testThemeSlug();
    $entries = themeFiles($slug);
    unset($entries[$slug.'/views/templates/page.blade.php']);
    $entries[$slug.'/views/templates/home.blade.php'] = '<main>Home</main>';

    $this->actingAs($user)
        ->from(route('admin.themes.index'))
        ->post(route('admin.themes.upload'), [
            'theme' => makeThemeZip($entries),
        ])
        ->assertRedirect(route('admin.themes.index'))
        ->assertSessionHasErrors([
            'theme' => 'Required template views/templates/page.blade.php is missing.',
        ]);

    expect(File::exists(base_path("themes/{$slug}")))->toBeFalse();
});

it('rejects duplicate theme slugs without replacing installed files', function () {
    $user = User::factory()->create();
    $slug = testThemeSlug();
    $themePath = base_path("themes/{$slug}");

    try {
        $this->actingAs($user)
            ->from(route('admin.themes.index'))
            ->post(route('admin.themes.upload'), [
                'theme' => makeThemeZip(themeFiles($slug)),
            ])
            ->assertSessionHasNoErrors();

        $manifestPath = $themePath.'/theme.json';
        $originalManifest = file_get_contents($manifestPath);

        $this->actingAs($user)
            ->from(route('admin.themes.index'))
            ->post(route('admin.themes.upload'), [
                'theme' => makeThemeZip(themeFiles($slug, ['name' => 'Replacement'])),
            ])
            ->assertRedirect(route('admin.themes.index'))
            ->assertSessionHasErrors([
                'theme' => 'This theme is already installed.',
            ]);

        expect(file_get_contents($manifestPath))->toBe($originalManifest);
    } finally {
        File::deleteDirectory($themePath);
    }
});

it('deletes an active theme and clears its active setting', function () {
    $user = User::factory()->create();
    $slug = testThemeSlug();
    $themePath = base_path("themes/{$slug}");

    try {
        $this->actingAs($user)
            ->from(route('admin.themes.index'))
            ->post(route('admin.themes.upload'), [
                'theme' => makeThemeZip(themeFiles($slug)),
            ])
            ->assertSessionHasNoErrors();

        $this->actingAs($user)
            ->from(route('admin.themes.index'))
            ->post(route('admin.themes.active'), ['theme' => 'Modern Shop'])
            ->assertRedirect(route('admin.themes.index'))
            ->assertSessionHasNoErrors();

        expect(Setting::query()->where('key', 'active_theme')->value('value'))->toBe($slug);

        $this->actingAs($user)
            ->from(route('admin.themes.index'))
            ->delete(route('admin.themes.destroy', ['theme' => 'Modern Shop']))
            ->assertRedirect(route('admin.themes.index'))
            ->assertSessionHasNoErrors();

        expect(File::exists($themePath))->toBeFalse()
            ->and(Setting::query()->where('key', 'active_theme')->exists())->toBeFalse();
    } finally {
        File::deleteDirectory($themePath);
    }
});

it('deletes an inactive theme directory', function () {
    $user = User::factory()->create();
    $slug = testThemeSlug();
    $siblingSlug = testThemeSlug();
    $themePath = base_path("themes/{$slug}");
    $siblingPath = base_path("themes/{$siblingSlug}");
    File::makeDirectory($siblingPath, 0755, true);

    try {
        $this->actingAs($user)
            ->from(route('admin.themes.index'))
            ->post(route('admin.themes.upload'), [
                'theme' => makeThemeZip(themeFiles($slug)),
            ])
            ->assertSessionHasNoErrors();

        $this->actingAs($user)
            ->from(route('admin.themes.index'))
            ->delete(route('admin.themes.destroy', ['theme' => $slug]))
            ->assertRedirect(route('admin.themes.index'))
            ->assertSessionHasNoErrors();

        expect(File::exists($themePath))->toBeFalse()
            ->and(File::isDirectory($siblingPath))->toBeTrue();
    } finally {
        File::deleteDirectory($themePath);
        File::deleteDirectory($siblingPath);
    }
});

it('rejects activation when the installed theme metadata is invalid', function () {
    $user = User::factory()->create();
    $slug = testThemeSlug();
    $themePath = base_path("themes/{$slug}");

    File::makeDirectory($themePath.'/views/layouts', 0755, true);
    File::makeDirectory($themePath.'/views/templates', 0755, true);
    File::put($themePath.'/theme.json', '{invalid json');
    File::put($themePath.'/views/layouts/app.blade.php', '<main></main>');
    File::put($themePath.'/views/templates/page.blade.php', '<main></main>');

    try {
        $this->actingAs($user)
            ->from(route('admin.themes.index'))
            ->post(route('admin.themes.active'), ['theme' => $slug])
            ->assertRedirect(route('admin.themes.index'))
            ->assertSessionHasErrors([
                'theme' => 'theme.json contains invalid JSON.',
            ]);

        expect(Setting::query()->where('key', 'active_theme')->exists())->toBeFalse();
    } finally {
        File::deleteDirectory($themePath);
    }
});

it('rejects themes that require a newer cms version', function () {
    $user = User::factory()->create();
    $slug = testThemeSlug();
    $manifest = themeFiles($slug, [
        'requires' => ['degvoracms' => '>=99.0.0'],
    ]);

    $this->actingAs($user)
        ->from(route('admin.themes.index'))
        ->post(route('admin.themes.upload'), [
            'theme' => makeThemeZip($manifest),
        ])
        ->assertRedirect(route('admin.themes.index'))
        ->assertSessionHasErrors([
            'theme' => 'The theme requires a newer version of DegvoraCMS.',
        ]);

    expect(File::exists(base_path("themes/{$slug}")))->toBeFalse();
});

it('creates a supported file inside the active theme', function () {
    $user = User::factory()->create();
    $slug = testThemeSlug();
    $themePath = base_path("themes/{$slug}");

    File::makeDirectory($themePath.'/views/templates', 0755, true);
    Setting::create(['key' => 'active_theme', 'value' => $slug]);

    try {
        $this->actingAs($user)
            ->postJson(route('admin.themes.create-file'), [
                'parent' => 'views/templates',
                'name' => 'custom.blade.php',
            ])
            ->assertCreated()
            ->assertJsonPath('path', 'views/templates/custom.blade.php');

        expect(File::exists($themePath.'/views/templates/custom.blade.php'))->toBeTrue();
    } finally {
        File::deleteDirectory($themePath);
    }
});

it('creates a folder inside the selected active theme directory', function () {
    $user = User::factory()->create();
    $slug = testThemeSlug();
    $themePath = base_path("themes/{$slug}");

    File::makeDirectory($themePath.'/views', 0755, true);
    Setting::create(['key' => 'active_theme', 'value' => $slug]);

    try {
        $this->actingAs($user)
            ->postJson(route('admin.themes.create-directory'), [
                'parent' => 'views',
                'name' => 'components',
            ])
            ->assertCreated()
            ->assertJsonPath('path', 'views/components');

        expect(File::isDirectory($themePath.'/views/components'))->toBeTrue();
    } finally {
        File::deleteDirectory($themePath);
    }
});

it('deletes a file from the active theme', function () {
    $user = User::factory()->create();
    $slug = testThemeSlug();
    $themePath = base_path("themes/{$slug}");
    $filePath = $themePath.'/views/templates/custom.blade.php';

    File::makeDirectory(dirname($filePath), 0755, true);
    File::put($filePath, '<main>Custom</main>');
    Setting::create(['key' => 'active_theme', 'value' => $slug]);

    try {
        $this->actingAs($user)
            ->deleteJson(route('admin.themes.delete-file'), [
                'path' => 'views/templates/custom.blade.php',
            ])
            ->assertOk()
            ->assertJsonPath('message', 'File deleted successfully.')
            ->assertJsonPath('path', 'views/templates/custom.blade.php');

        expect(File::exists($filePath))->toBeFalse();
    } finally {
        File::deleteDirectory($themePath);
    }
});

it('rejects file deletion paths outside the active theme', function () {
    $user = User::factory()->create();
    $slug = testThemeSlug();
    $themePath = base_path("themes/{$slug}");
    $outsidePath = base_path('theme-editor-'.Str::uuid().'.txt');

    File::makeDirectory($themePath, 0755, true);
    File::put($outsidePath, 'Do not delete this file.');
    Setting::create(['key' => 'active_theme', 'value' => $slug]);

    try {
        $this->actingAs($user)
            ->deleteJson(route('admin.themes.delete-file'), [
                'path' => '../'.basename($outsidePath),
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('path');

        expect(File::exists($outsidePath))->toBeTrue();
    } finally {
        File::deleteDirectory($themePath);
        File::delete($outsidePath);
    }
});

it('provides forward slash paths for nested theme editor files', function () {
    $user = User::factory()->create();
    $slug = testThemeSlug();
    $themePath = base_path("themes/{$slug}");

    File::makeDirectory($themePath.'/views/templates', 0755, true);
    File::put($themePath.'/views/templates/page.blade.php', '<main></main>');
    Setting::create(['key' => 'active_theme', 'value' => $slug]);

    try {
        $this->actingAs($user)
            ->get(route('admin.themes.editor'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/themes/editor')
                ->where('file_tree', fn (Collection $tree) => $tree->contains(
                    fn (array $node) => $node['name'] === 'views'
                        && collect($node['children'])->contains(
                            fn (array $directory) => $directory['name'] === 'templates'
                                && collect($directory['children'])->contains(
                                    fn (array $file) => $file['path'] === 'views/templates/page.blade.php',
                                ),
                        ),
                )));
    } finally {
        File::deleteDirectory($themePath);
    }
});

it('rejects attempts to create theme files outside the selected theme directory', function () {
    $user = User::factory()->create();
    $slug = testThemeSlug();
    $themePath = base_path("themes/{$slug}");
    $outsidePath = base_path('theme-editor-'.Str::uuid().'.txt');

    File::makeDirectory($themePath, 0755, true);
    Setting::create(['key' => 'active_theme', 'value' => $slug]);

    try {
        $this->actingAs($user)
            ->postJson(route('admin.themes.create-file'), [
                'parent' => '../',
                'name' => basename($outsidePath),
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('parent');

        expect(file_exists($outsidePath))->toBeFalse();
    } finally {
        File::deleteDirectory($themePath);
        File::delete($outsidePath);
    }
});

it('rejects unsupported file extensions in the theme editor', function () {
    $user = User::factory()->create();
    $slug = testThemeSlug();
    $themePath = base_path("themes/{$slug}");

    File::makeDirectory($themePath, 0755, true);
    Setting::create(['key' => 'active_theme', 'value' => $slug]);

    try {
        $this->actingAs($user)
            ->postJson(route('admin.themes.create-file'), [
                'parent' => '',
                'name' => 'payload.exe',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('name');

        expect(File::exists($themePath.'/payload.exe'))->toBeFalse();
    } finally {
        File::deleteDirectory($themePath);
    }
});

it('requires authentication to install themes', function () {
    $this->post(route('admin.themes.upload'), [
        'theme' => UploadedFile::fake()->createWithContent('theme.zip', 'not a zip archive'),
    ])->assertRedirect(route('login'));
});

/**
 * @param  array<string, mixed>  $overrides
 * @return array<string, string>
 */
function themeFiles(string $slug, array $overrides = []): array
{
    $manifest = array_replace([
        'name' => 'Modern Shop',
        'slug' => $slug,
        'version' => '1.0.0',
        'author' => 'Degvora',
        'description' => 'A modern ecommerce theme',
        'requires' => ['degvoracms' => '>=1.0.0'],
    ], $overrides);

    return [
        $slug.'/theme.json' => json_encode($manifest, JSON_THROW_ON_ERROR),
        $slug.'/views/layouts/app.blade.php' => '<main>@yield("content")</main>',
        $slug.'/views/templates/page.blade.php' => '@extends("layouts.app")',
    ];
}

/**
 * @param  array<string, string>  $entries
 */
function makeThemeZip(array $entries): UploadedFile
{
    $archivePath = tempnam(sys_get_temp_dir(), 'theme-installer-');

    if ($archivePath === false) {
        throw new RuntimeException('Unable to create a temporary ZIP for the test.');
    }

    $archive = new ZipArchive;

    try {
        if ($archive->open($archivePath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new RuntimeException('Unable to open a temporary ZIP for the test.');
        }

        foreach ($entries as $path => $contents) {
            if (! $archive->addFromString($path, $contents)) {
                throw new RuntimeException('Unable to add a test entry to the ZIP archive.');
            }
        }

        $archive->close();
        $contents = file_get_contents($archivePath);

        if ($contents === false) {
            throw new RuntimeException('Unable to read the temporary test ZIP.');
        }

        return UploadedFile::fake()->createWithContent('theme.zip', $contents);
    } finally {
        if (file_exists($archivePath)) {
            unlink($archivePath);
        }
    }
}

function testThemeSlug(): string
{
    return 'test-'.Str::lower(Str::random(12));
}
