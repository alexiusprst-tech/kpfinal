<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PeriodeVerifikasi extends Model
{
    use HasUuids;
    protected $table = 'periode_verifikasi';
    protected $keyType = 'string';
    public $incrementing = false;
    protected $appends = ['jenis_periode', 'tahun_akademik'];

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
     * Jenis periode (Ganjil/Genap/Antara) inferred from the periode name or start date month.
     */
    public function getJenisPeriodeAttribute(): string
    {
        $namaLower = mb_strtolower($this->nama ?? '');
        if (str_contains($namaLower, 'ganjil')) return 'Ganjil';
        if (str_contains($namaLower, 'genap')) return 'Genap';
        if (str_contains($namaLower, 'antara')) return 'Antara';

        $month = $this->tanggal_mulai ? (int) Carbon::parse($this->tanggal_mulai)->format('n') : (int) date('n');
        return ($month >= 8 || $month <= 1) ? 'Ganjil' : 'Genap';
    }

    /**
     * Tahun akademik (e.g. 2026/2027) inferred from relation, name regex, or current year.
     */
    public function getTahunAkademikAttribute(): string
    {
        if ($this->tahunAjaran) {
            if (!empty($this->tahunAjaran->tahun_mulai) && !empty($this->tahunAjaran->tahun_selesai)) {
                return $this->tahunAjaran->tahun_mulai . '/' . $this->tahunAjaran->tahun_selesai;
            }
            if (!empty($this->tahunAjaran->nama) && $this->tahunAjaran->nama !== '-') {
                return $this->tahunAjaran->nama;
            }
        }

        if (preg_match('/(\d{4}\s*[\/-]\s*\d{4})/', $this->nama ?? '', $matches)) {
            return str_replace(' ', '', $matches[1]);
        }

        if (preg_match('/(\d{4})/', $this->nama ?? '', $matches)) {
            $yr = (int) $matches[1];
            return $yr . '/' . ($yr + 1);
        }

        $currentYear = (int) date('Y');
        return $currentYear . '/' . ($currentYear + 1);
    }

    // ─── Relationships ─────────────────────────────────────────────────────────

    public function tahunAjaran()
    {
        return $this->belongsTo(TahunAjaran::class, 'tahun_ajaran_id')->withDefault(['nama' => '-']);
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
