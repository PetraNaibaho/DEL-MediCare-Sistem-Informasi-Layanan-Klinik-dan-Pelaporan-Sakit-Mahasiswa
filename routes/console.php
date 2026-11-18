<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Tutup batch penjemputan yang window 15 menitnya sudah habis.
// Jalankan scheduler: `php artisan schedule:work` (dev) atau cron `* * * * * php artisan schedule:run` (prod).
Schedule::command('medicare:close-batches')->everyMinute()->withoutOverlapping();
