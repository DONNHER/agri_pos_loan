<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Storage;
use Spatie\Dropbox\Client as DropboxClient;
use Spatie\FlysystemDropbox\DropboxAdapter;
use League\Flysystem\Filesystem as Flysystem;
use Illuminate\Filesystem\FilesystemAdapter;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (config('app.env') === 'production') {
            \Illuminate\Support\Facades\URL::forceScheme('https');
        }

        // Register Dropbox driver correctly for Laravel 10/11
        Storage::extend('dropbox', function ($app, $config) {
            $adapter = new DropboxAdapter(new DropboxClient($config['authorization_token']));

            $filesystem = new Flysystem($adapter, $config);

            return new FilesystemAdapter(
                $filesystem,
                $adapter,
                $config
            );
        });

        view()->composer('layouts.dashboard', function ($view) {
            if (auth()->check()) {
                $unreadNotificationsCount = \App\Models\Notification::where('user_id', auth()->id())
                    ->where('is_unread', true)
                    ->count();
                $view->with('unreadNotificationsCount', $unreadNotificationsCount);
            }
        });
    }
}