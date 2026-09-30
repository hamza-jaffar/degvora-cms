<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFileToGalleryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'files' => ['required', 'array', 'min:1'],
            'files.*' => Rule::forEach(function (mixed $file): array {
                $maxSize = $file instanceof UploadedFile
                    && str_starts_with($file->getMimeType(), 'video/')
                    ? 90 * 1024
                    : 10 * 1024;

                return [
                    'required',
                    'file',
                    'mimes:jpg,jpeg,png,gif,webp,pdf,doc,docx,mp4,mov,webm,avi,mkv',
                    'max:'.$maxSize,
                ];
            }),
        ];
    }
}
