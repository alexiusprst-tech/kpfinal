<?php

namespace App\Http\Middleware;

use App\Models\PeriodeVerifikasi;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $activePeriod = PeriodeVerifikasi::where('status', 'ACTIVE')->first();
        /** @var User|null $user */
        $user = $request->user();
        $hasActiveKoor = false;
        $hasActiveVerif = false;

        if ($user) {
            if ($user->role === 'SUPER_ADMIN') {
                $hasActiveKoor = true;
                $hasActiveVerif = true;
            } else {
                $dosen = $user->dosen;
                if ($dosen) {
                    $hasActiveKoor = \App\Models\PenugasanKoordinator::where('dosen_id', $dosen->id)->where('status', 'ACTIVE')->exists();
                    $hasActiveVerif = \App\Models\PenugasanVerifikator::where('dosen_id', $dosen->id)->where('status', 'ACTIVE')->exists();

                    // Persist the canonical role via the single source of truth
                    // (Dosen::syncUserRole — see routes/web.php and LoginController
                    // for the other call sites). The role column is nullable.
                    $dosen->syncUserRole();
                    $user->role = $dosen->user->role;

                    // Dosen with BOTH an active koordinator and verifikator
                    // assignment ("dual role") see their in-memory role switch
                    // to match whichever section of the app they're currently
                    // browsing, without touching the persisted value above.
                    if ($request->is('verifikator*') && $hasActiveVerif) {
                        $user->role = 'VERIFIKATOR';
                    } elseif ($request->is('koordinator*') && $hasActiveKoor) {
                        $user->role = 'KOORDINATOR';
                    }
                } else {
                    $hasActiveKoor = ($user->role === 'KOORDINATOR');
                    $hasActiveVerif = ($user->role === 'VERIFIKATOR');
                }
            }
        }

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $user ? [
                    'id'             => $user->id,
                    'name'           => $user->name,
                    'email'          => $user->email,
                    'avatar'         => $user->avatar
                        ? asset('storage/' . $user->avatar) . '?v=' . (\Illuminate\Support\Facades\Storage::disk('public')->exists($user->avatar) ? \Illuminate\Support\Facades\Storage::disk('public')->lastModified($user->avatar) : time())
                        : null,
                    'role'           => $user->role,
                    'is_koordinator'    => (bool)$hasActiveKoor,
                    'is_verifikator'    => (bool)$hasActiveVerif,
                    'has_dual_role'     => (bool)($hasActiveKoor && $hasActiveVerif),
                    'has_no_assignment'            => (bool)($user->role !== 'SUPER_ADMIN' && !$hasActiveKoor && !$hasActiveVerif),
                    'must_change_password'         => (bool)$user->must_change_password,
                    'must_change_password_enforced' => (bool)$user->isMustChangePasswordEnforced(),
                    'dosen' => $user->dosen ? [
                        'id'          => $user->dosen->id,
                        'kode_dosen'  => $user->dosen->kode_dosen,
                        'nip'         => $user->dosen->nip,
                        'nama_lengkap'=> $user->dosen->nama_lengkap,
                    ] : null,
                ] : null,
            ],
            'activePeriod' => $activePeriod ? [
                'id'              => $activePeriod->id,
                'nama'            => $activePeriod->nama,
                'deadline_upload' => $activePeriod->deadline_upload,
                'status'          => $activePeriod->status,
            ] : null,
            'notifications' => ($request->user() && $request->user()->role !== 'SUPER_ADMIN') ? [
                'list' => \App\Models\Notification::where('user_id', $request->user()->id)
                    ->orderBy('created_at', 'desc')
                    ->take(10)
                    ->get(),
                'count' => \App\Models\Notification::where('user_id', $request->user()->id)
                    ->where('is_read', false)
                    ->count()
            ] : null,
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error'   => fn () => $request->session()->get('error'),
            ],
        ]);
    }
}
