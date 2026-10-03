<?php

namespace App\Http\Requests\Admin\Menu;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMenuRequest extends FormRequest
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

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('menus', 'name')->ignore($menu),
            ],
            'location' => ['nullable', 'string', 'max:255'],
        ];
    }
}
