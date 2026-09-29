<?php

namespace App\Http\Controllers\Admin;

use App\Helpers\FileHelper;
use App\Http\Controllers\Controller;
use App\Models\Gallery;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class GalleryController extends Controller
{
    public function index(Request $request): Response
    {
        $requestedFilter = $request->query('filter', 'all');
        $filter = is_string($requestedFilter)
            && in_array($requestedFilter, ['all', 'image', 'video', 'other'], true)
                ? $requestedFilter
                : 'all';

        $query = Gallery::query();

        match ($filter) {
            'image' => $query->where('mime_type', 'like', 'image/%'),
            'video' => $query->where('mime_type', 'like', 'video/%'),
            'other' => $query->where('mime_type', 'not like', 'image/%')
                ->where('mime_type', 'not like', 'video/%'),
            default => null,
        };

        $counts = [
            'all' => Gallery::query()->count(),
            'image' => Gallery::query()->where('mime_type', 'like', 'image/%')->count(),
            'video' => Gallery::query()->where('mime_type', 'like', 'video/%')->count(),
            'other' => Gallery::query()
                ->where('mime_type', 'not like', 'image/%')
                ->where('mime_type', 'not like', 'video/%')
                ->count(),
        ];

        return inertia('admin/gallery/index', [
            'media' => Inertia::scroll(fn () => $query
                ->latest()
                ->paginate(24)
                ->through(fn (Gallery $asset): array => $this->serializeMedia($asset))),
            'counts' => $counts,
            'filter' => $filter,
        ]);
    }

    public function upload(Request $request): RedirectResponse
    {
        $validated = $request->validate([
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
        ]);

        foreach ($validated['files'] as $file) {
            if (FileHelper::upload($file) === null) {
                return back()->withErrors(['files' => 'A file could not be stored.']);
            }
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('File Uploaded Successfully.')]);

        return to_route('admin.gallery.index');
    }

    public function destroy(Gallery $gallery): RedirectResponse
    {
        if (! FileHelper::delete($gallery)) {
            return back()->withErrors(['file' => __('The file could not be deleted.')]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('File Deleted Successfully.')]);

        return back();
    }

    /**
     * @return array<string, int|string|null>
     */
    private function serializeMedia(Gallery $asset): array
    {
        $type = match (true) {
            str_starts_with($asset->mime_type, 'image/') => 'image',
            str_starts_with($asset->mime_type, 'video/') => 'video',
            default => 'other',
        };

        return [
            'id' => $asset->id,
            'name' => $asset->original_name,
            'alt' => $asset->alt,
            'type' => $type,
            'mimeType' => $asset->mime_type,
            'url' => Storage::disk($asset->disk)->url($asset->path),
            'size' => (int) $asset->size,
            'width' => (int) $asset->width,
            'height' => (int) $asset->height,
            'createdAt' => $asset->created_at?->toIso8601String(),
        ];
    }
}
