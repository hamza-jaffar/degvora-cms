<?php

use App\Models\Form;
use App\Models\FormSubmission;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

it('displays the forms tab on the site settings page', function () {
    $user = User::factory()->create();
    $form = Form::factory()->create(['name' => 'Contact Us', 'slug' => 'contact-us']);
    FormSubmission::factory()->count(3)->create(['form_id' => $form->id]);

    $this->actingAs($user)
        ->get(route('admin.setting.index', ['active_tab' => 'forms']))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('admin/setting/index')
            ->has('forms', 1)
            ->where('forms.0.name', 'Contact Us')
            ->where('forms.0.submissions_count', 3));
});

it('creates a custom form with dynamic fields', function () {
    $user = User::factory()->create();

    $payload = [
        'name' => 'Access Request',
        'slug' => 'access',
        'description' => 'Request portal access form',
        'is_active' => true,
        'submit_button_text' => 'Submit Request',
        'success_message' => 'Your access request has been submitted.',
        'notification_email' => 'admin@example.com',
        'fields' => [
            [
                'id' => 'f1',
                'name' => 'full_name',
                'label' => 'Full Name',
                'type' => 'text',
                'required' => true,
                'width' => 'half',
            ],
            [
                'id' => 'f2',
                'name' => 'email',
                'label' => 'Work Email',
                'type' => 'email',
                'required' => true,
                'width' => 'half',
            ],
            [
                'id' => 'f3',
                'name' => 'company',
                'label' => 'Company Name',
                'type' => 'text',
                'required' => false,
                'width' => 'full',
            ],
        ],
    ];

    $this->actingAs($user)
        ->post(route('admin.forms.store'), $payload)
        ->assertRedirect(route('admin.setting.index', ['active_tab' => 'forms']));

    $this->assertDatabaseHas('forms', [
        'name' => 'Access Request',
        'slug' => 'access',
        'is_active' => 1,
        'notification_email' => 'admin@example.com',
    ]);

    $created = Form::where('slug', 'access')->first();
    expect($created)->not->toBeNull()
        ->and($created->fields)->toHaveCount(3)
        ->and($created->fields[0]['name'])->toBe('full_name');
});

it('updates an existing form configuration', function () {
    $user = User::factory()->create();
    $form = Form::factory()->create(['name' => 'Old Name', 'slug' => 'old-name']);

    $payload = [
        'name' => 'Updated Claim Form',
        'slug' => 'old-name',
        'description' => 'Updated instructions',
        'is_active' => true,
        'submit_button_text' => 'File Claim',
        'success_message' => 'Claim submitted.',
        'fields' => [
            [
                'id' => 'f_claim',
                'name' => 'claim_id',
                'label' => 'Claim Number',
                'type' => 'text',
                'required' => true,
            ],
        ],
    ];

    $this->actingAs($user)
        ->put(route('admin.forms.update', $form->slug), $payload)
        ->assertRedirect(route('admin.setting.index', ['active_tab' => 'forms']));

    $form->refresh();
    expect($form->name)->toBe('Updated Claim Form')
        ->and($form->fields)->toHaveCount(1)
        ->and($form->fields[0]['name'])->toBe('claim_id');
});

it('toggles form active status', function () {
    $user = User::factory()->create();
    $form = Form::factory()->create(['is_active' => true]);

    $this->actingAs($user)
        ->post(route('admin.forms.toggle', $form->slug))
        ->assertRedirect();

    expect($form->fresh()->is_active)->toBeFalse();

    $this->actingAs($user)
        ->post(route('admin.forms.toggle', $form->slug))
        ->assertRedirect();

    expect($form->fresh()->is_active)->toBeTrue();
});

it('deletes a form', function () {
    $user = User::factory()->create();
    $form = Form::factory()->create(['slug' => 'test-delete']);

    $this->actingAs($user)
        ->delete(route('admin.forms.destroy', $form->slug))
        ->assertRedirect(route('admin.setting.index', ['active_tab' => 'forms']));

    $this->assertSoftDeleted('forms', ['id' => $form->id]);
});

