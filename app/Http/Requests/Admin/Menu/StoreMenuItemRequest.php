<?php

namespace App\Http\Requests\Admin\Menu;

use Illuminate\Contracts\Validation\ValidationRule;

class StoreMenuItemRequest extends MenuItemRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->itemRules();
    }
}
