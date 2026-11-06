<?php

namespace App\Http\Controllers;

use App\Models\Form;
use App\Models\FormSubmission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PublicFormSubmitController extends Controller
{
    public function submit(Request $request, Form $form): JsonResponse|RedirectResponse
    {
        if (! $form->is_active) {
            abort(404, 'This form is currently inactive.');
        }

        $fields = $form->fields ?? [];
        $rules = [];
        $customAttributes = [];

        foreach ($fields as $field) {
            $name = $field['name'] ?? null;
            if (! $name) {
                continue;
            }

            $fieldRules = [];
            $isRequired = (bool) ($field['required'] ?? false);

            if ($isRequired) {
                $fieldRules[] = 'required';
            } else {
                $fieldRules[] = 'nullable';
            }

            $type = $field['type'] ?? 'text';
            switch ($type) {
                case 'email':
                    $fieldRules[] = 'email';
                    $fieldRules[] = 'max:255';
                    break;
                case 'number':
                    $fieldRules[] = 'numeric';
                    break;
                case 'tel':
                    $fieldRules[] = 'string';
                    $fieldRules[] = 'max:50';
                    break;
                case 'textarea':
                    $fieldRules[] = 'string';
                    $fieldRules[] = 'max:5000';
                    break;
                case 'select':
                case 'radio':
                    $fieldRules[] = 'string';
                    if (! empty($field['options']) && is_array($field['options'])) {
                        $fieldRules[] = Rule::in($field['options']);
                    }
                    break;
                case 'checkbox':
                    // Checkbox could be array or boolean/string
                    break;
                case 'date':
                    $fieldRules[] = 'date';
                    break;
                default:
                    $fieldRules[] = 'string';
                    $fieldRules[] = 'max:500';
                    break;
            }

            $rules[$name] = $fieldRules;
            $customAttributes[$name] = $field['label'] ?? $name;
        }

        $validated = $request->validate($rules, [], $customAttributes);

        $submission = FormSubmission::create([
            'form_id' => $form->id,
            'data' => $validated,
            'status' => 'unread',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'is_starred' => false,
        ]);

        if (! empty($form->notification_email)) {
            try {
                $recipient = $form->notification_email;
                $subject = "New submission for: {$form->name}";
                $body = "You have received a new submission for {$form->name}:\n\n";

                foreach ($fields as $field) {
                    $val = $validated[$field['name']] ?? '—';
                    if (is_array($val)) {
                        $val = implode(', ', $val);
                    }
                    $body .= ($field['label'] ?? $field['name']).": {$val}\n";
                }

                $body .= "\nSubmitted at: ".now()->format('Y-m-d H:i:s');
                $body .= "\nIP Address: ".($request->ip() ?? 'N/A');

                Mail::raw($body, function ($message) use ($recipient, $subject): void {
                    $message->to($recipient)->subject($subject);
                });
            } catch (\Throwable $e) {
                Log::warning('Form notification email failed to send: '.$e->getMessage(), [
                    'form_id' => $form->id,
                    'submission_id' => $submission->id,
                ]);
            }
        }

        $successMessage = $form->success_message ?: 'Thank you! Your submission has been received.';

        if ($request->expectsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => $successMessage,
                'submission_id' => $submission->id,
            ]);
        }

        session()->flash('form_success', $successMessage);
        session()->flash('form_slug', $form->slug);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $successMessage,
        ]);

        return back()->with('form_success', $successMessage);
    }
}
