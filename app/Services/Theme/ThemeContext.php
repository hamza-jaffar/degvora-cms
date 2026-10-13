<?php

namespace App\Services\Theme;

use App\Services\Theme\DataManager\MenuService;
use App\Services\Theme\DataManager\SettingService;

class ThemeContext
{
    public function menu(): MenuService
    {
        return app(MenuService::class);
    }

    public function setting(): SettingService
    {
        return app(SettingService::class);
    }
}
