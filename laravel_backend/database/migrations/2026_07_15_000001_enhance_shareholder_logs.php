<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Note: user_id and shareholder_id might already exist from the base migration,
        // but we ensure they have proper indexes for the detail pages.
        Schema::table('activity_logs', function (Blueprint $table) {
            if (!Schema::hasColumn('activity_logs', 'shareholder_id')) {
                $table->uuid('shareholder_id')->nullable()->after('user_id');
                $table->foreign('shareholder_id')->references('id')->on('shareholders')->onDelete('set null');
            }

            $table->index('user_id');
            $table->index('shareholder_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropIndex(['shareholder_id']);
            // We don't drop the columns if they were part of the original schema
        });
    }
};
