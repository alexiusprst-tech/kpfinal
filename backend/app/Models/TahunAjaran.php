<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

use Illuminate\Database\Eloquent\Model;

class TahunAjaran extends Model
{
    use HasUuids;
    protected $table = 'tahun_ajaran';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'nama',
        'tahun_mulai',
        'tahun_selesai',
        'status',
    ];

    protected $casts = [
        'tahun_mulai' => 'integer',
        'tahun_selesai' => 'integer',
    ];

    // ─── Relationships ─────────────────────────────────────────────────────────

    public function periodeVerifikasi()
    {
        return $this->hasMany(PeriodeVerifikasi::class, 'tahun_ajaran_id');
    }
}
