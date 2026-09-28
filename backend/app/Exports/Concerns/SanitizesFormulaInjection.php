<?php

namespace App\Exports\Concerns;

use App\Support\FormulaInjectionGuard;
use PhpOffice\PhpSpreadsheet\Cell\Cell;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Cell\DefaultValueBinder;
use PhpOffice\PhpSpreadsheet\Shared\StringHelper;

/**
 * Pair with Maatwebsite\Excel\Concerns\WithCustomValueBinder so any string
 * cell value starting with =, +, -, or @ is written as plain text instead of
 * being auto-promoted to a live Excel formula.
 */
trait SanitizesFormulaInjection
{
    public function bindValue(Cell $cell, $value): bool
    {
        if (is_string($value)) {
            $sanitized = StringHelper::sanitizeUTF8($value);
            if (FormulaInjectionGuard::isDangerous($sanitized)) {
                $cell->setValueExplicit($sanitized, DataType::TYPE_STRING);

                return true;
            }
        }

        return (new DefaultValueBinder())->bindValue($cell, $value);
    }
}
