<?php

namespace App\Http\Middleware;

use Closure;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LogAccess
{
    public function handle(Request $request, Closure $next)
    {
        $start = microtime(true);

        $response = $next($request);

        $duration = round((microtime(true) - $start) * 1000, 2);

        // Access Logs: Page visits and feature usage
        if (Auth::check() && !str_contains($request->path(), 'activity-logs')) {
            
            $isGet = $request->isMethod('GET');

            // Only log GET requests if they are actual page visits (not AJAX/JSON)
            // or log all mutations (POST, PUT, DELETE)
            if (!$isGet || ($isGet && !$request->expectsJson())) {

                ActivityLog::create([
                    'user_id' => Auth::id(),
                    'action' => $isGet ? 'Page Visit' : 'Feature Usage',
                    'log_type' => ActivityLog::TYPE_ACCESS,
                    'description' => "Accessed " . ($request->path() ?: 'home') . " via " . $request->method(),
                    'ip_address' => $request->ip(),
                    'device_info' => $request->userAgent(),
                    'old_values' => [
                        'duration_ms' => $duration,
                        'method' => $request->method(),
                        'path' => $request->path(),
                        'status' => $response->getStatusCode()
                    ]
                ]);
            }
        }

        return $response;
    }
}
