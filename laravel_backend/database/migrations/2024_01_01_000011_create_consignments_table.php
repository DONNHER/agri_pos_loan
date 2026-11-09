<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('consignments')) {
            Schema::create('consignments', function (Blueprint $table) {
                $table->id(); // bigint primary key
                $table->uuid('product_id')->nullable();
                $table->uuid('consignee_id')->nullable();
                $table->decimal('commission_rate', 15, 2);
                $table->decimal('capital_price', 15, 2);

                $table->foreign('product_id')->references('id')->on('products');
                $table->foreign('consignee_id')->references('id')->on('consignees');
            });
        }
    }

    public function down(): void {}
};
