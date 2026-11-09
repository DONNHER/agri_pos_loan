<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shareholders', function (Blueprint $table) {
            // Add missing timestamp if it doesn't exist
            if (!Schema::hasColumn('shareholders', 'updated_at')) {
                $table->timestamp('updated_at')->nullable();
            }
            // Add soft deletes support
            if (!Schema::hasColumn('shareholders', 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    public function down(): void
    {
        Schema::table('shareholders', function (Blueprint $table) {
            $table->dropColumn(['updated_at', 'deleted_at']);
        });
    }
};
