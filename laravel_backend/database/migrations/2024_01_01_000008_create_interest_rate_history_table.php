<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('interest_rate_history')) {
            Schema::create('interest_rate_history', function (Blueprint $table) {
                $table->id();
                $table->decimal('old_rate', 15, 4);
                $table->decimal('new_rate', 15, 4);
                $table->text('reason')->nullable();
                $table->timestamp('effective_date')->nullable();
                $table->timestamp('created_at')->useCurrent();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('interest_rate_history');
    }
};
