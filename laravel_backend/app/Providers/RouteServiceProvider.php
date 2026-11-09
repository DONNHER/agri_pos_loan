<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    public const HOME = '/home';

    public function boot(): void
    {
        // 🚀 Tiered Rate Limiting Strategy
        RateLimiter::for('api', function (Request $request) {
            $user = $request->user();

            if ($user?->isAdmin()) {
                return Limit::perMinute(1000)->by($user->id);
            }

            if ($user?->role === \App\Models\User::ROLE_STAFF) {
                return Limit::perMinute(300)->by($user->id);
            }

            if ($user?->role === \App\Models\User::ROLE_MEMBER) {
                return Limit::perMinute(60)->by($user->id);
            }

            return Limit::perMinute(30)->by($request->ip());
        });

        // Strict rate limiting for Authentication routes
        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(10)->by($request->ip())->response(function (Request $request, array $headers) {
                return response()->json([
                    'success' => false,
                    'message' => 'Too many authentication attempts. Please try again later.',
                    'retry_after' => $headers['Retry-After'] ?? null
                ], 429);
            });
        });

        // Standard rate limit with custom JSON response
        RateLimiter::for('global', function (Request $request) {
            return Limit::perMinute(100)->by($request->user()?->id ?: $request->ip())->response(function (Request $request, array $headers) {
                return response()->json([
                    'success' => false,
                    'message' => 'API rate limit exceeded.',
                    'limit' => $headers['X-RateLimit-Limit'] ?? 100,
                    'remaining' => $headers['X-RateLimit-Remaining'] ?? 0,
                ], 429);
            });
        });

        $this->routes(function () {
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/api.php'));

            Route::middleware('web')
                ->group(base_path('routes/web.php'));
        });
    }
}
