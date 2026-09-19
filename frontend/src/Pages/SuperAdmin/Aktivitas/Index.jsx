import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Search,
    ChevronLeft,
    ChevronRight,
    History,
    Globe,
    X
} from 'lucide-react';
import { formatDateTime } from '@/Utils/date';

function relativeTime(dateStr) {
    if (!dateStr) return '-';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Baru saja';
    if (mins < 60) return `${mins} menit lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} hari lalu`;
    return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getActionBadge(action = '') {
    const act = action.toUpperCase();
    if (act.includes('APPROVED')) {
        return { label: 'Disetujui', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (act.includes('REVISION')) {
        return { label: 'Revisi', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    if (act.includes('CREATE') || act.includes('UPLOAD')) {
        return { label: 'Tambah / Unggah', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
    if (act.includes('UPDATE') || act.includes('ASSIGN')) {
        return { label: 'Perubahan', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
    }
    if (act.includes('DELETE') || act.includes('CABUT')) {
        return { label: 'Hapus / Cabut', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
    if (act.includes('ACTIVATE')) {
        return { label: 'Aktivasi', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (act.includes('CLOSE')) {
        return { label: 'Tutup', bg: 'bg-orange-50 text-orange-700 border-orange-200' };
    }
    return { label: action.replace(/_/g, ' '), bg: 'bg-slate-50 text-slate-700 border-slate-200' };
}

export default function SuperAdminAktivitasIndex({
    logs = { data: [], links: [] },
    stats = { total: 0, today: 0, active_users: 0, data_changes: 0 },
    filters = {},
}) {
    const [search, setSearch] = useState(filters.search || '');
    const [date, setDate] = useState(filters.date || '');

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search || '')) {
                applyFilter({ search });
            }
        }, 350);
        return () => clearTimeout(timer);
    }, [search]);

    const applyFilter = (newFilters) => {
        router.get('/superadmin/aktivitas', {
            ...filters,
            search,
            date,
            ...newFilters,
            page: 1,
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleDateChange = (val) => {
        setDate(val);
        applyFilter({ date: val });
    };

    const resetFilters = () => {
        setSearch('');
        setDate('');
        router.get('/superadmin/aktivitas', {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const hasActiveFilters = search || date;

    return (
        <AuthenticatedLayout title="Log Aktivitas Sistem">
            <Head title="Log Aktivitas Sistem" />

            <div className="space-y-6">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-[#9E1B28] to-[#801720] rounded-[8px] p-6 sm:p-7 text-white border border-[#801720]/30">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-[4px] text-xs font-bold backdrop-blur-xs text-rose-100 mb-2 border border-white/10">
                                <History className="w-3.5 h-3.5" />
                                <span>Riwayat Aktivitas</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                                Log Aktivitas Sistem
                            </h1>
                            <p className="text-xs sm:text-sm text-white/80 font-normal max-w-2xl">
                                Pantau seluruh riwayat aktivitas, verifikasi soal, dan rekaman perubahan data master secara real-time pada portal akademik.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filter Toolbar */}
                <div className="bg-white rounded-[8px] border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="relative flex-1 min-w-[240px]">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari berdasarkan nama pengguna, aksi, atau keterangan..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-[6px] text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9E1B28]/20 focus:border-[#9E1B28] transition-all"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {/* Filter Tanggal */}
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => handleDateChange(e.target.value)}
                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-[6px] text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-[#9E1B28]/20 cursor-pointer"
                            />

                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="px-3 py-2 rounded-[6px] bg-red-50 text-[#9E1B28] text-xs font-bold hover:bg-red-100 transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Reset Filter</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table Container */}
                <div className="bg-white rounded-[8px] border border-slate-200/90 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-gray-100 bg-slate-50/70 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                                    <th className="py-3.5 px-5">Waktu</th>
                                    <th className="py-3.5 px-5">Pengguna</th>
                                    <th className="py-3.5 px-5">Kategori / Aksi</th>
                                    <th className="py-3.5 px-5">Deskripsi Aktivitas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {logs.data && logs.data.length > 0 ? (
                                    logs.data.map((item) => {
                                        const badge = getActionBadge(item.action);
                                        const userName = item.user?.dosen?.nama_lengkap || item.user?.name || 'Sistem';
                                        const userRole = item.user?.role || 'SISTEM';

                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                                {/* Waktu */}
                                                <td className="py-3.5 px-5 whitespace-nowrap">
                                                    <div className="font-bold text-slate-800">
                                                        {formatDateTime(item.created_at)}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                                                        {relativeTime(item.created_at)}
                                                    </div>
                                                </td>

                                                {/* Pengguna */}
                                                <td className="py-3.5 px-5 whitespace-nowrap">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0 border border-slate-200">
                                                            {userName.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                                                <span>{userName}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                                                    {userRole}
                                                                </span>
                                                                {item.user?.dosen?.kode_dosen && (
                                                                    <span className="text-[10px] text-slate-400 font-medium">
                                                                        [{item.user.dosen.kode_dosen}]
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Aksi */}
                                                <td className="py-3.5 px-5 whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                                                        {badge.label}
                                                    </span>
                                                    {item.model_type && (
                                                        <span className="block text-[10px] text-slate-400 font-medium mt-1">
                                                            Modul: {item.model_type}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Deskripsi */}
                                                <td className="py-3.5 px-5">
                                                    <p className="text-slate-800 font-semibold leading-relaxed max-w-xl">
                                                        {item.description}
                                                    </p>
                                                    {item.ip_address && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                                                            <Globe className="w-3 h-3 text-slate-300" />
                                                            <span>IP: {item.ip_address}</span>
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="py-14 text-center">
                                            <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-2">
                                                <div className="w-12 h-12 rounded-[8px] bg-slate-100 text-slate-400 flex items-center justify-center">
                                                    <History className="w-6 h-6" />
                                                </div>
                                                <p className="text-sm font-bold text-slate-700">Tidak Ada Log Aktivitas</p>
                                                <p className="text-xs text-slate-400">
                                                    {hasActiveFilters
                                                        ? 'Tidak ditemukan data aktivitas yang cocok dengan parameter filter pencarian Anda.'
                                                        : 'Belum ada catatan aktivitas yang terekam di dalam sistem.'}
                                                </p>
                                                {hasActiveFilters && (
                                                    <button
                                                        type="button"
                                                        onClick={resetFilters}
                                                        className="mt-2 text-xs font-bold text-[#9E1B28] hover:underline cursor-pointer"
                                                    >
                                                        Atur Ulang Filter
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {logs.data && logs.data.length > 0 && (
                        <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                            <div>
                                Menampilkan <span className="font-bold text-slate-800">{logs.from || 0}</span> –{' '}
                                <span className="font-bold text-slate-800">{logs.to || 0}</span> dari{' '}
                                <span className="font-bold text-slate-800">{logs.total || 0}</span> total aktivitas
                            </div>

                            {logs.links && logs.links.length > 3 && (
                                <div className="flex items-center gap-1">
                                    {logs.links.map((link, i) => (
                                        <button
                                            key={i}
                                            disabled={!link.url}
                                            onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                                            className={`min-w-[30px] h-7 px-2 rounded-[6px] text-xs font-bold flex items-center justify-center transition-colors cursor-pointer ${
                                                link.active
                                                    ? 'bg-[#9E1B28] text-white shadow-xs'
                                                    : link.url
                                                    ? 'text-slate-600 hover:bg-slate-100'
                                                    : 'text-slate-300 cursor-not-allowed'
                                            }`}
                                        >
                                            {link.label.includes('Previous') ? (
                                                <ChevronLeft className="w-3.5 h-3.5" />
                                            ) : link.label.includes('Next') ? (
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            ) : (
                                                <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
