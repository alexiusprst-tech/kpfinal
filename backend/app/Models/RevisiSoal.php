<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

use Illuminate\Database\Eloquent\Model;

class RevisiSoal extends Model
{
    use HasUuids;
    protected $table = 'revisi_soal';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'soal_id',
        'version',
        'nama_file',
        'file_path',
        'mime_type',
        'file_size',
        'catatan',
        'uploaded_by',
        'uploaded_at',
    ];

    protected $casts = [
        'version' => 'integer',
        'file_size' => 'integer',
        'uploaded_at' => 'datetime',
    ];

    public function soal()
    {
        return $this->belongsTo(Soal::class, 'soal_id');
    }

    public function uploadedBy()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
