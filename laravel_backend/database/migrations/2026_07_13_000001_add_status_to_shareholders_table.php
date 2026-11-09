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
        Schema::table('shareholders', function (Blueprint $table) {
            if (!Schema::hasColumn('shareholders', 'status')) {
                $table->string('status')->default('active')->after('creditscore');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shareholders', function (Blueprint $table) {
            if (Schema::hasColumn('shareholders', 'status')) {
                $table->dropColumn('status');
            }
        });
    }
};
