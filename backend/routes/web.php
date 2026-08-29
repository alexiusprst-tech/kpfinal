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
        /** @var \App\Models\User $user */
        $user = Auth::user();
        if ($user->isSuperAdmin()) return redirect()->route('superadmin.dashboard');

        $dosen = $user->dosen;
        if ($dosen) {
            $hasActiveKoor = \App\Models\PenugasanKoordinator::where('dosen_id', $dosen->id)->where('status', 'ACTIVE')->exists();
            $hasActiveVerif = \App\Models\PenugasanVerifikator::where('dosen_id', $dosen->id)->where('status', 'ACTIVE')->exists();

            if ($hasActiveKoor) {
                if ($user->role !== 'KOORDINATOR') {
                    $user->update(['role' => 'KOORDINATOR']);
                    $user->role = 'KOORDINATOR';
                }
                return redirect()->route('koordinator.dashboard');
            } elseif ($hasActiveVerif) {
                if ($user->role !== 'VERIFIKATOR') {
                    $user->update(['role' => 'VERIFIKATOR']);
                    $user->role = 'VERIFIKATOR';
                }
                return redirect()->route('verifikator.dashboard');
            } else {
                if ($user->role !== null) {
                    $user->update(['role' => null]);
                    $user->role = null;
                }
                Auth::logout();
                request()->session()->invalidate();
                request()->session()->regenerateToken();
                return redirect()->route('login')->withErrors([
                    'email' => 'Akun Anda (' . $dosen->nama_lengkap . ') saat ini belum diberikan penugasan aktif (Koordinator/Verifikator).',
                ]);
            }
        }

        if ($user->isVerifikator()) return redirect()->route('verifikator.dashboard');
        if ($user->isKoordinator()) return redirect()->route('koordinator.dashboard');

        Auth::logout();
        request()->session()->invalidate();
        request()->session()->regenerateToken();
        return redirect()->route('login')->withErrors([
            'email' => 'Akun Anda belum memiliki role atau penugasan aktif.',
        ]);
    }
    return view('login');
});

Route::get('/login', [LoginController::class, 'showLoginForm'])->name('login');
Route::post('/login', [LoginController::class, 'login'])->middleware('throttle:5,1');
Route::get('/logout', [LoginController::class, 'logout'])->name('logout');
Route::post('/logout', [LoginController::class, 'logout']);

// Default /dashboard redirect
Route::get('/dashboard', function () {
    if (!Auth::check()) return redirect()->route('login');
    /** @var \App\Models\User $user */
    $user = Auth::user();
    if ($user->isSuperAdmin()) return redirect()->route('superadmin.dashboard');

    $dosen = $user->dosen;
    if ($dosen) {
        $hasActiveKoor = \App\Models\PenugasanKoordinator::where('dosen_id', $dosen->id)->where('status', 'ACTIVE')->exists();
        $hasActiveVerif = \App\Models\PenugasanVerifikator::where('dosen_id', $dosen->id)->where('status', 'ACTIVE')->exists();

        if ($hasActiveKoor) {
            if ($user->role !== 'KOORDINATOR') {
                $user->update(['role' => 'KOORDINATOR']);
                $user->role = 'KOORDINATOR';
            }
            return redirect()->route('koordinator.dashboard');
        } elseif ($hasActiveVerif) {
            if ($user->role !== 'VERIFIKATOR') {
                $user->update(['role' => 'VERIFIKATOR']);
                $user->role = 'VERIFIKATOR';
            }
            return redirect()->route('verifikator.dashboard');
        } else {
            if ($user->role !== null) {
                $user->update(['role' => null]);
                $user->role = null;
            }
            Auth::logout();
            request()->session()->invalidate();
            request()->session()->regenerateToken();
            return redirect()->route('login')->withErrors([
                'email' => 'Akun Anda (' . $dosen->nama_lengkap . ') saat ini belum diberikan penugasan aktif (Koordinator/Verifikator).',
            ]);
        }
    }

    if ($user->isVerifikator()) return redirect()->route('verifikator.dashboard');
    if ($user->isKoordinator()) return redirect()->route('koordinator.dashboard');

    Auth::logout();
    request()->session()->invalidate();
    request()->session()->regenerateToken();
    return redirect()->route('login')->withErrors([
        'email' => 'Akun Anda belum memiliki role atau penugasan aktif.',
    ]);
})->middleware('auth');

