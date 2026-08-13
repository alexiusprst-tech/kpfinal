<?php

namespace App\Imports;

use App\Models\Plo;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;

class PloImport implements ToModel, WithHeadingRow, WithValidation
{
    public function model(array $row)
    {
        return new Plo([
            'id'        => (string) Str::uuid(),
            'kode_plo'  => trim($row['kode_plo']),
            'deskripsi' => trim($row['deskripsi']),
        ]);
    }

    public function rules(): array
    {
        return [
            'kode_plo'  => ['required', 'string', 'unique:plo,kode_plo'],
            'deskripsi' => ['required', 'string'],
        ];
    }
}
