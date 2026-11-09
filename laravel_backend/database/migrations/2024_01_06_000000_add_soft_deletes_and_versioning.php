<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $tables = ['users', 'shareholders', 'loans', 'loan_requests', 'products', 'transactions', 'consignees', 'consignments'];

        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                Schema::table($table, function (Blueprint $table) {
                    if (!Schema::hasColumn($table->getTable(), 'deleted_at')) {
                        $table->softDeletes();
                    }
                    if (!Schema::hasColumn($table->getTable(), 'version')) {
                        $table->integer('version')->default(1);
                    }
                });
            }
        }
    }

    public function down(): void
    {
        $tables = ['users', 'shareholders', 'loans', 'loan_requests', 'products', 'transactions', 'consignees', 'consignments'];

        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                Schema::table($table, function (Blueprint $table) {
                    $table->dropSoftDeletes();
                    $table->dropColumn('version');
                });
            }
        }
    }
};
