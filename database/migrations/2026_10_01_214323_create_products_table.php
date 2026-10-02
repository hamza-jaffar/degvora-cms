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
        Schema::create('products', function (Blueprint $table) {
            $table->id();

            // Identity
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('sku')->nullable()->unique();
            $table->string('barcode')->nullable()->index();
            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();

            // Product content
            $table->string('subtitle')->nullable();
            $table->longText('description')->nullable();
            $table->text('short_description')->nullable();
            $table->string('product_type')->default('physical')->index();
            $table->string('vendor')->nullable()->index();
            $table->string('brand')->nullable()->index();
            $table->string('condition')->default('new');

            // Pricing (base/default product price)
            $table->decimal('price', 12, 2)->default(0);
            $table->decimal('compare_at_price', 12, 2)->nullable();
            $table->decimal('cost_per_item', 12, 2)->nullable();
            $table->char('currency', 3)->default('PKR');

            // Images and Videos
            $table->string('main_image')->nullable();
            $table->json('gallery')->nullable();

            // Variants
            $table->json('variants')->nullable();

            // Inventory
            $table->boolean('track_inventory')->default(true);
            $table->unsignedInteger('quantity')->default(0);
            $table->boolean('allow_backorder')->default(false);
            $table->unsignedInteger('low_stock_threshold')->nullable();

            // Shipping and physical dimensions
            $table->boolean('requires_shipping')->default(true);
            $table->decimal('weight', 10, 3)->nullable();
            $table->string('weight_unit', 10)->default('kg');
            $table->decimal('length', 10, 2)->nullable();
            $table->decimal('width', 10, 2)->nullable();
            $table->decimal('height', 10, 2)->nullable();
            $table->string('dimension_unit', 10)->default('cm');

            // Product organization
            $table->boolean('is_featured')->default(false)->index();
            $table->unsignedInteger('sort_order')->default(0);
            $table->json('tags')->nullable();

            // SEO
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->string('canonical_url', 2048)->nullable();
            $table->string('og_title')->nullable();
            $table->text('og_description')->nullable();
            $table->string('og_image')->nullable();
            $table->string('robots')->default('index,follow');

            // Publishing
            $table->string('status')->default('draft')->index();
            $table->timestamp('published_at')->nullable()->index();

            // Extensibility
            $table->json('metadata')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'is_featured']);
            $table->index(['status', 'published_at']);
            $table->index(['vendor', 'brand']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
