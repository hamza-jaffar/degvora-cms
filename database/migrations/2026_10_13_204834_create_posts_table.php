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
        Schema::create('posts', function (Blueprint $table) {
            $table->id();

            // Author & Category relations
            $table->foreignId('author_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('category_id')
                ->nullable()
                ->constrained('categories')
                ->nullOnDelete();

            // Core Details
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('excerpt')->nullable();
            $table->longText('content')->nullable();
            $table->string('featured_image', 2048)->nullable();

            // Taxonomy & Flags
            $table->json('tags')->nullable();
            $table->boolean('is_featured')->default(false);

            // Publishing & Visibility
            $table->enum('status', ['draft', 'published', 'scheduled', 'archived'])
                ->default('draft');
            $table->enum('visibility', ['public', 'private', 'password'])
                ->default('public');
            $table->text('password')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamp('scheduled_at')->nullable(); // For future scheduling feature

            // SEO & Social Open Graph
            $table->string('meta_title')->nullable();
            $table->string('meta_description', 500)->nullable();
            $table->string('canonical_url', 2048)->nullable();
            $table->string('og_title')->nullable();
            $table->string('og_description', 500)->nullable();
            $table->string('og_image', 2048)->nullable();
            $table->string('robots', 50)->default('index,follow');

            // Timestamps & Soft Deletes
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['status', 'published_at']);
            $table->index(['category_id', 'status']);
            $table->index(['author_id', 'status']);
            $table->index('is_featured');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
