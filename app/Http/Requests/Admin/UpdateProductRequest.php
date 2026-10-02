<?php

namespace App\Http\Requests\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends StoreProductRequest
{
    public function rules(): array
    {
        $rules = parent::rules();
        $product = $this->route('product');
        $productId = $product instanceof Model
            ? $product->getKey()
            : $product;

        $rules['sku'] = [
            'nullable',
            'string',
            'max:255',
            Rule::unique('products', 'sku')->ignore($productId),
        ];

        return $rules;
    }
}
