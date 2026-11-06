<?php

use App\Models\Form;
use App\Models\FormSubmission;
use App\Models\Page;
use App\Models\Setting;
use App\Models\User;
use Database\Seeders\FormsSeeder;
use Inertia\Testing\AssertableInertia;

beforeEach(function () {
    $this->seed(FormsSeeder::class);
});

it('submits contact form successfully via json/ajax and stores submission in database', function () {
    $payload = [
        'first_name' => 'John',
        'last_name' => 'Doe',
        'email' => 'john.doe@example.com',
        'phone' => '+971 50 123 4567',
        'service_type' => 'Moving & Storage',
        'how_did_you_hear' => 'Google Search',
        'message' => 'Need 2-bedroom villa moving in Dubai next week.',
        'marketing_consent' => 'I consent to receiving marketing communications from Easytruck.',
    ];

    $response = $this->postJson(route('forms.submit', ['form' => 'contact']), $payload);

    $response->assertOk()
        ->assertJson([
            'success' => true,
        ]);

    $this->assertDatabaseHas('form_submissions', [
        'form_id' => Form::where('slug', 'contact')->first()->id,
        'status' => 'unread',
    ]);

    $submission = FormSubmission::latest('id')->first();
    expect($submission->data['first_name'])->toBe('John')
        ->and($submission->data['email'])->toBe('john.doe@example.com')
        ->and($submission->data['service_type'])->toBe('Moving & Storage');
});

it('submits contact form via standard web post and redirects back with session flash', function () {
    $payload = [
        'first_name' => 'Jane',
        'last_name' => 'Smith',
        'email' => 'jane.smith@example.com',
        'phone' => '+971 55 987 6543',
        'service_type' => 'Storage',
    ];

    $response = $this->from(url('/contact'))->post(route('forms.submit', ['form' => 'contact']), $payload);

    $response->assertRedirect(url('/contact'))
        ->assertSessionHas('form_success');

    $this->assertDatabaseHas('form_submissions', [
        'form_id' => Form::where('slug', 'contact')->first()->id,
    ]);
});

it('submits access form successfully and stores in database', function () {
    $payload = [
        'full_name' => 'Ahmed Al-Mansoor',
        'phone' => '+971 52 333 4444',
        'email' => 'ahmed@example.com',
        'emirates_id' => '784-1990-1234567-1',
        'warehouse_location' => 'The Easytruck Warehouse (Al Quoz)',
        'access_date' => date('Y-m-d', strtotime('+2 days')),
        'access_time' => '10:00 A.M.',
        'have_keys' => 'Yes - I have keys',
        'hire_crew' => 'Yes - 1 Hour (AED 100)',
        'pod_numbers' => 'POD #4081',
        'additional_info' => 'Will retrieve winter clothes and camping gear.',
    ];

    $response = $this->postJson(route('forms.submit', ['form' => 'access']), $payload);

    $response->assertOk()
        ->assertJson(['success' => true]);

    $this->assertDatabaseHas('form_submissions', [
        'form_id' => Form::where('slug', 'access')->first()->id,
        'status' => 'unread',
    ]);

    $submission = FormSubmission::latest('id')->first();
    expect($submission->data['emirates_id'])->toBe('784-1990-1234567-1')
        ->and($submission->data['pod_numbers'])->toBe('POD #4081');
});

it('submits claims form successfully and stores in database', function () {
    $payload = [
        'full_name' => 'Sarah Connor',
        'claim_date' => date('Y-m-d'),
        'phone' => '+971 50 888 9999',
        'email' => 'sarah@example.com',
        'move_date' => date('Y-m-d', strtotime('-5 days')),
        'origin_address' => 'Dubai Marina, Silverene Tower',
        'destination_address' => 'Downtown Dubai, Boulevard Crescent',
        'items_affected' => 'Wooden Coffee Table',
        'damage_description' => 'Scratches on top surface during transport.',
        'claimed_value' => '1200',
        'invoice_reference' => 'INV-2026-089',
        'additional_info' => 'Photos taken at delivery.',
        'customer_signature' => 'Sarah Connor',
    ];

    $response = $this->postJson(route('forms.submit', ['form' => 'claims']), $payload);

    $response->assertOk()
        ->assertJson(['success' => true]);

    $this->assertDatabaseHas('form_submissions', [
        'form_id' => Form::where('slug', 'claims')->first()->id,
        'status' => 'unread',
    ]);

    $submission = FormSubmission::latest('id')->first();
    expect($submission->data['items_affected'])->toBe('Wooden Coffee Table')
        ->and($submission->data['customer_signature'])->toBe('Sarah Connor');
});

