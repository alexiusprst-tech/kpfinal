<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Dosen extends Model
{
    use SoftDeletes, HasUuids;

    protected $table = 'dosen';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'kode_dosen',
        'nama_lengkap',
        'email',
        'kategori_dosen',
        'user_id',
        'status',
    ];

    // ─── Relationships ─────────────────────────────────────────────────────────

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function penugasanKoordinator()
    {
        return $this->hasMany(PenugasanKoordinator::class, 'dosen_id');
    }

    public function penugasanVerifikator()
    {
        return $this->hasMany(PenugasanVerifikator::class, 'dosen_id');
    }

    public function beritaAcara()
    {
        return $this->hasMany(BeritaAcara::class, 'koordinator_id');
    }

    public function kelompokKoordinator()
    {
        return $this->hasMany(KelompokMataKuliah::class, 'koordinator_id');
    }

    public function kelompokVerifikator()
    {
        return $this->hasMany(KelompokVerifikator::class, 'dosen_id');
    }
}
