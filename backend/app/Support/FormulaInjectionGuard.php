<?php

namespace App\Support;

/**
 * Shared logic for preventing CSV/Excel formula injection (OWASP): a cell
 * value that begins with =, +, -, or @ can be interpreted as a live formula
 * by Excel/LibreOffice when the exported file is opened.
 */
class FormulaInjectionGuard
{
    public const TRIGGER_CHARS = ['=', '+', '-', '@'];

    public static function isDangerous(string $value): bool
    {
        return $value !== '' && in_array($value[0], self::TRIGGER_CHARS, true);
    }

    /**
     * Neutralize a raw CSV field: Excel's CSV importer treats a leading
     * single quote as "force text", so prefixing it stops re-interpretation
     * as a formula while keeping the value's own visible text unchanged.
     */
    public static function sanitizeCsvField($value): string
    {
        $value = (string) $value;

        return self::isDangerous($value) ? "'" . $value : $value;
    }
}
