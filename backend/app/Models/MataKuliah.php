<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class MataKuliah extends Model
{
    use SoftDeletes;

    protected $table = 'mata_kuliah';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'kode_mk',
        'nama_mk',
        'nama_mk_en',
        'sks',
        'semester',
        'status',
    ];

    protected $casts = [
        'sks'      => 'integer',
        'semester' => 'integer',
    ];

    // ─── Relationships ─────────────────────────────────────────────────────────

    public function plo()
    {
        return $this->belongsToMany(Plo::class, 'mata_kuliah_plo', 'mata_kuliah_id', 'plo_id')
                    ->withPivot('id');
    }

    public function clo()
    {
        return $this->belongsToMany(Clo::class, 'mata_kuliah_clo', 'mata_kuliah_id', 'clo_id')
                    ->withPivot('id');
    }

    public function soal()
    {
        return $this->hasMany(Soal::class, 'mata_kuliah_id');
    }

    public function penugasanKoordinator()
    {
        return $this->hasMany(PenugasanKoordinator::class, 'mata_kuliah_id');
    }

    public function penugasanVerifikator()
    {
        return $this->hasMany(PenugasanVerifikator::class, 'mata_kuliah_id');
    }

    public function beritaAcara()
    {
        return $this->hasMany(BeritaAcara::class, 'mata_kuliah_id');
    }
}
