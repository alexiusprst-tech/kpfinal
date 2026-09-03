import React, { useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { showToast, showConfirm } from '@/Utils/sweetalert';

export default function MustChangePasswordModal({ open }) {
    if (!open) return null;

    const { auth } = usePage().props;
    const user = auth?.user;

    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
        password_confirmation: '',
    });

    const [show, setShow] = useState({ new: false, confirm: false });

    const submit = (e) => {
        e.preventDefault();
        post('/profile/password', {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                showToast('success', 'Password berhasil diperbarui. Selamat datang di portal!');
            },
        });
    };

    const handleLogout = async () => {
        const result = await showConfirm({
            title: 'Konfirmasi Keluar',
            text: 'Apakah Anda yakin ingin keluar dari sistem?',
            icon: 'question',
            confirmButtonText: 'Ya, Keluar',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#801720',
        });
        if (result.isConfirmed) {
            window.location.href = '/logout';
        }
    };

    const isLengthValid = data.password.length >= 8;
    const isMatchValid = data.password.length > 0 && data.password === data.password_confirmation;

    const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'D';
    const kodeDosen = user?.dosen?.kode_dosen || '101010';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />

            {/* Modal Card */}
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200 z-10">
                {/* Top Accent Line */}
                <div className="h-1.5 bg-[#801720] w-full" />

                <div className="p-6 sm:p-7 space-y-5">
                    {/* Header Bar */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center p-1 flex-shrink-0">
                                <img src="/images/logo-telkom.png" alt="Logo" className="h-full w-auto object-contain" />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black text-[#801720] tracking-wider uppercase leading-none">
                                    VERIFIKASI SOAL
                                </h3>
                                <p className="text-[9px] font-extrabold text-slate-500 tracking-tight leading-tight mt-0.5">
                                    TELKOM UNIVERSITY JAKARTA
                                </p>
                            </div>
                        </div>

                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-amber-100/80 text-amber-800 border border-amber-300/80">
                            AKTIVASI AKUN
                        </div>
                    </div>

                    {/* Title Section */}
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">
                            Buat Kata Sandi Baru
                        </h2>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                            Ini adalah login pertama kali Anda. Silakan ganti kata sandi awal (NIP) dengan kata sandi baru untuk mengamankan akun.
                        </p>
                    </div>

                    {/* User Info Banner */}
                    <div className="flex items-center justify-between p-3.5 bg-red-50/50 rounded-2xl border-l-4 border-l-[#801720] border border-red-100/60">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-red-100 text-[#801720] font-black text-sm flex items-center justify-center border border-red-200 flex-shrink-0">
                                {userInitial}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-extrabold text-slate-800 truncate leading-tight">
                                    {user?.name || 'Dosen'}
                                </p>
                                <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">
                                    {user?.email || 'dsn@telkomuniversity.ac.id'}
                                </p>
                            </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-extrabold text-[10px] border border-slate-200 flex-shrink-0 ml-2">
                            Kode Dosen: {kodeDosen}
                        </span>
                    </div>

                    {/* Form */}
                    <form onSubmit={submit} className="space-y-4">
                        {/* KATA SANDI BARU */}
                        <div>
                            <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                                KATA SANDI BARU
                            </label>
                            <div className="relative">
                                <input
                                    type={show.new ? 'text' : 'password'}
                                    value={data.password}
                                    onChange={e => setData('password', e.target.value)}
                                    placeholder="Masukkan kata sandi baru (min. 8 karakter)"
                                    className="w-full px-3.5 pr-20 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720]"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShow(s => ({ ...s, new: !s.new }))}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                    {show.new ? 'Sembunyikan' : 'Tampilkan'}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-[11px] font-semibold text-red-600 mt-1">{errors.password}</p>
                            )}
                        </div>

                        {/* KONFIRMASI KATA SANDI BARU */}
                        <div>
                            <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                                KONFIRMASI KATA SANDI BARU
                            </label>
                            <div className="relative">
                                <input
                                    type={show.confirm ? 'text' : 'password'}
                                    value={data.password_confirmation}
                                    onChange={e => setData('password_confirmation', e.target.value)}
                                    placeholder="Ulangi kata sandi baru"
                                    className="w-full px-3.5 pr-20 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720]"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                    {show.confirm ? 'Sembunyikan' : 'Tampilkan'}
                                </button>
                            </div>
                            {errors.password_confirmation && (
                                <p className="text-[11px] font-semibold text-red-600 mt-1">{errors.password_confirmation}</p>
                            )}
                        </div>

                        {/* Checklist Box */}
                        <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-2 text-xs">
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isLengthValid ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                <span className={isLengthValid ? 'text-emerald-700 font-bold' : 'text-slate-500 font-medium'}>
                                    Minimal 8 karakter
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isMatchValid ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                <span className={isMatchValid ? 'text-emerald-700 font-bold' : 'text-slate-500 font-medium'}>
                                    Kedua kata sandi cocok
                                </span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={processing || !isLengthValid || !isMatchValid}
                                className="flex-1 py-3 px-4 bg-[#801720] text-white text-xs font-bold rounded-xl hover:bg-[#681219] disabled:opacity-50 transition-all shadow-md shadow-[#801720]/20 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {processing ? 'Menyimpan...' : 'Simpan & Masuk ke Dashboard'}
                            </button>

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="py-3 px-4 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all flex items-center justify-center cursor-pointer flex-shrink-0"
                            >
                                Logout
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
