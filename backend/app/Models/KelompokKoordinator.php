<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class KelompokKoordinator extends Model
{
    use HasUuids;

    protected $table = 'kelompok_koordinator';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'kelompok_id',
        'mata_kuliah_id',
        'dosen_id',
    ];

    // ─── Relationships ─────────────────────────────────────────────────────────
    public function kelompok()
    {
        return $this->belongsTo(KelompokVerifikasi::class, 'kelompok_id');
    }

    public function mataKuliah()
    {
        return $this->belongsTo(MataKuliah::class, 'mata_kuliah_id');
    }

    public function dosen()
    {
        return $this->belongsTo(Dosen::class, 'dosen_id');
    }
}
