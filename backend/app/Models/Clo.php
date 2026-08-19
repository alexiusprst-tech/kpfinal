<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Clo extends Model
{
    use SoftDeletes, HasUuids;

    protected $table = 'clo';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['kode_clo', 'deskripsi', 'bloom'];

    public function mataKuliah()
    {
        return $this->belongsToMany(MataKuliah::class, 'mata_kuliah_clo', 'clo_id', 'mata_kuliah_id')
                    ->withPivot('id');
    }

    public function plo()
    {
        return $this->belongsToMany(Plo::class, 'clo_plo', 'clo_id', 'plo_id')
                    ->withPivot('id');
    }
}
