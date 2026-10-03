<?php

namespace App\Http\Requests\Admin\Menu;

use App\Models\Menu;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReorderMenuItemsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $menu = $this->route('menu');
        $menuId = $menu instanceof Menu ? $menu->id : 0;

        return [
            'items' => ['required', 'array'],
            'items.*.id' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('menu_items', 'id')->where('menu_id', $menuId),
            ],
            'items.*.parent_id' => [
                'nullable',
                'integer',
                Rule::exists('menu_items', 'id')->where('menu_id', $menuId),
            ],
            'items.*.sort_order' => ['required', 'integer', 'min:0'],
        ];
    }
}