it('submits partner form successfully and stores in database', function () {
    $payload = [
        'first_name' => 'Michael',
        'last_name' => 'Vance',
        'email' => 'michael.vance@globalmovers.com',
        'phone' => '+44 20 7946 0958',
        'country_of_origin' => 'United Kingdom',
        'volume' => '30 cbm / 1x 20ft Container',
        'shipment_date' => date('Y-m-d', strtotime('+3 weeks')),
    ];

    $response = $this->postJson(route('forms.submit', ['form' => 'partner']), $payload);

    $response->assertOk()
        ->assertJson(['success' => true]);

    $this->assertDatabaseHas('form_submissions', [
        'form_id' => Form::where('slug', 'partner')->first()->id,
        'status' => 'unread',
    ]);

    $submission = FormSubmission::latest('id')->first();
    expect($submission->data['first_name'])->toBe('Michael')
        ->and($submission->data['country_of_origin'])->toBe('United Kingdom')
        ->and($submission->data['volume'])->toBe('30 cbm / 1x 20ft Container');
});

it('submits booking form successfully and stores in database', function () {
    $payload = [
        'service_type' => 'Moving',
        'first_name' => 'Rashid',
        'last_name' => 'Al Nuaimi',
        'email' => 'rashid@example.com',
        'phone' => '+971 50 765 4321',
        'moving_date' => date('Y-m-d', strtotime('+10 days')),
        'property_size' => '2 Bedrooms',
        'pickup_address' => 'Downtown Dubai, Standpoint Tower 1',
        'destination_address' => 'Dubai Hills Estate, Park Heights 2',
        'furnished_level' => 'Fully Furnished',
        'how_did_you_hear' => 'Google Search',
        'notes' => 'Please bring hanging clothes boxes and bubble wrap for large TV.',
    ];

    $response = $this->postJson(route('forms.submit', ['form' => 'booking']), $payload);

    $response->assertOk()
        ->assertJson(['success' => true]);

    $this->assertDatabaseHas('form_submissions', [
        'form_id' => Form::where('slug', 'booking')->first()->id,
        'status' => 'unread',
    ]);

    $submission = FormSubmission::latest('id')->first();
    expect($submission->data['first_name'])->toBe('Rashid')
        ->and($submission->data['service_type'])->toBe('Moving')
        ->and($submission->data['pickup_address'])->toBe('Downtown Dubai, Standpoint Tower 1');
});

it('fails validation when required fields are missing on contact form', function () {
    $response = $this->postJson(route('forms.submit', ['form' => 'contact']), [
        'first_name' => '',
        'email' => 'invalid-email',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['first_name', 'last_name', 'email', 'phone', 'service_type']);
});

it('allows admin to view form submissions in the dashboard', function () {
    $user = User::factory()->create();
    $form = Form::where('slug', 'contact')->first();

    FormSubmission::create([
        'form_id' => $form->id,
        'data' => [
            'first_name' => 'Customer',
            'last_name' => 'One',
            'email' => 'cust1@example.com',
            'phone' => '+971501112222',
            'service_type' => 'Moving',
        ],
        'status' => 'unread',
    ]);

    $this->actingAs($user)
        ->get(route('admin.forms.submissions.index', ['form' => 'contact']))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('admin/forms/submissions')
            ->has('form')
            ->has('submissions.data', 1)
            ->where('submissions.data.0.data.email', 'cust1@example.com')
            ->where('stats.unread', 1));
});

it('renders the booking page with the site header component and navigation', function () {
    Setting::query()->updateOrCreate(
        ['key' => 'active_theme'],
        ['value' => 'easytruck-theme']
    );

    Page::query()->create([
        'name' => 'Book Online',
        'slug' => 'booking',
        'path' => 'booking',
        'template' => 'booking',
        'status' => 'published',
        'visibility' => 'public',
    ]);

    $response = $this->get('/booking');

    $response->assertOk()
        ->assertSee('class="site-header"', false)
        ->assertSee('class="site-logo"', false)
        ->assertSee('class="site-navigation"', false)
        ->assertSee('id="primary-menu"', false)
        ->assertSee('class="etb-page"', false);
});
