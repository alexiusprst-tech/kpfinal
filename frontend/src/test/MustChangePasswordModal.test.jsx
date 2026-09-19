import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MustChangePasswordModal from '@/Components/MustChangePasswordModal';

const mockPost = vi.fn();
const mockReset = vi.fn();

vi.mock('@inertiajs/react', () => ({
    usePage: () => ({
        props: {
            auth: {
                user: {
                    name: 'Dr. John Doe',
                    dosen: {
                        kode_dosen: 'JDO',
                        nip: '198001012005011001',
                    },
                },
            },
        },
    }),
    useForm: (initialData) => {
        const [formData, setFormData] = React.useState(initialData);
        return {
            data: formData,
            setData: (key, val) => {
                if (typeof key === 'object') {
                    setFormData((prev) => ({ ...prev, ...key }));
                } else {
                    setFormData((prev) => ({ ...prev, [key]: val }));
                }
            },
            post: mockPost,
            processing: false,
            errors: {},
            reset: mockReset,
        };
    },
}));

describe('MustChangePasswordModal Component', () => {
    it('does not render when open is false', () => {
        const { container } = render(<MustChangePasswordModal open={false} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders password change modal when open is true', () => {
        render(<MustChangePasswordModal open={true} />);

        expect(screen.getByText('Buat Kata Sandi Baru')).toBeInTheDocument();
        expect(screen.getByText(/Dr. John Doe/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Masukkan kata sandi baru/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Ulangi kata sandi baru/i)).toBeInTheDocument();
    });

    it('validates password criteria and submits when valid', () => {
        render(<MustChangePasswordModal open={true} />);

        const newPassInput = screen.getByPlaceholderText(/Masukkan kata sandi baru/i);
        const confirmPassInput = screen.getByPlaceholderText(/Ulangi kata sandi baru/i);

        fireEvent.change(newPassInput, { target: { value: 'Secret123!' } });
        fireEvent.change(confirmPassInput, { target: { value: 'Secret123!' } });

        const submitButton = screen.getByRole('button', { name: /Simpan & Masuk ke Beranda/i });
        expect(submitButton).not.toBeDisabled();

        fireEvent.click(submitButton);
        expect(mockPost).toHaveBeenCalledWith('/profile/password', expect.any(Object));
    });
});
