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
}
