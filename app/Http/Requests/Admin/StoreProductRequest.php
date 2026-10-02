<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        foreach (['track_inventory', 'allow_backorder', 'requires_shipping', 'is_featured'] as $field) {
            $this->merge([$field => $this->boolean($field)]);
        }

        if ($this->input('gallery') === '') {
            $this->merge(['gallery' => []]);
        }
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'sku' => ['nullable', 'string', 'max:255', Rule::unique('products', 'sku')],
            'barcode' => ['nullable', 'string', 'max:255'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'short_description' => ['nullable', 'string', 'max:2000'],
            'product_type' => ['required', Rule::in(['physical', 'digital', 'service'])],
            'vendor' => ['nullable', 'string', 'max:255'],
            'brand' => ['nullable', 'string', 'max:255'],
            'condition' => ['required', Rule::in(['new', 'used', 'refurbished'])],
            'pricing_mode' => ['required', Rule::in(['single', 'variants'])],
            'price' => ['nullable', Rule::requiredIf($this->input('pricing_mode') === 'single'), 'numeric', 'min:0', 'max:9999999999.99'],
            'compare_at_price' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'cost_per_item' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'currency' => ['required', 'string', 'size:3', 'regex:/^[A-Z]{3}$/'],
            'main_image' => ['nullable', 'string', 'max:2048', 'exists:galleries,path'],
            'gallery' => ['nullable', 'array', 'max:30'],
            'gallery.*' => ['required', 'string', 'distinct', 'exists:galleries,path'],
            'track_inventory' => ['required', 'boolean'],
            'quantity' => ['required', 'integer', 'min:0'],
            'allow_backorder' => ['required', 'boolean'],
            'low_stock_threshold' => ['nullable', 'integer', 'min:0'],
            'requires_shipping' => ['required', 'boolean'],
            'weight' => ['nullable', 'numeric', 'min:0'],
            'weight_unit' => ['required', Rule::in(['kg', 'g', 'lb', 'oz'])],
            'length' => ['nullable', 'numeric', 'min:0'],
            'width' => ['nullable', 'numeric', 'min:0'],
            'height' => ['nullable', 'numeric', 'min:0'],
            'dimension_unit' => ['required', Rule::in(['cm', 'mm', 'in', 'ft'])],
            'is_featured' => ['required', 'boolean'],
            'sort_order' => ['required', 'integer', 'min:0'],
            'tags_text' => ['nullable', 'string', 'max:2000'],
            'variant_options_json' => ['nullable', 'json', 'max:1000000'],
            'variant_price_options_json' => ['nullable', 'json', 'max:5000'],
            'variant_items_json' => ['nullable', 'json', 'max:5000000'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:5000'],
            'canonical_url' => ['nullable', 'url', 'max:2048'],
            'og_title' => ['nullable', 'string', 'max:255'],
            'og_description' => ['nullable', 'string', 'max:5000'],
            'og_image' => ['nullable', 'string', 'max:2048', 'exists:galleries,path'],
            'robots' => ['required', Rule::in(['index,follow', 'noindex,follow', 'index,nofollow', 'noindex,nofollow'])],
            'status' => ['required', Rule::in(['draft', 'active', 'archived'])],
            'published_at' => ['nullable', 'date'],
            'metadata_json' => ['nullable', 'json', 'max:50000'],
        ];
    }

    /** @return array<int, callable> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($this->input('pricing_mode') !== 'variants'
                || $validator->errors()->hasAny(['variant_options_json', 'variant_items_json'])) {
                return;
            }

            $options = $this->decodedInput('variant_options_json');
            $items = $this->decodedInput('variant_items_json');

            if ($options === null || $items === null || count($options) < 1) {
                $validator->errors()->add('variant_options_json', __('Add at least one valid variation option.'));

                return;
            }

            $optionNames = [];
            $combinations = [[]];

            foreach ($options as $option) {
                if (! is_array($option)
                    || ! is_string($option['name'] ?? null)
                    || ! is_array($option['values'] ?? null)) {
                    $validator->errors()->add('variant_options_json', __('Each variation needs a name and at least one value.'));

                    return;
                }

                $name = trim($option['name']);
                $values = array_values(array_unique(array_filter(
                    array_map(static fn (mixed $value): string => is_string($value) ? trim($value) : '', $option['values']),
                )));

                if ($name === '' || in_array(mb_strtolower($name), $optionNames, true) || count($values) === 0) {
                    $validator->errors()->add('variant_options_json', __('Variation option names must be unique and each option needs values.'));

                    return;
                }

                $optionNames[] = mb_strtolower($name);
                $nextCombinations = [];

                foreach ($combinations as $combination) {
                    foreach ($values as $value) {
                        $nextCombinations[] = $combination + [$name => $value];

                    }
                }

                $combinations = $nextCombinations;
            }

            $requestedPriceOptions = $this->decodedInput('variant_price_options_json');
            $priceOptionNames = $requestedPriceOptions ?? array_map(
                static fn (array $option): string => $option['name'],
                $options,
            );
            $allowedPriceOptions = array_map(
                static fn (array $option): string => $option['name'],
                $options,
            );

            if (! array_is_list($priceOptionNames)
                || array_filter($priceOptionNames, static fn (mixed $name): bool => ! is_string($name)) !== []
                || count($priceOptionNames) !== count(array_unique($priceOptionNames))
                || array_diff($priceOptionNames, $allowedPriceOptions) !== []) {
                $validator->errors()->add('variant_price_options_json', __('Choose valid option dimensions that determine price.'));

                return;
            }

            if (count($items) !== count($combinations)) {
                $validator->errors()->add('variant_items_json', __('Every variation combination must have pricing and inventory details.'));

                return;
            }

            $expectedKeys = [];
            foreach ($combinations as $combination) {
                $expectedKeys[] = $this->combinationKey($combination, array_keys($combination));
            }

            $seenKeys = [];
            $seenSkus = [];
            $groupPrices = [];

            foreach ($items as $item) {
                if (! is_array($item) || ! is_array($item['options'] ?? null)) {
                    $validator->errors()->add('variant_items_json', __('Variation details are incomplete.'));

                    return;
                }

                $values = $item['options'];
                $key = $this->combinationKey($values, array_keys($combinations[0]));
                $price = $item['price'] ?? null;
                $compareAtPrice = $item['compare_at_price'] ?? null;
                $quantity = $item['quantity'] ?? null;
                $sku = $item['sku'] ?? null;

                if (! in_array($key, $expectedKeys, true)
                    || in_array($key, $seenKeys, true)
                    || ! is_numeric($price)
                    || (float) $price < 0
                    || ! is_numeric($quantity)
                    || (int) $quantity < 0
                    || (string) (int) $quantity !== (string) $quantity
                    || ($compareAtPrice !== null && (! is_numeric($compareAtPrice) || (float) $compareAtPrice < (float) $price))
                    || ($sku !== null && (! is_string($sku) || mb_strlen($sku) > 255))) {
                    $validator->errors()->add('variant_items_json', __('Each variation needs a valid price, quantity, and optional compare-at price or SKU.'));

                    return;
                }

                $normalizedSku = is_string($sku) ? mb_strtolower(trim($sku)) : '';
                if ($normalizedSku !== '' && in_array($normalizedSku, $seenSkus, true)) {
                    $validator->errors()->add('variant_items_json', __('Each variation SKU must be unique.'));

                    return;
                }

                $seenKeys[] = $key;
                $priceGroup = $this->combinationKey($values, $priceOptionNames);
                $priceSignature = number_format((float) $price, 2, '.', '').'|'.(
                    $compareAtPrice === null
                        ? ''
                        : number_format((float) $compareAtPrice, 2, '.', '')
                );
                if (isset($groupPrices[$priceGroup]) && $groupPrices[$priceGroup] !== $priceSignature) {
                    $validator->errors()->add('variant_items_json', __('Variations that share price options must use the same price and compare-at price.'));

                    return;
                }
                $groupPrices[$priceGroup] = $priceSignature;
                if ($normalizedSku !== '') {
                    $seenSkus[] = $normalizedSku;
                }
            }
        }];
    }

    /** @return array<string, mixed> */
    public function productData(): array
    {
        $validated = $this->validated();
        $tags = array_filter(array_map('trim', explode(',', $validated['tags_text'] ?? '')));

        $validated['tags'] = array_values(array_unique(array_slice($tags, 0, 50)));
        if ($validated['pricing_mode'] === 'variants') {
            $items = $this->decodeJson($validated['variant_items_json']);
            $prices = array_map(static fn (array $item): float => (float) $item['price'], $items ?? []);
            $compareAtPrices = array_values(array_filter(
                array_map(static fn (array $item): ?float => isset($item['compare_at_price']) ? (float) $item['compare_at_price'] : null, $items ?? []),
                static fn (?float $price): bool => $price !== null,
            ));

            $validated['variants'] = [
                'pricing_mode' => 'variants',
                'options' => $this->decodeJson($validated['variant_options_json']),
                'price_options' => $this->decodedInput('variant_price_options_json')
                    ?? array_column($this->decodeJson($validated['variant_options_json']) ?? [], 'name'),
                'items' => $items,
            ];
            $validated['price'] = $prices === []
                ? '0.00'
                : number_format(min($prices), 2, '.', '');
            $validated['compare_at_price'] = $compareAtPrices === []
                ? null
                : number_format(min($compareAtPrices), 2, '.', '');
            $validated['quantity'] = array_sum(array_map(static fn (array $item): int => (int) $item['quantity'], $items ?? []));
            $validated['sku'] = null;
        } else {
            $validated['variants'] = null;
        }
        $validated['metadata'] = $this->decodeJson($validated['metadata_json'] ?? null);
        unset(
            $validated['tags_text'],
            $validated['pricing_mode'],
            $validated['variant_options_json'],
            $validated['variant_price_options_json'],
            $validated['variant_items_json'],
            $validated['metadata_json'],
        );

        return $validated;
    }

    /** @param array<string, mixed> $values
     * @param  array<int, string>  $names
     */
    private function combinationKey(array $values, array $names): string
    {
        foreach ($names as $name) {
            if (! is_string($values[$name] ?? null)) {
                return '';
            }
        }

        return implode("\0", array_map(static fn (string $name): string => $values[$name], $names));
    }

    /** @return array<int, mixed>|null */
    private function decodedInput(string $key): ?array
    {
        $value = $this->input($key);

        return is_string($value) ? $this->decodeJson($value) : null;
    }

    /** @return array<mixed>|null */
    private function decodeJson(?string $value): ?array
    {
        if ($value === null || $value === '') {
            return null;
        }

        $decoded = json_decode($value, true);

        return is_array($decoded) ? $decoded : null;
    }
}
