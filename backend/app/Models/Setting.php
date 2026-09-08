<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class Setting extends Model
{
    use HasUuids;

    protected $table = 'app_settings';

    protected $fillable = [
        'key',
        'value',
    ];

    /**
     * Get a setting value by key with optional fallback.
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        try {
            $value = Cache::remember("app_setting_{$key}", 3600, function () use ($key) {
                $record = static::where('key', $key)->first();
                return $record?->value;
            });

            if ($value !== null && $value !== '') {
                return $value;
            }

            return $default;
        } catch (\Throwable $e) {
            return $default;
        }
    }

    /**
     * Set a setting value by key.
     */
    public static function set(string $key, mixed $value): static
    {
        Cache::forget("app_setting_{$key}");

        return static::updateOrCreate(
            ['key' => $key],
            ['value' => $value]
        );
    }

    /**
     * Forget/delete a setting key.
     */
    public static function forget(string $key): void
    {
        Cache::forget("app_setting_{$key}");
        static::where('key', $key)->delete();
    }

    /**
     * Helper to get full local file system path to KaProdi signature for PDF generation.
     */
    public static function getKaprodiSignaturePath(): ?string
    {
        $path = static::get('kaprodi_tanda_tangan');
        if ($path) {
            if (Storage::disk('public')->exists($path)) {
                return Storage::disk('public')->path($path);
            }
            if (file_exists(storage_path('app/public/' . $path))) {
                return storage_path('app/public/' . $path);
            }
            if (file_exists(public_path('storage/' . $path))) {
                return public_path('storage/' . $path);
            }
        }

        // Fallbacks
        $fallbacks = [
            'tanda-tangan/kaprodi_signature.png',
            'tanda-tangan/kaprodi_signature.jpg',
            'tanda-tangan/kaprodi_signature.jpeg',
            'tanda-tangan/kaprodi.png',
            'tanda-tangan/kaprodi.jpg',
        ];

        foreach ($fallbacks as $fallback) {
            if (Storage::disk('public')->exists($fallback)) {
                return Storage::disk('public')->path($fallback);
            }
            if (file_exists(storage_path('app/public/' . $fallback))) {
                return storage_path('app/public/' . $fallback);
            }
        }

        return null;
    }
}
