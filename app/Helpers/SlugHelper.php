<?php

namespace App\Helpers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SlugHelper
{
    /**
     * Generate a URL-friendly slug from a string.
     */
    public static function make(string $value): string
    {
        return Str::slug($value);
    }

    /**
     * Generate a unique slug for a model/table.
     *
     * Example:
     * category-name
     * category-name-1
     * category-name-2
     */
    public static function unique(
        string $value,
        string $table,
        string $column = 'slug',
        ?int $ignoreId = null
    ): string {
        $slug = static::make($value);

        if ($slug === '') {
            $slug = 'item';
        }

        $originalSlug = $slug;
        $counter = 1;

        while (
            static::exists(
                table: $table,
                column: $column,
                slug: $slug,
                ignoreId: $ignoreId
            )
        ) {
            $slug = "{$originalSlug}-{$counter}";
            $counter++;
        }

        return $slug;
    }

    /**
     * Check whether a slug already exists.
     */
    public static function exists(
        string $table,
        string $column,
        string $slug,
        ?int $ignoreId = null
    ): bool {
        $query = \DB::table($table)
            ->where($column, $slug);

        if ($ignoreId !== null) {
            $query->where('id', '!=', $ignoreId);
        }

        return $query->exists();
    }

    /**
     * Generate a unique slug directly from a model.
     */
    public static function uniqueForModel(
        Model $model,
        string $value,
        string $column = 'slug'
    ): string {
        return static::unique(
            value: $value,
            table: $model->getTable(),
            column: $column,
            ignoreId: $model->exists ? $model->getKey() : null
        );
    }

    /**
     * Generate a unique slug from a model's name.
     */
    public static function fromName(
        Model $model,
        string $name,
        string $column = 'slug'
    ): string {
        return static::uniqueForModel(
            model: $model,
            value: $name,
            column: $column
        );
    }
}
