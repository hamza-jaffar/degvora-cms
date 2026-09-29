<?php

use App\Http\Controllers\Admin\GalleryController;
use App\Http\Controllers\Admin\UserManagementController;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')->middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'admin/dashboard')->name('dashboard');

    Route::prefix('users')->name('admin.users.')->group(function () {
        Route::get('index', [UserManagementController::class, 'index'])->name('index');
        Route::get('create', [UserManagementController::class,'create'])->name('create');
    });

    Route::prefix('/gallery')->name('admin.gallery.')->group(function () {
        Route::get('/', [GalleryController::class, 'index'])->name('index');
        Route::post('/upload', [GalleryController::class, 'upload'])->name('upload');
        Route::delete('/{gallery}', [GalleryController::class, 'destroy'])->name('destroy');
    });

});
