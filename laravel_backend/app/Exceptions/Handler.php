<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Throwable;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class Handler extends ExceptionHandler
{
    protected $levels = [];

    protected $dontReport = [];

    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            try {
                // Safely check if DB connection is available before logging
                if (DB::connection()->getPdo()) {
                    ActivityLog::create([
                        'user_id' => Auth::id(),
                        'action' => 'System Error',
                        'log_type' => ActivityLog::TYPE_ERROR,
                        'description' => $e->getMessage(),
                        'stack_trace' => $e->getTraceAsString(),
                        'old_values' => [
                            'file' => $e->getFile(),
                            'line' => $e->getLine(),
                        ],
                        'ip_address' => Request::ip(),
                        'device_info' => Request::userAgent(),
                    ]);
                }
            } catch (Throwable $dbEx) {
                // If DB is not available yet (e.g. during boot), just log to file
                Log::error('Original Error: ' . $e->getMessage());
            }
        });
    }
}
