<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('interest_settings')) {
            Schema::create('interest_settings', function (Blueprint $table) {
                $table->string('id')->primary();
                $table->decimal('rate', 15, 4);
                $table->boolean('is_active')->default(true);
                $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('interest_settings');
    }
};
