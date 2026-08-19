<?php

namespace App\Imports;

use App\Models\Clo;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class CloImport implements ToCollection, WithHeadingRow
{
    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {
            $kodeClo    = trim($row['kode_clo'] ?? '');
            $deskripsi  = trim($row['deskripsi'] ?? '');

            if ($kodeClo === '' || $deskripsi === '') {
                continue;
            }

            $clo = Clo::withTrashed()->where('kode_clo', $kodeClo)->first();

            if ($clo) {
                if ($clo->trashed()) {
                    $clo->restore();
                }
                $clo->update(['deskripsi' => $deskripsi]);
            } else {
                Clo::create([
                    'kode_clo'  => $kodeClo,
                    'deskripsi' => $deskripsi,
                ]);
            }
        }
    }
}


