<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'title',
    'slug',
    'excerpt',
    'content',
    'featured_image',
    'category_id',
    'author_id',
    'tags',
    'is_featured',
    'status',
    'visibility',
    'password',
    'published_at',
    'scheduled_at',
    'meta_title',
    'meta_description',
    'canonical_url',
    'og_title',
    'og_description',
    'og_image',
    'robots',
])]
class Post extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'posts';

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    protected function casts(): array
    {
        return [
            'tags' => 'array',
            'is_featured' => 'boolean',
            'published_at' => 'datetime',
            'scheduled_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Category, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    /**
     * Scope for published posts.
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published')
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    /**
     * Scope for featured posts.
     */
    public function scopeFeatured(Builder $query): Builder
    {
        return $query->where('is_featured', true);
    }
}
