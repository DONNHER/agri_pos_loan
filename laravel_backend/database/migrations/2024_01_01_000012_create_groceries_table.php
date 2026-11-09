<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('groceries')) {
            Schema::create('groceries', function (Blueprint $table) {
                $table->id(); // bigint primary key
                $table->uuid('product_id')->nullable();
                
                $table->foreign('product_id')->references('id')->on('products');
            });
        }
    }

    public function down(): void {}
};
