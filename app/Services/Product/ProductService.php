<?php

namespace App\Services\Theme;

use App\Models\Products;

class ProductService
{
    public function latest(int $limit = 8)
    {
        return Products::query()
            ->where('status', 'published')
            ->latest()->limit($limit)->get();
    }

    public function find(string $slug)
    {
        return Products::query()
            ->where('slug', $slug)
            ->where('status', 'published')
            ->first();
    }
}
