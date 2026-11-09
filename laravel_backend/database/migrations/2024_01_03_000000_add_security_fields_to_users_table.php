<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->integer('failed_attempts')->default(0)->after('status');
            $table->timestamp('locked_until')->nullable()->after('failed_attempts');
            $table->string('mfa_code')->nullable()->after('locked_until');
            $table->timestamp('mfa_expires_at')->nullable()->after('mfa_code');
            $table->boolean('mfa_enabled')->default(false)->after('mfa_expires_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['failed_attempts', 'locked_until', 'mfa_code', 'mfa_expires_at', 'mfa_enabled']);
        });
    }
};
