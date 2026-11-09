<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('notifications')) {
            Schema::create('notifications', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('user_id')->nullable();
                $table->uuid('shareholder_id')->nullable();
                $table->uuid('comaker_id')->nullable();
                $table->string('title');
                $table->text('content');
                $table->string('category')->default('transaction');
                $table->string('type')->nullable();
                $table->boolean('is_unread')->default(true);
                $table->jsonb('metadata')->nullable();
                $table->timestamp('created_at')->useCurrent();

                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
                $table->foreign('shareholder_id')->references('id')->on('shareholders')->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
