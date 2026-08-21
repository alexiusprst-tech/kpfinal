<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class PasswordController extends Controller
{
    public function update(Request $request)
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password'         => ['required', 'string', 'min:8', 'confirmed', Password::defaults()],
        ], [
            'current_password.current_password' => 'Password saat ini yang Anda masukkan tidak sesuai.',
            'password.min'                     => 'Password baru minimal harus 8 karakter.',
            'password.confirmed'               => 'Konfirmasi password baru tidak cocok.',
        ]);

        $user = $request->user();
        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        AuditLog::record($user->id, 'CHANGE_PASSWORD', 'User', $user->id);

        return back()->with('success', 'Password Anda berhasil diperbarui.');
    }
}
