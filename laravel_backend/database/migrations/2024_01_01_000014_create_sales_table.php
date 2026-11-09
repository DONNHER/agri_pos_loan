<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('sales')) {
            Schema::create('sales', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('shareholder_id')->nullable();
                $table->decimal('total_amount', 15, 2);
                $table->timestamp('created_at')->useCurrent();
                
                $table->foreign('shareholder_id')->references('id')->on('shareholders');
            });
        }
    }

    public function down(): void {}
};
