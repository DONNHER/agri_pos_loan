<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\DB;

class DetectDatabaseConnectivity
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->is('api/pos/*')) {
            DB::setDefaultConnection('sqlite');
        }

        $response = $next($request);

        if ($request->is('api/pos/*')) {
            $response->headers->set('X-Database-Connection', 'sqlite');
        }

        return $response;
    }
}