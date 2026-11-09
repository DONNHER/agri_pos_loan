<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('shareholders')) {
            Schema::create('shareholders', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('user_id')->nullable();
                $table->string('full_name')->nullable();
                $table->string('first_name');
                $table->string('last_name');
                $table->string('email')->unique();
                $table->text('address')->nullable();
                $table->string('contact_number')->nullable();
                $table->decimal('total_share_capital', 15, 2)->default(0);
                $table->integer('creditscore')->default(0);
                $table->text('id_image_url')->nullable();
                $table->decimal('membership_fee', 10, 2)->nullable();
                $table->timestamp('created_at')->useCurrent();
                
                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('shareholders');
    }
};
