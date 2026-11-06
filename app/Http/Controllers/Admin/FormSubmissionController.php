<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Form;
use App\Models\FormSubmission;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FormSubmissionController extends Controller
{
    public function index(Request $request, Form $form): Response
    {
        $perPage = (int) $request->query('per_page', 10);
        $perPage = in_array($perPage, [10, 25, 50, 100], true) ? $perPage : 10;

        $filters = [
            'search' => trim((string) $request->query('search', '')),
            'status' => trim((string) $request->query('status', '')),
            'sort' => in_array($request->query('sort'), ['created_at', 'status'], true)
                ? (string) $request->query('sort')
                : 'created_at',
            'direction' => strtolower((string) $request->query('direction', 'desc')) === 'asc' ? 'asc' : 'desc',
            'per_page' => $perPage,
        ];

        $query = FormSubmission::query()->where('form_id', $form->id);

        $query
            ->when($filters['search'] !== '', function (Builder $builder) use ($filters): void {
                $search = '%'.$filters['search'].'%';
                $builder->where(function (Builder $nested) use ($search): void {
                    $nested->where('data', 'like', $search)
                        ->orWhere('ip_address', 'like', $search);
                });
            })
            ->when($filters['status'] !== '', function (Builder $builder) use ($filters): void {
                $builder->where('status', $filters['status']);
            });

        $submissions = $query
            ->orderBy($filters['sort'], $filters['direction'])
            ->paginate($perPage)
            ->withQueryString();

        $stats = [
            'total' => FormSubmission::query()->where('form_id', $form->id)->count(),
            'unread' => FormSubmission::query()->where('form_id', $form->id)->where('status', 'unread')->count(),
            'read' => FormSubmission::query()->where('form_id', $form->id)->where('status', 'read')->count(),
            'archived' => FormSubmission::query()->where('form_id', $form->id)->where('status', 'archived')->count(),
            'spam' => FormSubmission::query()->where('form_id', $form->id)->where('status', 'spam')->count(),
        ];

        return Inertia::render('admin/forms/submissions', [
            'form' => $form,
            'submissions' => $submissions,
            'filters' => $filters,
            'stats' => $stats,
        ]);
    }

    public function updateStatus(Request $request, Form $form, FormSubmission $submission): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:unread,read,archived,spam'],
        ]);

        $submission->update(['status' => $validated['status']]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Submission status updated.',
        ]);

        return back();
    }

    public function toggleStar(Form $form, FormSubmission $submission): RedirectResponse
    {
        $submission->update(['is_starred' => ! $submission->is_starred]);

        return back();
    }

    public function destroy(Form $form, FormSubmission $submission): RedirectResponse
    {
        $submission->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Submission deleted.',
        ]);

        return back();
    }

    public function bulk(Request $request, Form $form): RedirectResponse
    {
        $validated = $request->validate([
            'action' => ['required', 'string', 'in:delete,mark_read,mark_unread,archive,mark_spam'],
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer'],
        ]);

        $query = FormSubmission::query()
            ->where('form_id', $form->id)
            ->whereIn('id', $validated['ids']);

        switch ($validated['action']) {
            case 'delete':
                $query->delete();
                $message = 'Selected submissions have been deleted.';
                break;
            case 'mark_read':
                $query->update(['status' => 'read']);
                $message = 'Selected submissions marked as read.';
                break;
            case 'mark_unread':
                $query->update(['status' => 'unread']);
                $message = 'Selected submissions marked as unread.';
                break;
            case 'archive':
                $query->update(['status' => 'archived']);
                $message = 'Selected submissions archived.';
                break;
            case 'mark_spam':
                $query->update(['status' => 'spam']);
                $message = 'Selected submissions marked as spam.';
                break;
            default:
                $message = 'Bulk operation completed.';
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $message,
        ]);

        return back();
    }

    public function exportCsv(Form $form): StreamedResponse
    {
        $fileName = "{$form->slug}-submissions-".now()->format('Y-m-d').'.csv';

        return response()->streamDownload(function () use ($form): void {
            $handle = fopen('php://output', 'w');

            $fields = $form->fields ?? [];
            $headers = ['ID', 'Date', 'Status', 'Starred', 'IP Address'];

            foreach ($fields as $field) {
                $headers[] = $field['label'] ?? $field['name'];
            }

            fputcsv($handle, $headers);

            FormSubmission::query()
                ->where('form_id', $form->id)
                ->orderBy('created_at', 'desc')
                ->chunk(100, function ($submissions) use ($handle, $fields): void {
                    foreach ($submissions as $sub) {
                        $row = [
                            $sub->id,
                            $sub->created_at->format('Y-m-d H:i:s'),
                            $sub->status,
                            $sub->is_starred ? 'Yes' : 'No',
                            $sub->ip_address ?? '',
                        ];

                        $data = $sub->data ?? [];
                        foreach ($fields as $field) {
                            $val = $data[$field['name']] ?? '';
                            if (is_array($val)) {
                                $val = implode(', ', $val);
                            }
                            $row[] = (string) $val;
                        }

                        fputcsv($handle, $row);
                    }
                });

            fclose($handle);
        }, $fileName, [
            'Content-Type' => 'text/csv',
        ]);
    }
}
