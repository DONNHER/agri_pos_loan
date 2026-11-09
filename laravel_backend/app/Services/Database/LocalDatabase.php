<?php

namespace App\Services\Database;

use Illuminate\Database\Connection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use RuntimeException;

class LocalDatabase
{
    private ?Connection $localConnection = null;

    public function connection(): Connection
    {
        if ($this->localConnection === null) {
            $this->localConnection = DB::connection('sqlite');
            $this->localConnection->getPdo();
            $this->localConnection->statement('PRAGMA foreign_keys = ON');
            $this->localConnection->statement('PRAGMA journal_mode = WAL');
            $this->localConnection->statement('PRAGMA busy_timeout = 5000');
        }

        return $this->localConnection;
    }

    public function isReady(): bool
    {
        try {
            $this->connection();

            return Schema::connection('sqlite')->hasTable('sales')
                && Schema::connection('sqlite')->hasTable('sale_items')
                && Schema::connection('sqlite')->hasTable('pos_sync_outbox');
        } catch (\Throwable) {
            return false;
        }
    }

    public function requireReady(): Connection
    {
        if (!$this->isReady()) {
            throw new RuntimeException('Local POS database is not migrated. Run php artisan migrate --database=sqlite.');
        }

        return $this->connection();
    }
}
