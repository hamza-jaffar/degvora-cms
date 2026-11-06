<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Form\StoreFormRequest;
use App\Http\Requests\Admin\Form\UpdateFormRequest;
use App\Models\Form;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class FormController extends Controller
{
    public function store(StoreFormRequest $request): RedirectResponse
    {
        $form = Form::create($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Form '{$form->name}' has been created successfully.",
        ]);

        return redirect()->route('admin.setting.index', ['active_tab' => 'forms']);
    }

    public function update(UpdateFormRequest $request, Form $form): RedirectResponse
    {
        $form->update($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Form '{$form->name}' has been updated successfully.",
        ]);

        return redirect()->route('admin.setting.index', ['active_tab' => 'forms']);
    }

    public function toggleStatus(Form $form): RedirectResponse
    {
        $form->update([
            'is_active' => ! $form->is_active,
        ]);

        $statusLabel = $form->is_active ? 'enabled' : 'disabled';

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Form '{$form->name}' is now {$statusLabel}.",
        ]);

        return back();
    }

    public function destroy(Form $form): RedirectResponse
    {
        $name = $form->name;
        $form->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Form '{$name}' has been deleted.",
        ]);

        return redirect()->route('admin.setting.index', ['active_tab' => 'forms']);
    }
}
