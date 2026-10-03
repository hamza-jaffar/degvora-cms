<?php

use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\GalleryController;
use App\Http\Controllers\Admin\PageController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\ThemeController;
use App\Http\Controllers\Admin\UserManagementController;
use Illuminate\Support\Facades\Route;

Route::redirect('/admin', '/admin/dashboard');
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

    Route::resource('products', ProductController::class)->names('admin.products');
    Route::post('products/{product}/restore', [ProductController::class, 'restore'])->name('admin.products.restore')->withTrashed();
    Route::delete('products/{product}/force-delete', [ProductController::class, 'forceDelete'])->name('admin.products.force-delete')->withTrashed();

    Route::resource('page', PageController::class)->names('admin.page');
    Route::post('page/{page}/restore', [PageController::class, 'restore'])->name('admin.page.restore')->withTrashed();
    Route::delete('page/{page}/force-delete', [PageController::class, 'forceDelete'])->name('admin.page.force-delete')->withTrashed();

    Route::prefix('themes')->name('admin.themes.')->group(function () {
        Route::get('/', [ThemeController::class, 'index'])->name('index');
        Route::post('/upload', [ThemeController::class, 'upload'])->name('upload');
        Route::post('/active', [ThemeController::class, 'setActive'])->name('active');
        Route::get('/editor', [ThemeController::class, 'editor'])->name('editor');
        Route::get('/file', [ThemeController::class, 'getFile'])->name('file');
        Route::put('/file', [ThemeController::class, 'saveFile'])->name('save-file');
        Route::delete('/file', [ThemeController::class, 'deleteFile'])->name('delete-file');
        Route::post('/file/create', [ThemeController::class, 'createFile'])->name('create-file');
        Route::post('/directory/create', [ThemeController::class, 'createDirectory'])->name('create-directory');
        Route::delete('/{theme}', [ThemeController::class, 'destroy'])->name('destroy');
    });

});
