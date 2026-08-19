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
        return $this->status === 'DRAFT';
    }

    public function isActive(): bool
    {
        return $this->status === 'ACTIVE';
    }

    public function isInactive(): bool
    {
        return $this->status === 'INACTIVE';
    }

    public function isClosed(): bool
    {
        return $this->status === 'CLOSED';
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
