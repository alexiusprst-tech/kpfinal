<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

use Illuminate\Database\Eloquent\Model;

class PeriodeVerifikasi extends Model
{
    use HasUuids;
    protected $table = 'periode_verifikasi';
    protected $keyType = 'string';
    public $incrementing = false;
    protected $appends = ['jenis_periode'];

    protected $fillable = [
        'tahun_ajaran_id',
        'nama',
        'tanggal_mulai',
        'tanggal_selesai',
        'deadline_upload',
        'catatan',
        'status',
    ];

    protected $casts = [
        'tanggal_mulai' => 'date',
        'tanggal_selesai' => 'date',
        'deadline_upload' => 'datetime',
    ];

    // ─── Helpers ───────────────────────────────────────────────────────────────

    public function isActive(): bool
    {
        return $this->status === 'ACTIVE';
    }

    public function isClosed(): bool
    {
        return $this->status === 'CLOSED';
    }

    public function isUploadOpen(): bool
    {
        return $this->isActive() && now()->lte($this->deadline_upload);
    }

    /**
     * Jenis periode (Ganjil/Genap) is not a stored column — it's inferred
     * from the periode name, which conventionally includes the term.
     */
    public function getJenisPeriodeAttribute(): string
    {
        if (str_contains(mb_strtolower($this->nama ?? ''), 'ganjil')) return 'Ganjil';
        if (str_contains(mb_strtolower($this->nama ?? ''), 'genap')) return 'Genap';
        return '-';
    }

    // ─── Relationships ─────────────────────────────────────────────────────────

    public function tahunAjaran()
    {
        return $this->belongsTo(TahunAjaran::class, 'tahun_ajaran_id');
    }

    public function penugasanKoordinator()
    {
        return $this->hasMany(PenugasanKoordinator::class, 'periode_id');
    }

    public function penugasanVerifikator()
    {
        return $this->hasMany(PenugasanVerifikator::class, 'periode_id');
    }

    public function soal()
    {
        return $this->hasMany(Soal::class, 'periode_id');
    }

    public function beritaAcara()
    {
        return $this->hasMany(BeritaAcara::class, 'periode_id');
    }

    public function kelompokVerifikasi()
    {
        return $this->hasMany(KelompokVerifikasi::class, 'periode_id');
    }
}
