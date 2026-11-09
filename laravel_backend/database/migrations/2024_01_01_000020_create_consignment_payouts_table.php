<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consignment_payouts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('consignee_id');
            $table->decimal('amount', 15, 2);
            $table->date('payout_date');
            $table->string('status')->default('completed');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('consignee_id')->references('id')->on('consignees')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consignment_payouts');
    }
};
