<?php

namespace App\Exports;

use App\Models\Clo;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class CloExport implements FromCollection, WithHeadings
{
    public function collection()
    {
        return Clo::select('kode_clo', 'deskripsi')->get();
    }

    public function headings(): array
    {
        return ['kode_clo', 'deskripsi'];
    }
}
