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
            return $this->redirectByRole(Auth::user());
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

        // Look up by email or kode_dosen
        $dosen = \App\Models\Dosen::where('email', 'ilike', $input)
            ->orWhere('kode_dosen', 'ilike', $input)
            ->first();

        $emailToAuth = $input;

        if ($dosen) {
            $emailToAuth = $dosen->email ?: strtolower($dosen->kode_dosen) . '@telkomuniversity.ac.id';

            // Auto-provision user account if not created yet
            if (!$dosen->user_id || !\App\Models\User::where('id', $dosen->user_id)->exists()) {
                $user = \App\Models\User::firstOrCreate(
                    ['email' => $emailToAuth],
                    [
                        'id'       => (string) \Illuminate\Support\Str::uuid(),
                        'name'     => $dosen->nama_lengkap,
                        'password' => \Illuminate\Support\Facades\Hash::make('password'),
                        'role'     => 'KOORDINATOR',
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

            $user = Auth::user();

            if (!$user->isActive()) {
                Auth::logout();
                return back()->withErrors([
                    'email' => 'Akun Anda tidak aktif. Silakan hubungi administrator.',
                ]);
            }

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

    protected function redirectByRole($user)
    {
        switch ($user->role) {
            case 'SUPER_ADMIN':
                return redirect()->route('superadmin.dashboard');
            case 'KOORDINATOR':
                return redirect()->route('koordinator.dashboard');
            case 'VERIFIKATOR':
                return redirect()->route('verifikator.dashboard');
            default:
                return redirect('/login');
        }
    }
}
