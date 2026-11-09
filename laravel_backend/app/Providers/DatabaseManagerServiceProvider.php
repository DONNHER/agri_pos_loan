<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\Database\LocalDatabase;
use App\Services\Database\SyncService;

class DatabaseManagerServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton(LocalDatabase::class);
        $this->app->singleton(SyncService::class);
    }
}