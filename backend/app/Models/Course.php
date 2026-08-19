<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Course extends Model
{
    use SoftDeletes, HasUuids;

    protected $table = 'mata_kuliah';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'kode_mk',
        'nama_mk',
        'sks',
        'status',
        'curriculum_id',
        'course_code',
        'course_name',
        'course_name_en',
        'credits',
        'semester',
        'category',
    ];

    public function clos()
    {
        return $this->belongsToMany(Clo::class, 'mata_kuliah_clo', 'mata_kuliah_id', 'clo_id');
    }
}
