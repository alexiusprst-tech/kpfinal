<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return redirect()->route('login');
        }

        if (!$user->isActive()) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            return redirect()->route('login')->withErrors([
                'email' => 'Akun Anda sedang tidak aktif. Hubungi administrator.',
            ]);
        }

        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        $dosen = $user->dosen;
        if ($dosen) {
            $hasActiveVerif = \App\Models\PenugasanVerifikator::where('dosen_id', $dosen->id)->where('status', 'ACTIVE')->exists();
            $hasActiveKoor = \App\Models\PenugasanKoordinator::where('dosen_id', $dosen->id)->where('status', 'ACTIVE')->exists();

            if (in_array('VERIFIKATOR', $roles) && $hasActiveVerif) {
                return $next($request);
            }

            if (in_array('KOORDINATOR', $roles) && $hasActiveKoor) {
                return $next($request);
            }

            // Allow dosen without active assignment to access dashboard pages and soal index (GET only)
            if ($request->isMethod('GET') && $request->routeIs(
                'koordinator.dashboard',
                'verifikator.dashboard',
                'koordinator.soal.index',
                'koordinator.soal.create',
                'koordinator.soal.show',
                'koordinator.mata-kuliah.show'
            )) {
                return $next($request);
            }

            // Dosen does not have active assignment for this role
            abort(403, 'Anda belum memiliki penugasan aktif untuk mengakses halaman ini.');
        }

        if ($user->role && in_array($user->role, $roles)) {
            return $next($request);
        }

        abort(403, 'Anda tidak memiliki akses ke halaman ini.');

        return $next($request);
    }
}
