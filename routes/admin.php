<?php

use App\Http\Controllers\Admin\UserManagementController;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')->middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'admin/dashboard')->name('dashboard');

    Route::prefix('users')->name('admin.users.')->group(function () {
        Route::get('index', [UserManagementController::class, 'index'])->name('index');
        Route::get('create', [UserManagementController::class,'create'])->name('create');
    });

});
