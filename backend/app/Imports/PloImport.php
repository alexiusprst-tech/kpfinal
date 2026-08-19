<?php

namespace App\Imports;

use App\Models\Plo;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class PloImport implements ToCollection, WithHeadingRow
{
    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {
            $kodePlo    = trim($row['kode_plo'] ?? '');
            $deskripsi  = trim($row['deskripsi'] ?? '');

            if ($kodePlo === '' || $deskripsi === '') {
                continue;
            }

            // Cari termasuk yang soft-deleted
            $plo = Plo::withTrashed()->where('kode_plo', $kodePlo)->first();

            if ($plo) {
                // Restore jika soft-deleted, lalu update deskripsi
                if ($plo->trashed()) {
                    $plo->restore();
                }
                $plo->update(['deskripsi' => $deskripsi]);
            } else {
                Plo::create([
                    'kode_plo'  => $kodePlo,
                    'deskripsi' => $deskripsi,
                ]);
            }
        }
    }
}


