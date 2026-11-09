<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\File;

Route::get('/PIS/{any?}', function ($any = null) {

    $file = public_path('PIS/' . $any);

    if ($any && File::exists($file) && !File::isDirectory($file)) {
        return response()->file($file);
    }

    return response()->file(
        public_path('PIS/index.html')
    );

})->where('any', '.*');
