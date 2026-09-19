import { describe, it, expect } from 'vitest';
import { formatDate, formatDateTime, relativeTime } from '@/Utils/date';

describe('Date Utilities (Utils/date.js)', () => {
    it('formats date correctly in Indonesian locale', () => {
        const result = formatDate('2026-08-17');
        expect(result).toContain('2026');
        expect(result).toContain('17');
        expect(result).toContain('Agustus');
    });

    it('returns fallback dash for null or undefined dates', () => {
        expect(formatDate(null)).toBe('—');
        expect(formatDate(undefined)).toBe('—');
        expect(formatDate('')).toBe('—');
        expect(formatDateTime(null)).toBe('—');
    });

    it('formats datetime correctly', () => {
        const result = formatDateTime('2026-08-17T09:30:00');
        expect(result).toContain('2026');
        expect(result).toContain('Agustus');
        expect(result).toContain('09');
    });

    it('calculates relative time accurately', () => {
        expect(relativeTime(null)).toBe('-');
        expect(relativeTime(undefined)).toBe('-');

        const now = Date.now();
        expect(relativeTime(new Date(now - 10000).toISOString())).toBe('Baru saja');
        expect(relativeTime(new Date(now - 5 * 60000).toISOString())).toBe('5 menit lalu');
        expect(relativeTime(new Date(now - 3 * 3600000).toISOString())).toBe('3 jam lalu');
        expect(relativeTime(new Date(now - 2 * 86400000).toISOString())).toBe('2 hari lalu');
    });
});
