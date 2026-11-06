<?php

namespace App\Http\Requests\Admin\Form;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class StoreFormRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $slug = $this->input('slug') ? Str::slug($this->input('slug')) : Str::slug($this->input('name') ?? '');

        $this->merge([
            'slug' => $slug,
            'is_active' => $this->boolean('is_active', true),
        ]);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/', Rule::unique('forms', 'slug')],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['required', 'boolean'],
            'submit_button_text' => ['nullable', 'string', 'max:100'],
            'success_message' => ['nullable', 'string', 'max:1000'],
            'notification_email' => ['nullable', 'email', 'max:255'],
            'fields' => ['required', 'array', 'min:1'],
            'fields.*.id' => ['required', 'string'],
            'fields.*.name' => ['required', 'string', 'max:100', 'regex:/^[a-zA-Z0-9_]+$/'],
            'fields.*.label' => ['required', 'string', 'max:255'],
            'fields.*.type' => ['required', Rule::in(['text', 'email', 'tel', 'number', 'textarea', 'select', 'radio', 'checkbox', 'date'])],
            'fields.*.placeholder' => ['nullable', 'string', 'max:255'],
            'fields.*.help_text' => ['nullable', 'string', 'max:255'],
            'fields.*.required' => ['required', 'boolean'],
            'fields.*.options' => ['nullable', 'array'],
            'fields.*.options.*' => ['string', 'max:255'],
            'fields.*.width' => ['nullable', Rule::in(['full', 'half'])],
        ];
    }
}
