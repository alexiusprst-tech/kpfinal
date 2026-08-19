<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class KategoriSoal extends Model
{
    use SoftDeletes, HasUuids;

    protected $table = 'kategori_soal';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['nama', 'deskripsi', 'status'];

    public function soal()
    {
        return $this->hasMany(Soal::class, 'kategori_id');
    }
}
