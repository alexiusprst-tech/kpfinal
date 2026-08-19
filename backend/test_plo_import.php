<?php
use App\Models\ImportLog;
use App\Imports\PloImport;
use Illuminate\Http\UploadedFile;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\DB;

try {
    $file = new UploadedFile(
        'c:\laragon\sidangkp\backend\storage\app\template-import-plo.csv', // I need to create this first
        'template-import-plo.csv',
        'text/csv',
        null,
        true
    );

    Excel::import(new PloImport, $file);
    echo "Import succeeded!\n";
} catch (\Maatwebsite\Excel\Validators\ValidationException $e) {
    $failures = $e->failures();
    foreach ($failures as $failure) {
        echo "Row " . $failure->row() . ": " . implode(', ', $failure->errors()) . "\n";
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
