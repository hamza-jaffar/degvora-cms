<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;

class ThemeInstallRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'theme' => ['required', 'file', 'extensions:zip', 'max:51200'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'theme.required' => 'Choose a theme ZIP file to upload.',
            'theme.file' => 'The uploaded file must be a ZIP archive.',
            'theme.extensions' => 'The uploaded file must be a ZIP archive.',
            'theme.max' => 'The theme ZIP file may not be larger than 50 MB.',
        ];
    }

    public function uploadedTheme(): UploadedFile
    {
        $file = $this->file('theme');

        if (! $file instanceof UploadedFile) {
            throw ValidationException::withMessages([
                'theme' => 'The uploaded file must be a ZIP archive.',
            ]);
        }

        return $file;
    }
}
