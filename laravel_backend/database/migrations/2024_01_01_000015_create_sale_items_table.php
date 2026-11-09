<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('sale_items')) {
            Schema::create('sale_items', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('sale_id');
                $table->uuid('product_id');
                $table->integer('quantity');
                $table->decimal('selling_price', 15, 2);
                $table->timestamp('created_at')->useCurrent();

                $table->foreign('sale_id')->references('id')->on('sales');
                $table->foreign('product_id')->references('id')->on('products');
            });
        }
    }

    public function down(): void {}
};
