<?php

namespace App\Helpers;

use App\Models\Gallery;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class FileHelper
{
    public static function upload(UploadedFile $file): ?Gallery
    {
        $disk = 'public';
        $path = $file->store('gallery', $disk);

        if ($path === false) {
            return null;
        }

        $dimensions = str_starts_with($file->getMimeType(), 'image/')
            ? getimagesize($file->getRealPath())
            : false;

        return Gallery::create([
            'disk' => $disk,
            'filename' => basename($path),
            'original_name' => $file->getClientOriginalName(),
            'path' => $path,
            'mime_type' => $file->getMimeType(),
            'alt' => $file->getClientOriginalName(),
            'size' => (string) $file->getSize(),
            'width' => (string) ($dimensions[0] ?? 0),
            'height' => (string) ($dimensions[1] ?? 0),
        ]);
    }

    public static function delete(Gallery $gallery): bool
    {
        if (! Storage::disk($gallery->disk)->delete($gallery->path)) {
            return false;
        }

        return (bool) $gallery->delete();
    }
}
