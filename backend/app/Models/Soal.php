<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Soal extends Model
{
    protected $table = 'soal';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'mata_kuliah_id',
        'periode_id',
        'kategori_id',
        'uploaded_by',
        'judul',
        'nama_file',
        'file_path',
        'mime_type',
        'file_size',
        'status',
    ];

    protected $casts = [
        'file_size' => 'integer',
    ];

    // ─── Status constants ───────────────────────────────────────────────────────

    const STATUS_DRAFT       = 'DRAFT';
    const STATUS_SUBMITTED   = 'SUBMITTED';
    const STATUS_IN_REVIEW   = 'IN_REVIEW';
    const STATUS_REVISION    = 'REVISION';
    const STATUS_RESUBMITTED = 'RESUBMITTED';
    const STATUS_APPROVED    = 'APPROVED';
    const STATUS_REJECTED    = 'REJECTED';

    public function canBeSubmitted(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function canBeRevised(): bool
    {
        return $this->status === self::STATUS_REVISION;
    }

    public function canBeVerified(): bool
    {
        return in_array($this->status, [self::STATUS_IN_REVIEW]);
    }

    // ─── Relationships ─────────────────────────────────────────────────────────

    public function mataKuliah()
    {
        return $this->belongsTo(MataKuliah::class, 'mata_kuliah_id');
    }

    public function periode()
    {
        return $this->belongsTo(PeriodeVerifikasi::class, 'periode_id');
    }

    public function kategori()
    {
        return $this->belongsTo(KategoriSoal::class, 'kategori_id');
    }

    public function uploadedBy()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function revisi()
    {
        return $this->hasMany(RevisiSoal::class, 'soal_id')->orderBy('version', 'desc');
    }

    public function verifikasi()
    {
        return $this->hasMany(Verifikasi::class, 'soal_id')->orderBy('created_at', 'desc');
    }

    public function latestVerifikasi()
    {
        // latestOfMany() breaks on Postgres here because it adds an internal
        // MAX(id) tiebreaker and Postgres has no MAX() aggregate for uuid.
        // A plain orderByDesc still resolves to "one latest row per soal"
        // under hasOne's eager-load matching, without that aggregate.
        return $this->hasOne(Verifikasi::class, 'soal_id')->orderByDesc('created_at');
    }
}
