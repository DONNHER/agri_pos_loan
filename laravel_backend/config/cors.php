<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        // Production frontend (Netlify/Vercel)
        env('FRONTEND_URL_PRODUCTION', 'https://lending-pis.netlify.app'),
        // LAN frontend (served from Laravel on store server)
        env('FRONTEND_URL_LAN', 'http://192.168.1.100:8000'),
        // Development frontend (Vite dev server)
        env('FRONTEND_URL_DEV', 'http://localhost:5173'),
        // Local development with proxy
        'http://localhost:3000',
    ],

    'allowed_origins_patterns' => [
        // Allow localhost and LAN development origins with optional ports.
        '#^http://localhost(:[0-9]+)?$#',
        '#^http://192\.168\.[0-9]{1,3}\.[0-9]{1,3}(:[0-9]+)?$#',
        '#^http://10\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}(:[0-9]+)?$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'Retry-After',
    ],

    'max_age' => 86400, // 24 hours

    'supports_credentials' => true,

];
