<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Models\User;
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
        /** @var User $user */
        $user  = Auth::user();
        $dosen = $user->dosen;
        $isSuperAdmin = $user->isSuperAdmin();

        $kaprodiData = null;
        if ($isSuperAdmin) {
            $kaprodiSignaturePath = Setting::get('kaprodi_tanda_tangan');
            if (!$kaprodiSignaturePath && Storage::disk('public')->exists('tanda-tangan/kaprodi_signature.png')) {
                $kaprodiSignaturePath = 'tanda-tangan/kaprodi_signature.png';
            }

            $kaprodiSignatureUrl = null;
            if ($kaprodiSignaturePath && Storage::disk('public')->exists($kaprodiSignaturePath)) {
                $kaprodiSignatureUrl = asset('storage/' . $kaprodiSignaturePath) . '?v=' . Storage::disk('public')->lastModified($kaprodiSignaturePath);
            }

            $kaprodiData = [
                'nama'              => Setting::get('kaprodi_nama', config('app.kaprodi', env('KAPRODI_NAME', 'Qilbaaini Effendi Muftikhali, S.Kom., M.Kom.'))),
                'tanda_tangan'      => $kaprodiSignatureUrl,
                'tanda_tangan_path' => $kaprodiSignaturePath,
            ];
        }

        return Inertia::render('Profile/Index', [
            'user'  => [
                'id'                            => $user->id,
                'name'                          => $user->name,
                'email'                         => $user->email,
                'role'                          => $user->role,
                'status'                        => $user->status,
                'must_change_password'          => (bool) $user->must_change_password,
                'must_change_password_enforced' => (bool) $user->isMustChangePasswordEnforced(),
            ],
            'dosen' => $dosen ? [
                'id'              => $dosen->id,
                'kode_dosen'      => $dosen->kode_dosen,
                'nama_lengkap'    => $dosen->nama_lengkap,
                'email'           => $dosen->email,
                'kategori_dosen'  => $dosen->kategori_dosen,
                'status'          => $dosen->status,
                'tanda_tangan'    => $dosen->tanda_tangan
                    ? asset('storage/' . $dosen->tanda_tangan) . '?v=' . (Storage::disk('public')->exists($dosen->tanda_tangan) ? Storage::disk('public')->lastModified($dosen->tanda_tangan) : time())
                    : null,
                'tanda_tangan_path' => $dosen->tanda_tangan,
            ] : null,
            'kaprodi' => $kaprodiData,
        ]);
    }

    /**
     * Update basic profile data (name on User + dosen fields / kaprodi fields).
     */
    public function updateProfile(Request $request)
    {
        /** @var User $user */
        $user  = Auth::user();
        $dosen = $user->dosen;

        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'kode_dosen'     => 'nullable|string|max:20',
            'email_dosen'    => 'nullable|email|max:255',
            'kategori_dosen' => 'nullable|in:TETAP,LUAR_BIASA',
            'kaprodi_nama'   => 'nullable|string|max:255',
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

        // Update KaProdi name if Super Admin
        if ($user->isSuperAdmin() && !empty($validated['kaprodi_nama'])) {
            Setting::set('kaprodi_nama', trim($validated['kaprodi_nama']));
        }

        return back()->with('success', 'Profil berhasil diperbarui.');
    }

    /**
     * Update password.
     */
    public function updatePassword(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();
        $isEnforced = $user instanceof User && $user->isMustChangePasswordEnforced();

        $rules = [
            'password' => ['required', 'confirmed', Password::min(8)],
        ];

        if (!$isEnforced) {
            $rules['current_password'] = ['required', 'current_password'];
        }

        $validated = $request->validate($rules, [
            'current_password.current_password' => 'Password saat ini tidak sesuai.',
            'password.min'                       => 'Password baru minimal 8 karakter.',
            'password.confirmed'                 => 'Konfirmasi password tidak cocok.',
        ]);

        $user->update([
            'password'             => Hash::make($validated['password']),
            'must_change_password' => false,
        ]);

        return back()->with('success', 'Password berhasil diperbarui. Sekarang Anda dapat menggunakan seluruh fitur aplikasi.');
    }

    /**
     * Upload signature image (Dosen signature or KaProdi signature if Super Admin).
     */
    public function updateSignature(Request $request)
    {
        $request->validate([
            'tanda_tangan' => 'required|image|mimes:png,jpg,jpeg|max:2048',
            'kaprodi_nama' => 'nullable|string|max:255',
        ], [
            'tanda_tangan.required' => 'File tanda tangan wajib dipilih.',
            'tanda_tangan.image'    => 'File harus berupa gambar.',
            'tanda_tangan.mimes'    => 'Format file harus PNG, JPG, atau JPEG.',
            'tanda_tangan.max'      => 'Ukuran file maksimal 2 MB.',
        ]);

        /** @var User $user */
        $user  = Auth::user();
        $dosen = $user->dosen;

        if ($user->isSuperAdmin()) {
            // Delete old KaProdi signature file if exists
            $oldPath = Setting::get('kaprodi_tanda_tangan');
            if ($oldPath && Storage::disk('public')->exists($oldPath)) {
                Storage::disk('public')->delete($oldPath);
            }

            // Also check default filename fallbacks to clean up
            $defaultFiles = ['tanda-tangan/kaprodi_signature.png', 'tanda-tangan/kaprodi_signature.jpg', 'tanda-tangan/kaprodi_signature.jpeg'];
            foreach ($defaultFiles as $df) {
                if (Storage::disk('public')->exists($df)) {
                    Storage::disk('public')->delete($df);
                }
            }

            $ext = $request->file('tanda_tangan')->getClientOriginalExtension() ?: 'png';
            $path = $request->file('tanda_tangan')->storeAs('tanda-tangan', 'kaprodi_signature_' . time() . '.' . $ext, 'public');
            Setting::set('kaprodi_tanda_tangan', $path);

            if ($request->filled('kaprodi_nama')) {
                Setting::set('kaprodi_nama', trim($request->input('kaprodi_nama')));
            }

            return back()->with('success', 'Tanda tangan Ka. Prodi berhasil disimpan.');
        }

        if (!$dosen) {
            return back()->withErrors(['tanda_tangan' => 'Hanya dosen atau superadmin yang dapat mengunggah tanda tangan.']);
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
        /** @var User $user */
        $user  = Auth::user();
        $dosen = $user->dosen;

        if ($user->isSuperAdmin()) {
            $path = Setting::get('kaprodi_tanda_tangan');
            if ($path && Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }

            $defaultFiles = ['tanda-tangan/kaprodi_signature.png', 'tanda-tangan/kaprodi_signature.jpg', 'tanda-tangan/kaprodi_signature.jpeg'];
            foreach ($defaultFiles as $df) {
                if (Storage::disk('public')->exists($df)) {
                    Storage::disk('public')->delete($df);
                }
            }

            Setting::set('kaprodi_tanda_tangan', null);

            return back()->with('success', 'Tanda tangan Ka. Prodi berhasil dihapus.');
        }

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

