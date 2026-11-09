<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('loans')) {
            Schema::create('loans', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('shareholder_id');
                $table->uuid('loan_request_id'); // 🚀 Fixed: Changed from unsignedBigInteger to uuid
                $table->decimal('principal_amount', 15, 2);
                $table->decimal('remaining_balance', 15, 2);
                $table->date('release_date')->nullable();
                $table->float('interest_rate')->nullable();
                $table->decimal('monthly_amortization', 15, 2)->nullable();
                $table->date('next_repayment_date')->nullable();
                $table->decimal('processing_fee', 15, 2)->nullable();
                $table->string('status')->default('active');
                $table->integer('tenure_months')->nullable();
                $table->decimal('total_amount_to_pay', 15, 2)->nullable();
                $table->decimal('total_repayable', 15, 2)->nullable();
                $table->timestamps();

                $table->foreign('shareholder_id')->references('id')->on('shareholders')->onDelete('cascade');
                $table->foreign('loan_request_id')->references('id')->on('loan_requests')->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('loans');
    }
};
