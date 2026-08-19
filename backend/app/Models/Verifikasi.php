<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

use Illuminate\Database\Eloquent\Model;

class Verifikasi extends Model
{
    use HasUuids;
    protected $table = 'verifikasi';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'soal_id',
        'verifikator_id',
        'action',
        'catatan',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    const ACTION_APPROVED = 'APPROVED';
    const ACTION_REVISION = 'REVISION';
    const ACTION_REJECTED = 'REJECTED';

    public function soal()
    {
        return $this->belongsTo(Soal::class, 'soal_id');
    }

    public function verifikator()
    {
        return $this->belongsTo(User::class, 'verifikator_id');
    }
}
