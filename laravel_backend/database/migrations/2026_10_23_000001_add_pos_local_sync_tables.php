<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->uuid('client_uuid')->nullable()->unique();
            $table->string('terminal_id')->nullable();
            $table->uuid('cashier_id')->nullable();
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('discount_total', 15, 2)->default(0);
            $table->decimal('tax_total', 15, 2)->default(0);
            $table->string('tender_type')->nullable();
            $table->decimal('cash_amount', 15, 2)->default(0);
            $table->decimal('credit_amount', 15, 2)->default(0);
            $table->decimal('change_due', 15, 2)->default(0);
            $table->string('status')->default('completed');
        });

        Schema::table('sale_items', function (Blueprint $table) {
            $table->string('product_code')->nullable();
            $table->string('product_name')->nullable();
            $table->string('unit')->nullable();
            $table->decimal('unit_cost', 15, 2)->default(0);
            $table->decimal('discount', 15, 2)->default(0);
            $table->decimal('line_total', 15, 2)->default(0);
        });

        Schema::create('pos_sync_outbox', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('event_type');
            $table->uuid('record_id');
            $table->longText('payload');
            $table->unsignedInteger('attempts')->default(0);
            $table->text('last_error')->nullable();
            $table->timestamp('synced_at')->nullable();
            $table->timestamps();
            $table->index(['synced_at', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_sync_outbox');

        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropColumn(['product_code', 'product_name', 'unit', 'unit_cost', 'discount', 'line_total']);
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->dropUnique(['client_uuid']);
            $table->dropColumn([
                'client_uuid', 'terminal_id', 'cashier_id', 'subtotal', 'discount_total',
                'tax_total', 'tender_type', 'cash_amount', 'credit_amount', 'change_due', 'status',
            ]);
        });
    }
};