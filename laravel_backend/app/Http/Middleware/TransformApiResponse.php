<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TransformApiResponse
{
    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }
}
