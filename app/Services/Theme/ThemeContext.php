<?php

namespace App\Services\Theme;

class ThemeContext
{
    public function products()
    {
        return app(ProductService::class);
    }
}