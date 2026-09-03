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
        // Secara otomatis hapus file 'public/hot' jika server Vite dev (port 5173) tidak aktif
        // untuk mencegah error ERR_CONNECTION_REFUSED pada browser.
        if (file_exists(public_path('hot'))) {
            $connection = @fsockopen('127.0.0.1', 5173, $errno, $errstr, 0.05);
            if ($connection) {
                fclose($connection);
            } else {
                @unlink(public_path('hot'));
            }
        }
    }
}
