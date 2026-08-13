<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Curriculum extends Model
{
    use SoftDeletes;

    protected $table = 'curriculums';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'code',
        'name',
        'year',
        'description',
    ];

    public function courses()
    {
        return $this->hasMany(Course::class, 'curriculum_id');
    }

    public function plos()
    {
        return $this->hasMany(Plo::class, 'curriculum_id');
    }
}
