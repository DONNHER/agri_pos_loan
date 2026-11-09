<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('consignees')) {
            Schema::create('consignees', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->text('full_name');
                $table->text('phone')->nullable();
                $table->text('address')->nullable();
                $table->timestamp('created_at')->useCurrent();
            });
        }
    }

    public function down(): void {}
};
