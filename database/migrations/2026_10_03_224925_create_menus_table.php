<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('menus', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('location')->nullable();

            $table->timestamps();

            $table->unique('name');
            $table->index('location');
        });

        Schema::create('menu_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('menu_id')
                ->constrained('menus')
                ->cascadeOnDelete();

            // Nested menu support
            $table->foreignId('parent_id')
                ->nullable()
                ->constrained('menu_items')
                ->cascadeOnDelete();

            // What visitors see
            $table->string('label');

            // Where the item points
            $table->string('type')->default('custom');
            $table->string('url')->nullable();

            // Used when type is page/product/category/etc.
            $table->unsignedBigInteger('reference_id')->nullable();

            // Ordering
            $table->unsignedInteger('sort_order')->default(0);

            // Link behavior
            $table->string('target')->default('_self');

            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->index(['menu_id', 'parent_id']);
            $table->index(['menu_id', 'sort_order']);
            $table->index(['type', 'reference_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('menus');
    }
};
