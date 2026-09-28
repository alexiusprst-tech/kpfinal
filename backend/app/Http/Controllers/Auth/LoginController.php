<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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

        // Look up by email, kode_dosen, or nip (case-insensitive)
        $dosen = \App\Models\Dosen::whereRaw('LOWER(email) = ?', [strtolower($input)])
            ->orWhere(function ($q) use ($input) {
                $q->whereNotNull('kode_dosen')
                  ->where('kode_dosen', '!=', '')
                  ->whereRaw('LOWER(kode_dosen) = ?', [strtolower($input)]);
            })
            ->orWhere(function ($q) use ($input) {
                $q->whereNotNull('nip')
                  ->where('nip', '!=', '')
                  ->where('nip', $input);
            })
            ->first();

        $emailToAuth = $input;

        if ($dosen) {
            $emailToAuth = $dosen->email ?: (!empty($dosen->kode_dosen) ? strtolower($dosen->kode_dosen) . '@telkomuniversity.ac.id' : $input);

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

                $initialPassword = !empty($dosen->nip) ? trim($dosen->nip) : (!empty($dosen->kode_dosen) ? trim($dosen->kode_dosen) : 'password');
                $user = \App\Models\User::firstOrCreate(
                    ['email' => $emailToAuth],
                    [
                        'id'                   => (string) \Illuminate\Support\Str::uuid(),
                        'name'                 => $dosen->nama_lengkap,
                        'password'             => \Illuminate\Support\Facades\Hash::make($initialPassword),
                        'role'                 => $initialRole,
                        'status'               => 'ACTIVE',
                        'must_change_password' => true,
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
            'email' => 'Email / NIP / Kode Dosen atau password yang Anda masukkan salah.',
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

        $dosen->syncUserRole();
        $user->role = $dosen->user->role;
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
                // Dosen belum mendapatkan penugasan aktif: izinkan login dan arahkan ke dashboard
                return redirect()->route('koordinator.dashboard');
            }
        }

        if ($user->role === 'VERIFIKATOR') {
            return redirect()->route('verifikator.dashboard');
        } elseif ($user->role === 'KOORDINATOR') {
            return redirect()->route('koordinator.dashboard');
        }

        return redirect()->route('koordinator.dashboard');
    }
}
