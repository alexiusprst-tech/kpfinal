<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class ProfileController extends Controller
{
    /**
     * Show the profile page.
     */
    public function show()
    {
        $user  = Auth::user();
        $dosen = $user->dosen;

        return Inertia::render('Profile/Index', [
            'user'  => $user,
            'dosen' => $dosen ? [
                'id'              => $dosen->id,
                'kode_dosen'      => $dosen->kode_dosen,
                'nama_lengkap'    => $dosen->nama_lengkap,
                'email'           => $dosen->email,
                'kategori_dosen'  => $dosen->kategori_dosen,
                'status'          => $dosen->status,
                'tanda_tangan'    => $dosen->tanda_tangan
                    ? asset('storage/' . $dosen->tanda_tangan)
                    : null,
                'tanda_tangan_path' => $dosen->tanda_tangan,
            ] : null,
        ]);
    }

    /**
     * Update basic profile data (name on User + dosen fields).
     */
    public function updateProfile(Request $request)
    {
        $user  = Auth::user();
        $dosen = $user->dosen;

        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'kode_dosen'     => 'nullable|string|max:20',
            'email_dosen'    => 'nullable|email|max:255',
            'kategori_dosen' => 'nullable|in:TETAP,LUAR_BIASA',
        ]);

        // Update user name
        $user->update(['name' => $validated['name']]);

        // Update dosen fields if dosen record exists
        if ($dosen) {
            $dosen->update([
                'nama_lengkap'   => $validated['name'],
                'kode_dosen'     => $validated['kode_dosen']  ?? $dosen->kode_dosen,
                'email'          => $validated['email_dosen'] ?? $dosen->email,
                'kategori_dosen' => $validated['kategori_dosen'] ?? $dosen->kategori_dosen,
            ]);
        }

        return back()->with('success', 'Profil berhasil diperbarui.');
    }

    /**
     * Update password.
     */
    public function updatePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password'         => ['required', 'confirmed', Password::min(8)->mixedCase()->numbers()],
        ], [
            'current_password.current_password' => 'Password saat ini tidak sesuai.',
            'password.min'         => 'Password baru minimal 8 karakter.',
            'password.confirmed'   => 'Konfirmasi password tidak cocok.',
        ]);

        Auth::user()->update([
            'password' => Hash::make($validated['password']),
        ]);

        return back()->with('success', 'Password berhasil diperbarui.');
    }

    /**
     * Upload signature image.
     */
    public function updateSignature(Request $request)
    {
        $request->validate([
            'tanda_tangan' => 'required|image|mimes:png,jpg,jpeg|max:2048',
        ], [
            'tanda_tangan.required' => 'File tanda tangan wajib dipilih.',
            'tanda_tangan.image'    => 'File harus berupa gambar.',
            'tanda_tangan.mimes'    => 'Format file harus PNG, JPG, atau JPEG.',
            'tanda_tangan.max'      => 'Ukuran file maksimal 2 MB.',
        ]);

        $user  = Auth::user();
        $dosen = $user->dosen;

        if (!$dosen) {
            return back()->withErrors(['tanda_tangan' => 'Hanya dosen yang dapat mengunggah tanda tangan.']);
        }

        // Delete old signature
        if ($dosen->tanda_tangan && Storage::disk('public')->exists($dosen->tanda_tangan)) {
            Storage::disk('public')->delete($dosen->tanda_tangan);
        }

        // Store new
        $path = $request->file('tanda_tangan')->store('tanda-tangan', 'public');
        $dosen->update(['tanda_tangan' => $path]);

        return back()->with('success', 'Tanda tangan berhasil diperbarui.');
    }

    /**
     * Delete signature.
     */
    public function deleteSignature()
    {
        $user  = Auth::user();
        $dosen = $user->dosen;

        if (!$dosen || !$dosen->tanda_tangan) {
            return back()->withErrors(['tanda_tangan' => 'Tidak ada tanda tangan untuk dihapus.']);
        }

        if (Storage::disk('public')->exists($dosen->tanda_tangan)) {
            Storage::disk('public')->delete($dosen->tanda_tangan);
        }

        $dosen->update(['tanda_tangan' => null]);

        return back()->with('success', 'Tanda tangan berhasil dihapus.');
    }
}
