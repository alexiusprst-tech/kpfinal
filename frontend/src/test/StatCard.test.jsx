import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StatCard from '@/Components/StatCard';
import { BookOpen } from 'lucide-react';

// Mock Inertia Link component
vi.mock('@inertiajs/react', () => ({
    Link: ({ href, children, ...props }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}));

describe('StatCard Component (Components/StatCard.jsx)', () => {
    it('renders label, value, and sublabel correctly', () => {
        render(
            <StatCard
                label="Total Mata Kuliah"
                value="42"
                icon={BookOpen}
                sublabel="Semester Genap"
            />
        );

        expect(screen.getByText('Total Mata Kuliah')).toBeInTheDocument();
        expect(screen.getByText('42')).toBeInTheDocument();
        expect(screen.getByText('Semester Genap')).toBeInTheDocument();
    });

    it('renders as a clickable link when href prop is provided', () => {
        render(
            <StatCard
                label="Kelompok Verifikasi"
                value="10"
                icon={BookOpen}
                href="/superadmin/kelompok-verifikasi"
            />
        );

        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', '/superadmin/kelompok-verifikasi');
        expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('applies custom background and icon colors', () => {
        const { container } = render(
            <StatCard
                label="Pending Soal"
                value="5"
                icon={BookOpen}
                iconBg="bg-amber-500"
                iconColor="text-amber-100"
            />
        );

        const iconContainer = container.querySelector('.bg-amber-500');
        expect(iconContainer).toBeInTheDocument();
    });
});
