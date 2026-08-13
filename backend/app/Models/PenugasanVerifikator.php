<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PenugasanVerifikator extends Model
{
    protected $table = 'penugasan_verifikator';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'dosen_id',
        'mata_kuliah_id',
        'periode_id',
        'assigned_by',
        'tanggal_mulai',
        'tanggal_selesai',
        'status',
    ];

    protected $casts = [
        'tanggal_mulai' => 'date',
        'tanggal_selesai' => 'date',
    ];

    public function isActive(): bool
    {
        return $this->status === 'ACTIVE';
    }

    public function dosen()
    {
        return $this->belongsTo(Dosen::class, 'dosen_id');
    }

    public function mataKuliah()
    {
        return $this->belongsTo(MataKuliah::class, 'mata_kuliah_id');
    }

    public function periode()
    {
        return $this->belongsTo(PeriodeVerifikasi::class, 'periode_id');
    }

    public function assignedBy()
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }
}
