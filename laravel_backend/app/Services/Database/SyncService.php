<?php

namespace App\Services\Database;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Throwable;

class SyncService
{
    public function __construct(private readonly LocalDatabase $localDatabase)
    {
    }

    public function recordSale(array $sale, array $items, ?array $creditTransaction, array $batchDeductions, array $movements): array
    {
        $local = $this->localDatabase->requireReady();
        $existing = $local->table('sales')->where('client_uuid', $sale['client_uuid'])->first();

        if ($existing) {
            return ['sale_id' => $existing->id, 'pending_sync' => $this->pendingCount()];
        }

        $local->transaction(function () use ($local, $sale, $items, $creditTransaction, $batchDeductions, $movements): void {
            foreach ($batchDeductions as $deduction) {
                $changed = $local->table('grocery_batches')
                    ->where('id', $deduction['batch_id'])
                    ->where('remaining_quantity', '>=', $deduction['quantity'])
                    ->decrement('remaining_quantity', $deduction['quantity']);
                if ($changed !== 1) {
                    throw new \RuntimeException('Stock changed on this terminal. Refresh the catalog and retry.');
                }
            }

            $local->table('sales')->insert($sale);
            foreach ($items as $item) {
                $local->table('sale_items')->insert($item);
            }
            if ($creditTransaction) {
                $local->table('transactions')->insert($creditTransaction);
            }
            foreach ($movements as $movement) {
                $local->table('inventory_movements')->insert($movement);
            }

            $local->table('pos_sync_outbox')->insert([
                'id' => (string) Str::uuid(),
                'event_type' => 'sale.created',
                'record_id' => $sale['id'],
                'payload' => json_encode([
                    'sale' => $sale,
                    'items' => $items,
                    'credit_transaction' => $creditTransaction,
                    'batch_deductions' => $batchDeductions,
                    'movements' => $movements,
                ], JSON_THROW_ON_ERROR),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        return ['sale_id' => $sale['id'], 'pending_sync' => $this->pendingCount()];
    }

    public function sync(): array
    {
        $local = $this->localDatabase->requireReady();
        $central = $this->centralConnection();
        $central->select('SELECT 1');

        $synced = 0;
        $failed = 0;
        $pending = $local->table('pos_sync_outbox')
            ->whereNull('synced_at')
            ->orderBy('created_at')
            ->limit(100)
            ->get();

        foreach ($pending as $event) {
            try {
                $payload = json_decode($event->payload, true, 512, JSON_THROW_ON_ERROR);
                $central->transaction(function () use ($central, $payload): void {
                    if ($central->table('sales')->where('client_uuid', $payload['sale']['client_uuid'])->exists()) {
                        return;
                    }

                    $central->table('sales')->insert($payload['sale']);

                    foreach ($payload['items'] as $item) {
                        $central->table('sale_items')->insert($item);
                    }
                    if ($payload['credit_transaction']) {
                        $central->table('transactions')->insert($payload['credit_transaction']);
                    }
                    foreach ($payload['movements'] as $movement) {
                        $central->table('inventory_movements')->insert($movement);
                    }
                    foreach ($payload['batch_deductions'] as $deduction) {
                        $changed = $central->table('grocery_batches')
                            ->where('id', $deduction['batch_id'])
                            ->where('remaining_quantity', '>=', $deduction['quantity'])
                            ->decrement('remaining_quantity', $deduction['quantity']);
                        if ($changed !== 1) {
                            throw new \RuntimeException('Central stock changed after this offline sale; manager reconciliation is required.');
                        }
                    }
                });

                $local->table('pos_sync_outbox')->where('id', $event->id)->update([
                    'synced_at' => now(),
                    'last_error' => null,
                    'updated_at' => now(),
                ]);
                $synced++;
            } catch (Throwable $error) {
                $local->table('pos_sync_outbox')->where('id', $event->id)->update([
                    'attempts' => $event->attempts + 1,
                    'last_error' => mb_substr($error->getMessage(), 0, 2000),
                    'updated_at' => now(),
                ]);
                $failed++;
            }
        }

        $products = $this->pullTable('products', ['id', 'product_name', 'barcode', 'product_image', 'selling_price', 'is_active', 'created_at']);
        $shareholders = $this->pullTable('shareholders', ['id', 'full_name', 'first_name', 'last_name', 'email', 'contact_number', 'total_share_capital', 'creditscore', 'membership_fee', 'created_at']);
        $this->pullTable('grocery_batches', ['id', 'product_id', 'capital_price', 'original_quantity', 'remaining_quantity', 'purchase_date', 'expiration_date']);

        return [
            'synced_sales' => $synced,
            'failed_sales' => $failed,
            'pending_sales' => $this->pendingCount(),
            'products_updated' => $products,
            'shareholders_updated' => $shareholders,
        ];
    }

    public function pendingCount(): int
    {
        if (!$this->localDatabase->isReady()) {
            return 0;
        }

        return $this->localDatabase->connection()->table('pos_sync_outbox')->whereNull('synced_at')->count();
    }

    public function status(): array
    {
        try {
            $this->centralConnection()->select('SELECT 1');
            $centralAvailable = true;
        } catch (Throwable) {
            $centralAvailable = false;
        }

        return [
            'central_available' => $centralAvailable,
            'central_driver' => config('database.connections.' . config('database.central_connection') . '.driver'),
            'local_sqlite_ready' => $this->localDatabase->isReady(),
            'pending_sales' => $this->pendingCount(),
            'sqlite_path' => config('database.connections.sqlite.database'),
        ];
    }

    private function pullTable(string $table, array $columns): int
    {
        $central = $this->centralConnection();
        $local = $this->localDatabase->connection();
        if (!Schema::connection(config('database.central_connection'))->hasTable($table) || !Schema::connection('sqlite')->hasTable($table)) {
            return 0;
        }

        $available = array_values(array_intersect($columns, Schema::connection(config('database.central_connection'))->getColumnListing($table), Schema::connection('sqlite')->getColumnListing($table)));
        if (!in_array('id', $available, true)) {
            return 0;
        }

        $count = 0;
        $central->table($table)->select($available)->orderBy('id')->chunk(250, function ($rows) use ($local, $table, &$count): void {
            foreach ($rows as $row) {
                $values = (array) $row;
                $local->table($table)->updateOrInsert(['id' => $values['id']], $values);
                $count++;
            }
        });

        return $count;
    }

    private function centralConnection(): \Illuminate\Database\Connection
    {
        return DB::connection(config('database.central_connection'));
    }
}
