<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Plo extends Model
{
    use SoftDeletes;

    protected $table = 'plo';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['kode_plo', 'deskripsi'];

    public function mataKuliah()
    {
        return $this->belongsToMany(MataKuliah::class, 'mata_kuliah_plo', 'plo_id', 'mata_kuliah_id')
                    ->withPivot('id');
    }

    public function clo()
    {
        return $this->belongsToMany(Clo::class, 'clo_plo', 'plo_id', 'clo_id')
                    ->withPivot('id');
    }
}
