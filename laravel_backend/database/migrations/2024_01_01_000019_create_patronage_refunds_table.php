<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patronage_refunds', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('shareholder_id');
            $table->decimal('amount', 15, 2);
            $table->string('period');
            $table->string('status')->default('pending');
            $table->timestamps();

            $table->foreign('shareholder_id')->references('id')->on('shareholders');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patronage_refunds');
    }
};
