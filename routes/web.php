<?php

use App\Http\Controllers\Storefront\PageController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

require __DIR__.'/admin.php';
require __DIR__.'/settings.php';

Route::get('/{slug}', [PageController::class, 'show']);
