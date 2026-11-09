<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('loan_requests')) {
            Schema::create('loan_requests', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('shareholder_id');
                $table->decimal('requested_amount', 15, 2);
                $table->string('status')->default('pending');
                $table->json('loan_comakers')->nullable();
                $table->json('comaker_decisions')->nullable();
                $table->double('interest_rate')->nullable();
                $table->integer('months')->nullable();
                $table->text('purpose')->nullable();
                $table->timestamps();

                $table->foreign('shareholder_id')->references('id')->on('shareholders')->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('loan_requests');
    }
};
