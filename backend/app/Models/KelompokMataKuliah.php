<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class KelompokMataKuliah extends Model
{
    use HasUuids;

    protected $table = 'kelompok_mata_kuliah';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'kelompok_id',
        'mata_kuliah_id',
        'koordinator_id',
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

    public function koordinator()
    {
        return $this->belongsTo(Dosen::class, 'koordinator_id');
    }
}