// ─── SuperAdmin Routes ────────────────────────────────────────────────────────
Route::middleware(['auth', \App\Http\Middleware\CheckRole::class . ':SUPER_ADMIN'])
    ->prefix('superadmin')
    ->name('superadmin.')
    ->group(function () {
        Route::get('/dashboard', [SuperAdminDashboardController::class, 'index'])->name('dashboard');
        Route::get('/dashboard/export-laporan', [SuperAdminDashboardController::class, 'exportLaporan'])->name('dashboard.export-laporan');

        // Dosen
        Route::post('dosen/{dosen}/cabut-penugasan', [\App\Http\Controllers\SuperAdmin\DosenController::class, 'cabutPenugasan'])->name('dosen.cabut-penugasan');
        Route::resource('dosen', \App\Http\Controllers\SuperAdmin\DosenController::class)->except(['create', 'edit', 'show']);

        // Mata Kuliah
        Route::resource('mata-kuliah', \App\Http\Controllers\SuperAdmin\MataKuliahController::class)->except(['create', 'edit']);

        // PLO
        Route::get('plo/export',     [\App\Http\Controllers\SuperAdmin\PloController::class, 'export'])->name('plo.export');
        Route::get('plo/template',   [\App\Http\Controllers\SuperAdmin\PloController::class, 'template'])->name('plo.template');
        Route::post('plo/import',    [\App\Http\Controllers\SuperAdmin\PloController::class, 'import'])->name('plo.import')->middleware('throttle:15,1');
        Route::post('plo/preview',   [\App\Http\Controllers\SuperAdmin\PloController::class, 'preview'])->name('plo.preview');
        Route::post('plo/confirm',   [\App\Http\Controllers\SuperAdmin\PloController::class, 'confirmImport'])->name('plo.confirm');
        Route::resource('plo', \App\Http\Controllers\SuperAdmin\PloController::class)->except(['create', 'edit', 'show']);

        // CLO
        Route::get('clo/export',     [\App\Http\Controllers\SuperAdmin\CloController::class, 'export'])->name('clo.export');
        Route::get('clo/template',   [\App\Http\Controllers\SuperAdmin\CloController::class, 'template'])->name('clo.template');
        Route::post('clo/import',    [\App\Http\Controllers\SuperAdmin\CloController::class, 'import'])->name('clo.import')->middleware('throttle:15,1');
        Route::post('clo/preview',   [\App\Http\Controllers\SuperAdmin\CloController::class, 'preview'])->name('clo.preview');
        Route::post('clo/confirm',   [\App\Http\Controllers\SuperAdmin\CloController::class, 'confirmImport'])->name('clo.confirm');
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

        // Kelompok Verifikasi (Unified Assignment)
        Route::post('kelompok-verifikasi/{kelompok_verifikasi}/activate', [\App\Http\Controllers\SuperAdmin\KelompokVerifikasiController::class, 'activate'])->name('kelompok-verifikasi.activate');
        Route::post('kelompok-verifikasi/{kelompok_verifikasi}/deactivate', [\App\Http\Controllers\SuperAdmin\KelompokVerifikasiController::class, 'deactivate'])->name('kelompok-verifikasi.deactivate');
        Route::resource('kelompok-verifikasi', \App\Http\Controllers\SuperAdmin\KelompokVerifikasiController::class);
    });

// ─── Koordinator & Dosen Routes ───────────────────────────────────────────────
Route::middleware(['auth', \App\Http\Middleware\CheckRole::class . ':KOORDINATOR,DOSEN'])
    ->prefix('koordinator')
    ->name('koordinator.')
    ->group(function () {
        Route::get('/dashboard', [KoordinatorDashboardController::class, 'index'])->name('dashboard');

        // Mata Kuliah Saya (detail)
        Route::get('mata-kuliah/{mataKuliah}', [\App\Http\Controllers\Koordinator\MataKuliahController::class, 'show'])->name('mata-kuliah.show');

        // Kelola Soal
        Route::get('soal/download/{soal}', [\App\Http\Controllers\Koordinator\SoalController::class, 'download'])->name('soal.download');
        Route::get('soal/{soal}/preview',  [\App\Http\Controllers\Koordinator\SoalController::class, 'preview'])->name('soal.preview');
        Route::post('soal/{soal}/submit',  [\App\Http\Controllers\Koordinator\SoalController::class, 'submit'])->name('soal.submit')->middleware('throttle:30,1');
        Route::post('soal', [\App\Http\Controllers\Koordinator\SoalController::class, 'store'])->name('soal.store')->middleware('throttle:30,1');
        Route::resource('soal', \App\Http\Controllers\Koordinator\SoalController::class)->except(['edit', 'show', 'store']);
        // Registered after the resource so the literal "soal/create" route above still wins that match.
        Route::get('soal/{soal}',      [\App\Http\Controllers\Koordinator\SoalController::class, 'show'])->name('soal.show');
        Route::get('soal/{soal}/edit', [\App\Http\Controllers\Koordinator\SoalController::class, 'edit'])->name('soal.edit');

        // Upload Revisi
        Route::post('revisi/{soal}', [\App\Http\Controllers\Koordinator\RevisiController::class, 'store'])->name('revisi.store')->middleware('throttle:30,1');
        Route::get('revisi/{revisi}/download', [\App\Http\Controllers\Koordinator\RevisiController::class, 'download'])->name('revisi.download');
        Route::get('revisi/{revisi}/preview',  [\App\Http\Controllers\Koordinator\RevisiController::class, 'preview'])->name('revisi.preview');

        // Generator Template Lembar Soal
        Route::get('soal-generator', [\App\Http\Controllers\Koordinator\SoalGeneratorController::class, 'index'])->name('soal.generator');
        Route::get('soal-generator/course-data', [\App\Http\Controllers\Koordinator\SoalGeneratorController::class, 'getCourseData'])->name('soal.generator.course-data');
        Route::post('soal-generator/export-pdf', [\App\Http\Controllers\Koordinator\SoalGeneratorController::class, 'exportPdf'])->name('soal.generator.export-pdf')->middleware('throttle:30,1');
        Route::post('soal-generator/export-docx', [\App\Http\Controllers\Koordinator\SoalGeneratorController::class, 'exportDocx'])->name('soal.generator.export-docx')->middleware('throttle:30,1');
    });

