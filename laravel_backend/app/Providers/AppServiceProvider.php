<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

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