<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable('name', 'slug', 'path', 'excerpt', 'content', 'parent_id', 'meta_title', 'meta_description', 'canonical_url', 'robots', 'status', 'visibility', 'password', 'published_at', 'template', 'sort_order', 'is_featured', 'featured_media')]
class Page extends Model
{
    use SoftDeletes;

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function parent()
    {
        return $this->belongsTo(Page::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Page::class, 'parent_id');
    }
}