// ─── Verifikator Routes ───────────────────────────────────────────────────────
Route::middleware(['auth', \App\Http\Middleware\CheckRole::class . ':VERIFIKATOR'])
    ->prefix('verifikator')
    ->name('verifikator.')
    ->group(function () {
        Route::get('/dashboard', [VerifikatorDashboardController::class, 'index'])->name('dashboard');

        // Verifikasi Soal
        Route::get('soal/{soal}/download', [\App\Http\Controllers\Verifikator\SoalController::class, 'download'])->name('soal.download');
        Route::get('soal/{soal}/preview',  [\App\Http\Controllers\Verifikator\SoalController::class, 'preview'])->name('soal.preview');
        Route::get('revisi/{revisi}/download', [\App\Http\Controllers\Koordinator\RevisiController::class, 'download'])->name('revisi.download');
        Route::get('revisi/{revisi}/preview',  [\App\Http\Controllers\Koordinator\RevisiController::class, 'preview'])->name('revisi.preview');
        Route::post('soal/{soal}/verifikasi', [\App\Http\Controllers\Verifikator\VerifikasiController::class, 'store'])->name('verifikasi.store')->middleware('throttle:30,1');
        Route::get('soal', [\App\Http\Controllers\Verifikator\SoalController::class, 'index'])->name('soal.index');
        Route::get('soal/{soal}', [\App\Http\Controllers\Verifikator\SoalController::class, 'show'])->name('soal.show');

        // Berita Acara Verifikasi
        Route::get('berita-acara', [\App\Http\Controllers\Verifikator\BeritaAcaraController::class, 'index'])->name('berita-acara.index');
        Route::get('mata-kuliah/{mataKuliah}/berita-acara', [\App\Http\Controllers\Verifikator\BeritaAcaraController::class, 'show'])->name('berita-acara.show');
        Route::get('mata-kuliah/{mataKuliah}/berita-acara/download', [\App\Http\Controllers\Verifikator\BeritaAcaraController::class, 'cetak'])->name('berita-acara.cetak');
        Route::get('soal/{soal}/berita-acara', [\App\Http\Controllers\Verifikator\BeritaAcaraController::class, 'cetakSoal'])->name('berita-acara.cetak-soal');
    });

Route::middleware(['auth'])->group(function () {
    Route::put('password', [\App\Http\Controllers\Auth\PasswordController::class, 'update'])->name('password.update')->middleware('throttle:6,1');
    Route::post('notifications/{notification}/read', [\App\Http\Controllers\NotificationController::class, 'read'])->name('notifications.read');
    Route::post('notifications/read-all', [\App\Http\Controllers\NotificationController::class, 'readAll'])->name('notifications.read-all');

    // Profile
    Route::get('profile', [\App\Http\Controllers\ProfileController::class, 'show'])->name('profile.show');
    Route::put('profile', [\App\Http\Controllers\ProfileController::class, 'updateProfile'])->name('profile.update');
    Route::post('profile/password', [\App\Http\Controllers\ProfileController::class, 'updatePassword'])->name('profile.password')->middleware('throttle:6,1');
    Route::post('profile/signature', [\App\Http\Controllers\ProfileController::class, 'updateSignature'])->name('profile.signature');
    Route::delete('profile/signature', [\App\Http\Controllers\ProfileController::class, 'deleteSignature'])->name('profile.signature.delete');
});