it('accepts public submissions and validates required fields dynamically', function () {
    $form = Form::factory()->create([
        'slug' => 'contact-us',
        'is_active' => true,
        'fields' => [
            [
                'id' => 'f1',
                'name' => 'name',
                'label' => 'Your Name',
                'type' => 'text',
                'required' => true,
            ],
            [
                'id' => 'f2',
                'name' => 'email',
                'label' => 'Your Email',
                'type' => 'email',
                'required' => true,
            ],
            [
                'id' => 'f3',
                'name' => 'message',
                'label' => 'Message',
                'type' => 'textarea',
                'required' => false,
            ],
        ],
    ]);

    // Validation failure (missing required email)
    $this->postJson(route('forms.submit', $form->slug), [
        'name' => 'John Doe',
        'email' => '',
    ])->assertStatus(422)
        ->assertJsonValidationErrors(['email']);

    // Successful submission
    $response = $this->postJson(route('forms.submit', $form->slug), [
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'message' => 'Hello team!',
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
        ]);

    $this->assertDatabaseHas('form_submissions', [
        'form_id' => $form->id,
        'status' => 'unread',
    ]);

    $submission = FormSubmission::where('form_id', $form->id)->first();
    expect($submission->data['name'])->toBe('John Doe')
        ->and($submission->data['email'])->toBe('john@example.com')
        ->and($submission->data['message'])->toBe('Hello team!');
});

it('blocks public submission if form is disabled', function () {
    $form = Form::factory()->inactive()->create(['slug' => 'inactive-form']);

    $this->postJson(route('forms.submit', $form->slug), [
        'name' => 'Test',
    ])->assertNotFound();
});

it('displays the submissions index page for an individual form with filters', function () {
    $user = User::factory()->create();
    $form = Form::factory()->create(['name' => 'Claims', 'slug' => 'claims']);

    FormSubmission::factory()->create([
        'form_id' => $form->id,
        'status' => 'unread',
        'data' => ['name' => 'Unread Customer', 'email' => 'customer@test.com'],
    ]);

    FormSubmission::factory()->create([
        'form_id' => $form->id,
        'status' => 'read',
        'data' => ['name' => 'Read Customer', 'email' => 'read@test.com'],
    ]);

    $this->actingAs($user)
        ->get(route('admin.forms.submissions.index', $form->slug))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('admin/forms/submissions')
            ->where('form.slug', 'claims')
            ->has('submissions.data', 2)
            ->where('stats.unread', 1)
            ->where('stats.read', 1));

    // Filter by unread
    $this->actingAs($user)
        ->get(route('admin.forms.submissions.index', ['form' => $form->slug, 'status' => 'unread']))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('admin/forms/submissions')
            ->has('submissions.data', 1)
            ->where('submissions.data.0.status', 'unread'));
});

it('updates submission status and toggles star', function () {
    $user = User::factory()->create();
    $form = Form::factory()->create(['slug' => 'test-form']);
    $submission = FormSubmission::factory()->create([
        'form_id' => $form->id,
        'status' => 'unread',
        'is_starred' => false,
    ]);

    // Update status to read
    $this->actingAs($user)
        ->patch(route('admin.forms.submissions.status', ['form' => $form->slug, 'submission' => $submission->id]), [
            'status' => 'read',
        ])
        ->assertRedirect();

    expect($submission->fresh()->status)->toBe('read');

    // Toggle star
    $this->actingAs($user)
        ->post(route('admin.forms.submissions.star', ['form' => $form->slug, 'submission' => $submission->id]))
        ->assertRedirect();

    expect($submission->fresh()->is_starred)->toBeTrue();
});

it('handles bulk submission actions', function () {
    $user = User::factory()->create();
    $form = Form::factory()->create(['slug' => 'bulk-form']);
    $s1 = FormSubmission::factory()->create(['form_id' => $form->id, 'status' => 'unread']);
    $s2 = FormSubmission::factory()->create(['form_id' => $form->id, 'status' => 'unread']);

    $this->actingAs($user)
        ->post(route('admin.forms.submissions.bulk', $form->slug), [
            'action' => 'mark_read',
            'ids' => [$s1->id, $s2->id],
        ])
        ->assertRedirect();

    expect($s1->fresh()->status)->toBe('read')
        ->and($s2->fresh()->status)->toBe('read');

    // Bulk delete
    $this->actingAs($user)
        ->post(route('admin.forms.submissions.bulk', $form->slug), [
            'action' => 'delete',
            'ids' => [$s1->id],
        ])
        ->assertRedirect();

    $this->assertSoftDeleted('form_submissions', ['id' => $s1->id]);
});

it('shares only active forms in inertia navForms prop for sidebar navigation', function () {
    $user = User::factory()->create();

    Form::factory()->create(['name' => 'Contact Us', 'slug' => 'contact-us', 'is_active' => true]);
    Form::factory()->create(['name' => 'Access Request', 'slug' => 'access', 'is_active' => true]);
    Form::factory()->create(['name' => 'Claim Form', 'slug' => 'claim', 'is_active' => true]);
    Form::factory()->inactive()->create(['name' => 'Disabled Form', 'slug' => 'disabled-form']);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('navForms', 3)
            ->where('navForms.0.slug', 'access')
            ->where('navForms.1.slug', 'claim')
            ->where('navForms.2.slug', 'contact-us'));
});
