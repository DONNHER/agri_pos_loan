<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('products')) {
            Schema::create('products', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->text('product_name');
                $table->string('barcode', 191)->nullable();
                $table->text('product_image')->nullable();
                $table->decimal('selling_price', 15, 2);
                $table->boolean('is_active')->default(true);
                $table->timestamp('created_at')->useCurrent();
            });
        }

        if (config('database.default') === 'mysql' && Schema::getColumnType('products', 'barcode') === 'text') {
            DB::statement('ALTER TABLE products MODIFY barcode VARCHAR(191) NULL');
        }

        if (!Schema::hasIndex('products', 'products_barcode_unique')) {
            Schema::table('products', function (Blueprint $table) {
                $table->unique('barcode');
            });
        }
    }

    public function down(): void {}
};
