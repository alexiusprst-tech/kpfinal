<?php
use App\Models\ImportLog;
use Illuminate\Support\Str;

try {
    $importLog = ImportLog::create([
        'user_id'      => '02aa912c-f80a-4c59-93c7-331ed3ed13c3', // valid user ID
        'type'         => 'PLO',
        'file_name'    => 'test.csv',
        'status'       => 'PROCESSING',
        'total_rows'   => 0,
        'success_rows' => 0,
        'failed_rows'  => 0,
    ]);
    echo "ImportLog created with ID: " . $importLog->id . "\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
