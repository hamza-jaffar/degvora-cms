<?php

namespace App\Services\Theme\DataManager;

use App\Models\Setting;

class SettingService
{
    public function get(string $key)
    {
        return Setting::where('key', $key)->first();
    }
}
