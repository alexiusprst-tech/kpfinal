import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SearchableSelect from '@/Components/SearchableSelect';

describe('SearchableSelect Component (Components/SearchableSelect.jsx)', () => {
    const mockOptions = [
        { value: '1', label: 'Matematika Diskrit' },
        { value: '2', label: 'Struktur Data & Algoritma' },
        { value: '3', label: 'Pemrograman Web' },
    ];

    it('displays placeholder when no value is selected', () => {
        render(
            <SearchableSelect
                options={mockOptions}
                value=""
                onChange={() => {}}
                placeholder="Pilih Mata Kuliah"
            />
        );

        expect(screen.getByText('Pilih Mata Kuliah')).toBeInTheDocument();
    });

    it('displays selected option label when value matches', () => {
        render(
            <SearchableSelect
                options={mockOptions}
                value="2"
                onChange={() => {}}
            />
        );

        expect(screen.getByText('Struktur Data & Algoritma')).toBeInTheDocument();
    });

    it('opens dropdown, filters options by search, and triggers onChange when clicked', () => {
        const handleChange = vi.fn();
        render(
            <SearchableSelect
                options={mockOptions}
                value=""
                onChange={handleChange}
                placeholder="Pilih MK"
            />
        );

        // Click trigger button to open
        const trigger = screen.getByRole('button');
        fireEvent.click(trigger);

        // Search input should appear
        const searchInput = screen.getByPlaceholderText('Cari...');
        expect(searchInput).toBeInTheDocument();

        // Type filter query
        fireEvent.change(searchInput, { target: { value: 'Web' } });

        // Only matching option should be visible in dropdown
        expect(screen.getByText('Pemrograman Web')).toBeInTheDocument();
        expect(screen.queryByText('Matematika Diskrit')).not.toBeInTheDocument();

        // Click option
        fireEvent.click(screen.getByText('Pemrograman Web'));

        expect(handleChange).toHaveBeenCalledWith('3');
    });

    it('cannot be opened when disabled', () => {
        render(
            <SearchableSelect
                options={mockOptions}
                value="1"
                onChange={() => {}}
                disabled={true}
            />
        );

        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
    });
});
