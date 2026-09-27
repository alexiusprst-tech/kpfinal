<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class KelompokVerifikasi extends Model
{
    use HasUuids;

    protected $table = 'kelompok_verifikasi';
    protected $keyType = 'string';
    public $incrementing = false;

    // ─── Status Constants ──────────────────────────────────────────────────────
    const STATUS_DRAFT                = 'DRAFT';
    const STATUS_ACTIVE               = 'ACTIVE';
    const STATUS_INACTIVE             = 'INACTIVE';
    const STATUS_CLOSED               = 'CLOSED';
    // Alias untuk kompatibilitas
    const STATUS_MENUNGGU_VERIFIKATOR = 'DRAFT';

    protected $fillable = [
        'nama',
        'periode_id',
        'status',
        'keterangan',
        'created_by',
    ];

    // ─── Status Helpers ────────────────────────────────────────────────────────

    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT || $this->status === 'MENUNGGU_VERIFIKATOR';
    }

    public function isMenungguVerifikator(): bool
    {
        return $this->isDraft();
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function isInactive(): bool
    {
        return $this->status === self::STATUS_INACTIVE;
    }

    public function isClosed(): bool
    {
        return $this->status === self::STATUS_CLOSED;
    }

    /**
     * Apakah kelompok masih dapat diubah (belum CLOSED).
     */
    public function isMutable(): bool
    {
        return $this->status !== self::STATUS_CLOSED;
    }

    /**
     * Apakah koordinator masih bisa menentukan verifikator pada kelompok ini.
     * Valid untuk status DRAFT atau jika kelompok ACTIVE namun masih ada MK yang belum memiliki verifikator.
     */
    public function canAssignVerifikator(): bool
    {
        if ($this->isDraft()) {
            return true;
        }

        if ($this->isActive()) {
            $allMkIds = $this->mataKuliah()->pluck('mata_kuliah_id')->toArray();
            $mkWithVerif = $this->verifikator()->distinct('mata_kuliah_id')->pluck('mata_kuliah_id')->toArray();
            return !empty(array_diff($allMkIds, $mkWithVerif));
        }

        return false;
    }

    // ─── Relationships ─────────────────────────────────────────────────────────
    public function periode()
    {
        return $this->belongsTo(PeriodeVerifikasi::class, 'periode_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function mataKuliah()
    {
        return $this->hasMany(KelompokMataKuliah::class, 'kelompok_id');
    }

    public function koordinator()
    {
        return $this->hasMany(KelompokKoordinator::class, 'kelompok_id');
    }

    public function verifikator()
    {
        return $this->hasMany(KelompokVerifikator::class, 'kelompok_id');
    }

    public function penugasanKoordinator()
    {
        return $this->hasMany(PenugasanKoordinator::class, 'kelompok_id');
    }

    public function penugasanVerifikator()
    {
        return $this->hasMany(PenugasanVerifikator::class, 'kelompok_id');
    }
}
