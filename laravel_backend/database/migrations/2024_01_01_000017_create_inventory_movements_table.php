<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('inventory_movements')) {
            Schema::create('inventory_movements', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('product_id')->nullable();
                $table->integer('quantity');
                $table->string('type'); // IN, OUT, ADJUSTMENT
                $table->string('reason')->nullable();
                $table->timestamp('created_at')->useCurrent();

                $table->foreign('product_id')->references('id')->on('products');
            });
        }
    }

    public function down(): void {}
};
