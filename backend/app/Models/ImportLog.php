<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ImportLog extends Model
{
    protected $table = 'import_logs';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'user_id',
        'type',
        'file_name',
        'status',
        'total_rows',
        'success_rows',
        'failed_rows',
        'error_summary',
    ];

    protected $casts = [
        'total_rows' => 'integer',
        'success_rows' => 'integer',
        'failed_rows' => 'integer',
        'error_summary' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
