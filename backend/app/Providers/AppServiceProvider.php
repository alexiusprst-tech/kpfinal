<?php

namespace App\Providers;

use App\Models\KelompokKoordinator;
use App\Models\KelompokVerifikator;
use App\Observers\KelompokKoordinatorObserver;
use App\Observers\KelompokVerifikatorObserver;
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
        // Safety net: log (don't auto-fix) drift between KelompokKoordinator/
        // KelompokVerifikator and their PenugasanKoordinator/PenugasanVerifikator
        // operational counterparts — see the observers for full rationale.
        KelompokKoordinator::observe(KelompokKoordinatorObserver::class);
        KelompokVerifikator::observe(KelompokVerifikatorObserver::class);

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
