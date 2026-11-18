<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| DEL-MediCare Web Routes (SPA Entry Point)
|--------------------------------------------------------------------------
| Menyatukan frontend ke dalam Laravel: route web menyajikan antarmuka DEL-MediCare
| sementara seluruh endpoint backend tetap terpisah rapi di /api/ (routes/api.php).
*/

Route::get('/{any?}', function () {
    return view('app');
})->where('any', '^(?!api).*$');
