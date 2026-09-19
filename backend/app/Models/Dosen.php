<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Dosen extends Model
{
    use SoftDeletes, HasUuids;

    protected $table = 'dosen';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'kode_dosen',
        'nip',
        'nama_lengkap',
        'email',
        'kategori_dosen',
        'user_id',
        'status',
        'tanda_tangan',
    ];

    protected $appends = [
        'is_dosen_tetap',
    ];

    public function getNamaAttribute()
    {
        return $this->nama_lengkap;
    }

    public function getIsDosenTetapAttribute(): bool
    {
        return $this->isDosenTetap();
    }

    /**
     * Cek apakah dosen merupakan Dosen Tetap.
     */
    public function isDosenTetap(): bool
    {
        $kategori = strtoupper(trim($this->kategori_dosen ?? ''));
        return !in_array($kategori, ['LB', 'LUAR_BIASA', 'DOSEN LUAR BIASA']);
    }

    /**
     * Scope query hanya untuk dosen tetap.
     */
    public function scopeTetap($query)
    {
        return $query->where(function ($q) {
            $q->whereNotIn(\Illuminate\Support\Facades\DB::raw('UPPER(TRIM(kategori_dosen))'), ['LB', 'LUAR_BIASA', 'DOSEN LUAR BIASA'])
              ->orWhereNull('kategori_dosen');
        });
    }

    // ─── Relationships ─────────────────────────────────────────────────────────

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function penugasanKoordinator()
    {
        return $this->hasMany(PenugasanKoordinator::class, 'dosen_id');
    }

    public function penugasanVerifikator()
    {
        return $this->hasMany(PenugasanVerifikator::class, 'dosen_id');
    }

    public function beritaAcara()
    {
        return $this->hasMany(BeritaAcara::class, 'koordinator_id');
    }

    public function kelompokKoordinator()
    {
        return $this->hasMany(KelompokMataKuliah::class, 'koordinator_id');
    }

    public function kelompokVerifikator()
    {
        return $this->hasMany(KelompokVerifikator::class, 'dosen_id');
    }

    // ─── Role Synchronization (single source of truth) ────────────────────────

    /**
     * Recalculate and persist this dosen's user role based on their current
     * ACTIVE assignments. A dosen with no active assignment gets role = null
     * (the users.role column is nullable — see migration
     * 2026_08_23_000002_sync_dosen_roles_based_on_active_assignments).
     */
    public function syncUserRole(): void
    {
        if (!$this->user || $this->user->role === 'SUPER_ADMIN') {
            return;
        }

        $hasActiveKoor = PenugasanKoordinator::where('dosen_id', $this->id)->where('status', 'ACTIVE')->exists();
        $hasActiveVerif = PenugasanVerifikator::where('dosen_id', $this->id)->where('status', 'ACTIVE')->exists();

        $newRole = $hasActiveKoor ? 'KOORDINATOR' : ($hasActiveVerif ? 'VERIFIKATOR' : null);

        if ($this->user->role !== $newRole) {
            $this->user->update(['role' => $newRole]);
        }
    }

    /**
     * Recalculate and persist user role for every dosen. Used whenever an
     * operational assignment changes in bulk (kelompok verifikasi
     * create/update/activate/deactivate/close, penugasan revocation).
     */
    public static function syncAllUserRoles(): void
    {
        static::with('user')->get()->each(fn (Dosen $dosen) => $dosen->syncUserRole());
    }
}
