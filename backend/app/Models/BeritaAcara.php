<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

use Illuminate\Database\Eloquent\Model;

class BeritaAcara extends Model
{
    use HasUuids;
    protected $table = 'berita_acara';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'nomor',
        'periode_id',
        'mata_kuliah_id',
        'koordinator_id',
        'dibuat_oleh',
        'jumlah_soal',
        'jumlah_approved',
        'jumlah_revision',
        'jumlah_rejected',
        'file_path',
        'tanggal',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'jumlah_soal' => 'integer',
        'jumlah_approved' => 'integer',
        'jumlah_revision' => 'integer',
        'jumlah_rejected' => 'integer',
    ];

    public function periode()
    {
        return $this->belongsTo(PeriodeVerifikasi::class, 'periode_id');
    }

    public function mataKuliah()
    {
        return $this->belongsTo(MataKuliah::class, 'mata_kuliah_id');
    }

    public function koordinator()
    {
        return $this->belongsTo(Dosen::class, 'koordinator_id');
    }

    public function dibuatOleh()
    {
        return $this->belongsTo(User::class, 'dibuat_oleh');
    }
}
