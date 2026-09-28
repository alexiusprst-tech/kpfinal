<?php

namespace App\Exports;

use App\Exports\Concerns\SanitizesFormulaInjection;
use App\Models\Plo;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithCustomValueBinder;
use Maatwebsite\Excel\Concerns\WithHeadings;

class PloExport implements FromCollection, WithHeadings, WithCustomValueBinder
{
    use SanitizesFormulaInjection;

    public function collection()
    {
        return Plo::select('kode_plo', 'deskripsi')->get();
    }

    public function headings(): array
    {
        return ['kode_plo', 'deskripsi'];
    }
}
