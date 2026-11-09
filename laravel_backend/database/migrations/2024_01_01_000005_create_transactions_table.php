<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('transactions')) {
            Schema::create('transactions', function (Blueprint $table) {
                $table->id();
                $table->string('reference_id')->nullable();
                $table->uuid('shareholder_id');
                $table->string('type');
                $table->string('method')->default('Cash');
                $table->decimal('amount', 15, 2);
                $table->string('status')->default('Successful');
                $table->timestamp('date')->useCurrent();
                
                $table->foreign('shareholder_id')->references('id')->on('shareholders')->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
