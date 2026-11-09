<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->string('log_type')->default('general')->after('action');
            $table->json('old_values')->nullable()->after('description');
            $table->json('new_values')->nullable()->after('old_values');
            $table->string('device_info')->nullable()->after('ip_address');
            $table->boolean('is_suspicious')->default(false)->after('device_info');
            $table->index('log_type');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropColumn(['log_type', 'old_values', 'new_values', 'device_info', 'is_suspicious']);
        });
    }
};
