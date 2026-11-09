<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('consignment_daily_inventory')) {
            Schema::create('consignment_daily_inventory', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('product_id')->nullable();
                $table->date('consingment_date'); // Matching the typo in your SQL schema
                $table->integer('quantity_received')->default(0);
                $table->integer('quantity_sold')->default(0);

                $table->foreign('product_id')->references('id')->on('products');
            });
        }
    }

    public function down(): void {}
};
