<?php

use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\GalleryController;
use App\Http\Controllers\Admin\UserManagementController;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')->middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'admin/dashboard')->name('dashboard');

    Route::prefix('users')->name('admin.users.')->group(function () {
        Route::get('index', [UserManagementController::class, 'index'])->name('index');
        Route::get('create', [UserManagementController::class, 'create'])->name('create');
    });

    Route::prefix('/gallery')->name('admin.gallery.')->group(function () {
        Route::get('/', [GalleryController::class, 'index'])->name('index');
        Route::post('/upload', [GalleryController::class, 'upload'])->name('upload');
        Route::post('/picker/upload', [GalleryController::class, 'uploadForPicker'])->name('picker.upload');
        Route::delete('/{gallery}', [GalleryController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('category')->name('admin.category.')->group(function () {
        Route::get('/index', [CategoryController::class, 'index'])->name('index');
        Route::get('/create', [CategoryController::class, 'create'])->name('create');
        Route::post('/store', [CategoryController::class, 'store'])->name('store');
        Route::get('/edit/{category:slug}', [CategoryController::class, 'edit'])->name('edit');
        Route::post('/update', [CategoryController::class, 'update'])->name('update');
        Route::delete('/delete', [CategoryController::class, 'delete'])->name('delete');

    });

});
