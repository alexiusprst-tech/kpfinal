<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class LoginController extends Controller
{
    public function showLoginForm()
    {
        if (Auth::check()) {
            /** @var \App\Models\User $user */
            $user = Auth::user();
            $this->syncDosenRole($user);
            return $this->redirectByRole($user);
        }

        return view('login'); // blade or inertia
    }

    public function login(Request $request)
    {
        $request->validate([
            'email'    => ['required', 'string'],
            'password' => ['required'],
        ]);

        $input = trim($request->input('email'));
        $password = $request->input('password');

        // Look up by email or kode_dosen (case-insensitive)
        $dosen = \App\Models\Dosen::whereRaw('LOWER(email) = ?', [strtolower($input)])
            ->orWhereRaw('LOWER(kode_dosen) = ?', [strtolower($input)])
            ->first();

        $emailToAuth = $input;

        if ($dosen) {
            $emailToAuth = $dosen->email ?: strtolower($dosen->kode_dosen) . '@telkomuniversity.ac.id';

            // Auto-provision user account if not created yet
            if (!$dosen->user_id || !\App\Models\User::where('id', $dosen->user_id)->exists()) {
                $hasActiveKoor = \App\Models\PenugasanKoordinator::where('dosen_id', $dosen->id)->where('status', 'ACTIVE')->exists();
                $hasActiveVerif = \App\Models\PenugasanVerifikator::where('dosen_id', $dosen->id)->where('status', 'ACTIVE')->exists();
                
                $initialRole = null;
                if ($hasActiveKoor) {
                    $initialRole = 'KOORDINATOR';
                } elseif ($hasActiveVerif) {
                    $initialRole = 'VERIFIKATOR';
                }

                $user = \App\Models\User::firstOrCreate(
                    ['email' => $emailToAuth],
                    [
                        'id'       => (string) \Illuminate\Support\Str::uuid(),
                        'name'     => $dosen->nama_lengkap,
                        'password' => \Illuminate\Support\Facades\Hash::make('password'),
                        'role'     => $initialRole,
                        'status'   => 'ACTIVE',
                    ]
                );
                $dosen->update([
                    'email'   => $emailToAuth,
                    'user_id' => $user->id,
                ]);
            }
        }

        $credentials = [
            'email'    => $emailToAuth,
            'password' => $password,
        ];

        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            $request->session()->regenerate();

            /** @var \App\Models\User $user */
            $user = Auth::user();

            if (!$user->isActive()) {
                Auth::logout();
                return back()->withErrors([
                    'email' => 'Akun Anda tidak aktif. Silakan hubungi administrator.',
                ]);
            }

            $this->syncDosenRole($user);

            return $this->redirectByRole($user);
        }

        return back()->withErrors([
            'email' => 'Email/Kode Dosen atau password yang Anda masukkan salah.',
        ])->onlyInput('email');
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }

    /**
     * @param \App\Models\User|null $user
     */
    protected function syncDosenRole($user): void
    {
        if (!$user || $user->role === 'SUPER_ADMIN') {
            return;
        }

        $dosen = $user->dosen;
        if (!$dosen) {
            return;
        }

        $activeKoor = \App\Models\PenugasanKoordinator::where('dosen_id', $dosen->id)
            ->where('status', 'ACTIVE')
            ->exists();

        $activeVerif = \App\Models\PenugasanVerifikator::where('dosen_id', $dosen->id)
            ->where('status', 'ACTIVE')
            ->exists();

        if ($activeKoor) {
            if ($user->role !== 'KOORDINATOR') {
                $user->update(['role' => 'KOORDINATOR']);
                $user->role = 'KOORDINATOR';
            }
        } elseif ($activeVerif) {
            if ($user->role !== 'VERIFIKATOR') {
                $user->update(['role' => 'VERIFIKATOR']);
                $user->role = 'VERIFIKATOR';
            }
        } else {
            // Dosen tidak memiliki penugasan aktif apapun -> role null
            if ($user->role !== null) {
                $user->update(['role' => null]);
                $user->role = null;
            }
        }
    }

    /**
     * @param \App\Models\User $user
     */
    protected function redirectByRole($user)
    {
        if ($user->role === 'SUPER_ADMIN') {
            return redirect()->route('superadmin.dashboard');
        }

        $dosen = $user->dosen;
        if ($dosen) {
            $hasActiveKoor = \App\Models\PenugasanKoordinator::where('dosen_id', $dosen->id)->where('status', 'ACTIVE')->exists();
            $hasActiveVerif = \App\Models\PenugasanVerifikator::where('dosen_id', $dosen->id)->where('status', 'ACTIVE')->exists();

            if ($hasActiveKoor) {
                return redirect()->route('koordinator.dashboard');
            } elseif ($hasActiveVerif) {
                return redirect()->route('verifikator.dashboard');
            } else {
                // Dosen belum mendapatkan penugasan apapun
                Auth::logout();
                request()->session()->invalidate();
                request()->session()->regenerateToken();
                return redirect()->route('login')->withErrors([
                    'email' => 'Akun Anda (' . $dosen->nama_lengkap . ') saat ini belum diberikan penugasan aktif (Koordinator/Verifikator). Silakan hubungi Super Admin.',
                ]);
            }
        }

        if ($user->role === 'VERIFIKATOR') {
            return redirect()->route('verifikator.dashboard');
        } elseif ($user->role === 'KOORDINATOR') {
            return redirect()->route('koordinator.dashboard');
        }

        Auth::logout();
        request()->session()->invalidate();
        request()->session()->regenerateToken();
        return redirect()->route('login')->withErrors([
            'email' => 'Akun Anda belum memiliki role atau penugasan aktif. Silakan hubungi Super Admin.',
        ]);
    }
}
