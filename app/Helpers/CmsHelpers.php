<?php

if (! function_exists('gallery')) {
    function gallery(?string $path): string
    {
        if (empty($path)) {
            return '';
        }

        $storage = '/storage/'.$path;

        return asset(ltrim($storage, '/'));
    }
}

if (! function_exists('stylesheet')) {
    function stylesheet(?string $path): string
    {
        if (empty($path)) {
            return '';
        }

        return route('theme.stylesheet', ['stylesheet' => $path]);
    }
}
