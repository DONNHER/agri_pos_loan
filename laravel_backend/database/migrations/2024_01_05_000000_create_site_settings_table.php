<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('type')->default('string'); // string, json, boolean, integer
            $table->string('group')->default('general');
            $table->timestamps();
        });

        // Seed default backup settings
        DB::table('site_settings')->insert([
            [
                'key' => 'backup_frequency_db',
                'value' => 'weekly',
                'type' => 'string',
                'group' => 'backup',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'backup_time_db',
                'value' => '02:00',
                'type' => 'string',
                'group' => 'backup',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'backup_email',
                'value' => 'admin@example.com',
                'type' => 'string',
                'group' => 'backup',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'backup_retention_days',
                'value' => '30',
                'type' => 'integer',
                'group' => 'backup',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('site_settings');
    }
};
