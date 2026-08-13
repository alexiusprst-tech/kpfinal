<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\SuperAdmin\DashboardController as SuperAdminDashboardController;
use App\Http\Controllers\Koordinator\DashboardController as KoordinatorDashboardController;
use App\Http\Controllers\Verifikator\DashboardController as VerifikatorDashboardController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

// ─── Guest Routes ─────────────────────────────────────────────────────────────
Route::get('/', function () {
    if (Auth::check()) {
        $user = Auth::user();
        if ($user->isSuperAdmin()) return redirect()->route('superadmin.dashboard');
        if ($user->isKoordinator()) return redirect()->route('koordinator.dashboard');
        if ($user->isVerifikator()) return redirect()->route('verifikator.dashboard');
    }
    return view('login');
});

Route::get('/login', [LoginController::class, 'showLoginForm'])->name('login');
Route::post('/login', [LoginController::class, 'login']);
Route::get('/logout', [LoginController::class, 'logout'])->name('logout');
Route::post('/logout', [LoginController::class, 'logout']);

// Default /dashboard redirect
Route::get('/dashboard', function () {
    if (!Auth::check()) return redirect()->route('login');
    $user = Auth::user();
    if ($user->isSuperAdmin()) return redirect()->route('superadmin.dashboard');
    if ($user->isKoordinator()) return redirect()->route('koordinator.dashboard');
    if ($user->isVerifikator()) return redirect()->route('verifikator.dashboard');
    return redirect()->route('login');
})->middleware('auth');

// ─── SuperAdmin Routes ────────────────────────────────────────────────────────
Route::middleware(['auth', \App\Http\Middleware\CheckRole::class . ':SUPER_ADMIN'])
    ->prefix('superadmin')
    ->name('superadmin.')
    ->group(function () {
        Route::get('/dashboard', [SuperAdminDashboardController::class, 'index'])->name('dashboard');

        // Dosen
        Route::resource('dosen', \App\Http\Controllers\SuperAdmin\DosenController::class)->except(['create', 'edit', 'show']);

        // Mata Kuliah
        Route::resource('mata-kuliah', \App\Http\Controllers\SuperAdmin\MataKuliahController::class)->except(['create', 'edit', 'show']);

        // PLO
        Route::get('plo/export',   [\App\Http\Controllers\SuperAdmin\PloController::class, 'export'])->name('plo.export');
        Route::get('plo/template', [\App\Http\Controllers\SuperAdmin\PloController::class, 'template'])->name('plo.template');
        Route::post('plo/import',  [\App\Http\Controllers\SuperAdmin\PloController::class, 'import'])->name('plo.import');
        Route::resource('plo', \App\Http\Controllers\SuperAdmin\PloController::class)->except(['create', 'edit', 'show']);

        // CLO
        Route::get('clo/export',   [\App\Http\Controllers\SuperAdmin\CloController::class, 'export'])->name('clo.export');
        Route::get('clo/template', [\App\Http\Controllers\SuperAdmin\CloController::class, 'template'])->name('clo.template');
        Route::post('clo/import',  [\App\Http\Controllers\SuperAdmin\CloController::class, 'import'])->name('clo.import');
        Route::resource('clo', \App\Http\Controllers\SuperAdmin\CloController::class)->except(['create', 'edit', 'show']);

        // Kategori Soal
        Route::resource('kategori-soal', \App\Http\Controllers\SuperAdmin\KategoriSoalController::class)->except(['create', 'edit', 'show']);
        Route::get('kategori-soal/{kategori_soal}', [\App\Http\Controllers\SuperAdmin\KategoriSoalController::class, 'show'])->name('kategori-soal.show');

        // Tahun Ajaran & Periode
        Route::resource('tahun-ajaran', \App\Http\Controllers\SuperAdmin\TahunAjaranController::class)->except(['create', 'edit', 'show']);
        Route::get('tahun-ajaran/{tahun_ajaran}', [\App\Http\Controllers\SuperAdmin\TahunAjaranController::class, 'show'])->name('tahun-ajaran.show');
        Route::post('periode/{periode}/activate',  [\App\Http\Controllers\SuperAdmin\PeriodeController::class, 'activate'])->name('periode.activate');
        Route::post('periode/{periode}/close',     [\App\Http\Controllers\SuperAdmin\PeriodeController::class, 'close'])->name('periode.close');
        Route::resource('periode', \App\Http\Controllers\SuperAdmin\PeriodeController::class)->except(['create', 'edit', 'show']);
        Route::get('periode/{periode}', [\App\Http\Controllers\SuperAdmin\PeriodeController::class, 'show'])->name('periode.show');

        // Penugasan Koordinator
        Route::resource('penugasan-koordinator', \App\Http\Controllers\SuperAdmin\PenugasanKoordinatorController::class)->except(['create', 'edit', 'show']);

        // Penugasan Verifikator
        Route::resource('penugasan-verifikator', \App\Http\Controllers\SuperAdmin\PenugasanVerifikatorController::class)->except(['create', 'edit', 'show']);
    });

// ─── Koordinator Routes ───────────────────────────────────────────────────────
Route::middleware(['auth', \App\Http\Middleware\CheckRole::class . ':KOORDINATOR'])
    ->prefix('koordinator')
    ->name('koordinator.')
    ->group(function () {
        Route::get('/dashboard', [KoordinatorDashboardController::class, 'index'])->name('dashboard');

        // Mata Kuliah Saya (detail)
        Route::get('mata-kuliah/{mataKuliah}', [\App\Http\Controllers\Koordinator\MataKuliahController::class, 'show'])->name('mata-kuliah.show');

        // Kelola Soal
        Route::get('soal/download/{soal}', [\App\Http\Controllers\Koordinator\SoalController::class, 'download'])->name('soal.download');
        Route::post('soal/{soal}/submit',  [\App\Http\Controllers\Koordinator\SoalController::class, 'submit'])->name('soal.submit');
        Route::resource('soal', \App\Http\Controllers\Koordinator\SoalController::class)->except(['edit', 'show']);
        // Registered after the resource so the literal "soal/create" route above still wins that match.
        Route::get('soal/{soal}',      [\App\Http\Controllers\Koordinator\SoalController::class, 'show'])->name('soal.show');
        Route::get('soal/{soal}/edit', [\App\Http\Controllers\Koordinator\SoalController::class, 'edit'])->name('soal.edit');

        // Upload Revisi
        Route::post('revisi/{soal}', [\App\Http\Controllers\Koordinator\RevisiController::class, 'store'])->name('revisi.store');
        Route::get('revisi/{revisi}/download', [\App\Http\Controllers\Koordinator\RevisiController::class, 'download'])->name('revisi.download');
    });

// ─── Verifikator Routes ───────────────────────────────────────────────────────
Route::middleware(['auth', \App\Http\Middleware\CheckRole::class . ':VERIFIKATOR'])
    ->prefix('verifikator')
    ->name('verifikator.')
    ->group(function () {
        Route::get('/dashboard', [VerifikatorDashboardController::class, 'index'])->name('dashboard');

        // Verifikasi Soal
        Route::get('soal/{soal}/download', [\App\Http\Controllers\Verifikator\SoalController::class, 'download'])->name('soal.download');
        Route::post('soal/{soal}/verifikasi', [\App\Http\Controllers\Verifikator\VerifikasiController::class, 'store'])->name('verifikasi.store');
        Route::get('soal', [\App\Http\Controllers\Verifikator\SoalController::class, 'index'])->name('soal.index');
        Route::get('soal/{soal}', [\App\Http\Controllers\Verifikator\SoalController::class, 'show'])->name('soal.show');
    });
