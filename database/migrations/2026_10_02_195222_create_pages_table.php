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
        Schema::create('pages', function (Blueprint $table) {
            $table->id();

            // Basic Information
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('path')->unique();
            $table->string('excerpt', 500)->nullable();
            $table->longText('content')->nullable();

            // Page Hierarchy
            $table->foreignId('parent_id')
                ->nullable()
                ->constrained('pages')
                ->nullOnDelete();

            // SEO Settings
            $table->string('meta_title')->nullable();
            $table->string('meta_description', 500)->nullable();
            $table->string('canonical_url', 2048)->nullable();
            $table->string('robots', 50)->default('index,follow');

            // Publishing & Visibility
            $table->enum('status', ['draft', 'published', 'scheduled', 'archived'])
                ->default('draft');
            $table->enum('visibility', ['public', 'private', 'password'])
                ->default('public');
            $table->text('password')->nullable();
            $table->timestamp('published_at')->nullable();

            // Display Settings
            $table->string('template')->default('default');
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_featured')->default(false);

            // Featured Media
            $table->string('featured_media')->nullable();

            // Timestamps
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['status', 'published_at']);
            $table->index(['parent_id', 'sort_order']);
            $table->index(['visibility', 'status']);
            $table->index('is_featured');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pages');
    }
};
