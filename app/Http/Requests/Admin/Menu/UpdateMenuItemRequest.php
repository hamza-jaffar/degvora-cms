<?php

namespace App\Http\Requests\Admin\Menu;

use App\Models\MenuItem;
use Illuminate\Contracts\Validation\ValidationRule;

class UpdateMenuItemRequest extends MenuItemRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $menuItem = $this->route('menuItem');

        return $this->itemRules($menuItem instanceof MenuItem ? $menuItem : null);
    }
}
