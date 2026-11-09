<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('grocery_batches')) {
            Schema::create('grocery_batches', function (Blueprint $table) {
                $table->id(); // bigint primary key
                $table->uuid('product_id')->nullable();
                $table->decimal('capital_price', 15, 2);
                $table->integer('original_quantity');
                $table->integer('remaining_quantity');
                $table->date('purchase_date');
                $table->date('expiration_date');

                $table->foreign('product_id')->references('id')->on('products');
            });
        }
    }

    public function down(): void {}
};
