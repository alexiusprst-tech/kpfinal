import React, { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Plus, Pencil, Trash2, Eye, Search, X, FolderKanban,
    Play, Lock, Clock, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight,
    Users, Shield, BookOpen, RotateCcw, PowerOff, Check, GraduationCap
} from 'lucide-react';

import FlashAlert from '@/Components/FlashAlert';
import { showToast, showAlert, showConfirm } from '@/Utils/sweetalert';

function Toast({ flash }) {
    return <FlashAlert type="toast" flash={flash} />;
}


const STATUS_CONFIG = {
    DRAFT:    { label: 'Draft',     bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200/60', dot: 'bg-amber-500' },
    ACTIVE:   { label: 'Aktif',     bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/60', dot: 'bg-emerald-500' },
    INACTIVE: { label: 'Nonaktif',  bg: 'bg-gray-100',   text: 'text-gray-600',    border: 'border-gray-200/60', dot: 'bg-gray-400' },
    CLOSED:   { label: 'Selesai',   bg: 'bg-slate-100',  text: 'text-slate-600',   border: 'border-slate-300/60', dot: 'bg-slate-500' },
};

function StatusBadge({ status }) {
    const c = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${c.bg} ${c.text} ${c.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            {c.label}
        </span>
    );
}

function StatCard({ icon: Icon, iconBg, iconColor, value, label, sublabel }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
            <div className="min-w-0">
                <p className="text-2xl font-black text-gray-900 leading-none">{value ?? 0}</p>
                <p className="text-xs font-bold text-gray-700 leading-tight mt-1">{label}</p>
                {sublabel && <p className="text-[10px] text-gray-400 mt-0.5">{sublabel}</p>}
            </div>
        </div>
    );
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function KelompokVerifikasiIndex({ 
    list = { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, links: [] }, 
    kelompokList, 
    stats = { total: 0, active: 0, draft: 0, inactive: 0, closed: 0 }, 
    periodeAll = [], 
    periodeList = [], 
    tahunAjaranAll = [], 
    dosenAll = [], 
    dosenList = [], 
    filters = {} 
}) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState(filters?.search || '');
    const [actionItem, setActionItem] = useState(null);
    const [actionType, setActionType] = useState(null); // 'activate', 'deactivate', 'delete'
    const [processing, setProcessing] = useState(false);

    // Normalize props
    const dataList = (list && Array.isArray(list.data)) ? list : (kelompokList && Array.isArray(kelompokList.data)) ? kelompokList : { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, links: [] };
    const periodes = (Array.isArray(periodeAll) && periodeAll.length > 0) ? periodeAll : (Array.isArray(periodeList) ? periodeList : []);
    const dosens = (Array.isArray(dosenAll) && dosenAll.length > 0) ? dosenAll : (Array.isArray(dosenList) ? dosenList : []);

    // Debounced search (300ms)
    useEffect(() => {
        const timer = setTimeout(() => {
            const currentSearch = filters?.search || '';
            if (search !== currentSearch) {
                applyFilters({ search });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const applyFilters = (next) => {
        router.get('/superadmin/kelompok-verifikasi', { ...filters, ...next }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const resetFilters = () => {
        setSearch('');
        router.get('/superadmin/kelompok-verifikasi', {}, { replace: true });
    };

    const handleAction = async (item, type) => {
        if (!item || !type) return;

        if (type === 'activate') {
            const result = await showConfirm({
                title: 'Aktifkan Kelompok Verifikasi?',
                text: `Aktifkan kelompok verifikasi "${item.nama}"? Dosen yang ditugaskan akan dapat mengakses modul verifikasi.`,
                icon: 'question',
                confirmButtonText: 'Ya, Aktifkan',
                confirmButtonColor: '#059669',
            });
            if (result.isConfirmed) {
                router.post(`/superadmin/kelompok-verifikasi/${item.id}/activate`, {}, { preserveScroll: true });
            }
        } else if (type === 'deactivate') {
            const result = await showConfirm({
                title: 'Nonaktifkan Kelompok?',
                text: `Nonaktifkan kelompok "${item.nama}"? Akses verifikasi untuk dosen di kelompok ini akan dinonaktifkan sementara.`,
                icon: 'warning',
                confirmButtonText: 'Ya, Nonaktifkan',
                confirmButtonColor: '#801720',
            });
            if (result.isConfirmed) {
                router.post(`/superadmin/kelompok-verifikasi/${item.id}/deactivate`, {}, { preserveScroll: true });
            }
        } else if (type === 'delete') {
            const result = await showConfirm({
                title: 'Hapus Kelompok Verifikasi?',
                text: `Apakah Anda yakin ingin menghapus kelompok "${item.nama}"?`,
                icon: 'warning',
                confirmButtonText: 'Ya, Hapus Data',
                confirmButtonColor: '#CD202E',
            });
            if (result.isConfirmed) {
                router.delete(`/superadmin/kelompok-verifikasi/${item.id}`);
            }
        }
    };


    return (
        <AuthenticatedLayout title="Kelompok Verifikasi">
            <Head title="Kelompok Verifikasi - Super Admin" />
            <Toast flash={flash} />

            <div className="space-y-6 max-w-7xl mx-auto pb-12">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-[#801720]/10 text-[#801720] rounded-xl">
                                <FolderKanban className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Kelompok Verifikasi</h1>
                                <p className="text-xs font-medium text-gray-500 mt-0.5">
                                    Kelola target mata kuliah, koordinator MK (maks 3), dan tim verifikator (maks 5) dalam satu kelompok penugasan terpadu.
                                </p>
                            </div>
                        </div>
                    </div>
                    <Link
                        href="/superadmin/kelompok-verifikasi/create"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#801720] hover:bg-[#681219] text-white text-xs font-bold rounded-2xl shadow-md shadow-[#801720]/20 transition-all hover:scale-[1.02] cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        Buat Kelompok Baru
                    </Link>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        icon={FolderKanban}
                        iconBg="bg-slate-100"
                        iconColor="text-slate-700"
                        value={stats?.total}
                        label="TOTAL KELOMPOK"
                        sublabel="Semua Penugasan"
                    />
                    <StatCard
                        icon={Play}
                        iconBg="bg-emerald-50"
                        iconColor="text-emerald-600"
                        value={stats?.active}
                        label="KELOMPOK AKTIF"
                        sublabel="Operasional Berjalan"
                    />
                    <StatCard
                        icon={Clock}
                        iconBg="bg-amber-50"
                        iconColor="text-amber-600"
                        value={stats?.draft}
                        label="DRAFT"
                        sublabel="Belum Diaktifkan"
                    />
                    <StatCard
                        icon={Lock}
                        iconBg="bg-blue-50"
                        iconColor="text-blue-600"
                        value={stats?.closed}
                        label="SELESAI / CLOSED"
                        sublabel="Periode Ditutup"
                    />
                </div>

                {/* Filter Bar */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        
                        {/* Search Input */}
                        <div className="relative lg:col-span-2">
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama kelompok, MK, atau dosen..."
                                className="w-full pl-9 pr-8 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#801720]/15 focus:border-[#801720] transition-all bg-gray-50/50 hover:bg-white"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Periode Filter */}
                        <div>
                            <select
                                value={filters?.periode_id || ''}
                                onChange={(e) => applyFilters({ periode_id: e.target.value })}
                                className="w-full py-2 px-3 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#801720]/15 focus:border-[#801720] transition-all bg-gray-50/50 hover:bg-white cursor-pointer"
                            >
                                <option value="">Semua Periode</option>
                                {periodes.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.nama} ({p.status})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <select
                                value={filters?.status || ''}
                                onChange={(e) => applyFilters({ status: e.target.value })}
                                className="w-full py-2 px-3 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#801720]/15 focus:border-[#801720] transition-all bg-gray-50/50 hover:bg-white cursor-pointer"
                            >
                                <option value="">Semua Status</option>
                                <option value="DRAFT">Draft</option>
                                <option value="ACTIVE">Aktif</option>
                                <option value="INACTIVE">Nonaktif</option>
                                <option value="CLOSED">Selesai (Closed)</option>
                            </select>
                        </div>

                        {/* Koordinator MK Filter */}
                        <div>
                            <select
                                value={filters?.koordinator_id || ''}
                                onChange={(e) => applyFilters({ koordinator_id: e.target.value })}
                                className="w-full py-2 px-3 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#801720]/15 focus:border-[#801720] transition-all bg-gray-50/50 hover:bg-white cursor-pointer"
                            >
                                <option value="">Semua Koordinator</option>
                                {dosens.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.kode_dosen} - {d.nama_lengkap}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Active filter count & reset */}
                    {(filters?.periode_id || filters?.status || filters?.koordinator_id || filters?.tahun_ajaran_id || search) && (
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px] text-gray-500">
                            <span>Menampilkan hasil terfilter</span>
                            <button
                                onClick={resetFilters}
                                className="inline-flex items-center gap-1 text-[#801720] hover:underline font-bold cursor-pointer"
                            >
                                <RotateCcw className="w-3 h-3" /> Reset Semua Filter
                            </button>
                        </div>
                    )}
                </div>

                {/* Main Data Table */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-400 font-extrabold uppercase tracking-wider text-[10px]">
                                <tr>
                                    <th className="py-3.5 px-4 w-12 text-center">No</th>
                                    <th className="py-3.5 px-4 min-w-[200px]">Nama Kelompok</th>
                                    <th className="py-3.5 px-4 min-w-[160px]">Periode</th>
                                    <th className="py-3.5 px-4 min-w-[170px]">Mata Kuliah</th>
                                    <th className="py-3.5 px-4 min-w-[150px]">Koordinator MK</th>
                                    <th className="py-3.5 px-4 min-w-[140px]">Verifikator</th>
                                    <th className="py-3.5 px-4 text-center">Status</th>
                                    <th className="py-3.5 px-4 text-gray-400">Dibuat Pada</th>
                                    <th className="py-3.5 px-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {dataList.data && dataList.data.length > 0 ? (
                                    dataList.data.map((item, index) => {
                                        const mkCount = item.mata_kuliah?.length || 0;
                                        const verifikatorCount = item.verifikator?.length || 0;
                                        const koordinatorCount = item.koordinator?.length || 0;
                                        const firstMk = item.mata_kuliah?.[0];
                                        const firstKoordinator = firstMk?.koordinator;

                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                                                <td className="py-3.5 px-4 text-center font-bold text-gray-400">
                                                    {(dataList.current_page - 1) * dataList.per_page + index + 1}
                                                </td>

                                                {/* Nama Kelompok */}
                                                <td className="py-3.5 px-4">
                                                    <Link
                                                        href={`/superadmin/kelompok-verifikasi/${item.id}`}
                                                        className="font-extrabold text-gray-900 hover:text-[#801720] transition-colors block text-[13px]"
                                                    >
                                                        {item.nama}
                                                    </Link>
                                                    {item.keterangan && (
                                                        <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5 font-normal">
                                                             {item.keterangan}
                                                        </p>
                                                    )}
                                                </td>

                                                {/* Periode */}
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <span className="font-bold text-gray-800 block">
                                                        {item.periode?.nama || '—'}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">
                                                        {item.periode?.tahun_ajaran?.nama || ''}
                                                    </span>
                                                </td>

                                                {/* Mata Kuliah */}
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    {mkCount === 0 ? (
                                                        <span className="text-gray-400 italic">Belum ada MK</span>
                                                    ) : mkCount === 1 ? (
                                                        <span className="font-semibold text-gray-800 truncate max-w-[200px] block">
                                                            {firstMk.mata_kuliah?.kode_mk} - {firstMk.mata_kuliah?.nama_mk}
                                                        </span>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-800 font-bold rounded-lg text-[11px] whitespace-nowrap">
                                                                <BookOpen className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                                                <span>{mkCount} Mata Kuliah</span>
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Koordinator MK */}
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    {mkCount === 0 ? (
                                                        <span className="text-gray-400">—</span>
                                                    ) : koordinatorCount > 1 ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-[#801720] font-bold rounded-lg text-[11px] border border-red-100 whitespace-nowrap">
                                                            <GraduationCap className="w-3.5 h-3.5 text-[#801720] shrink-0" />
                                                            <span>{koordinatorCount} Koordinator</span>
                                                        </span>
                                                    ) : firstKoordinator ? (
                                                        <div>
                                                            <span className="font-bold text-gray-800 block">
                                                                {firstKoordinator?.kode_dosen || '-'}
                                                            </span>
                                                            <span className="text-[10px] text-gray-400 truncate max-w-[140px] block">
                                                                {firstKoordinator?.nama_lengkap || '-'}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-gray-600 bg-gray-100 rounded-lg whitespace-nowrap">
                                                            {mkCount} Koordinator
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Verifikator */}
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    {verifikatorCount === 0 ? (
                                                        <span className="text-gray-400 italic">0 Orang</span>
                                                    ) : verifikatorCount === 1 ? (
                                                        <div>
                                                            <span className="font-bold text-gray-800 block">
                                                                {item.verifikator[0]?.dosen?.kode_dosen || '-'}
                                                            </span>
                                                            <span className="text-[10px] text-gray-400 truncate max-w-[130px] block">
                                                                {item.verifikator[0]?.dosen?.nama_lengkap || '-'}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 font-bold rounded-lg text-[11px] border border-blue-100 whitespace-nowrap">
                                                            <Shield className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                                            <span>{verifikatorCount} Verifikator</span>
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Status */}
                                                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                                    <StatusBadge status={item.status} />
                                                </td>

                                                {/* Tanggal */}
                                                <td className="py-3.5 px-4 text-gray-500 text-[11px] whitespace-nowrap">
                                                    {formatDate(item.created_at)}
                                                </td>

                                                {/* Aksi */}
                                                <td className="py-3.5 px-4 text-right">
                                                    <div className="inline-flex items-center gap-1.5 justify-end">
                                                        <Link
                                                            href={`/superadmin/kelompok-verifikasi/${item.id}`}
                                                            className="p-1.5 text-gray-500 hover:text-[#801720] hover:bg-gray-100 rounded-xl transition-colors"
                                                            title="Lihat Detail"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Link>

                                                        {item.status === 'DRAFT' && (
                                                            <>
                                                                <Link
                                                                    href={`/superadmin/kelompok-verifikasi/${item.id}/edit`}
                                                                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                                                    title="Edit Kelompok"
                                                                >
                                                                    <Pencil className="w-4 h-4" />
                                                                </Link>
                                                                <button
                                                                    onClick={() => handleAction(item, 'activate')}
                                                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                                                                    title="Aktifkan Kelompok"
                                                                >
                                                                    <Play className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleAction(item, 'delete')}
                                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                                                                    title="Hapus Draft"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}

                                                        {item.status === 'ACTIVE' && (
                                                            <>
                                                                <Link
                                                                    href={`/superadmin/kelompok-verifikasi/${item.id}/edit`}
                                                                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                                                    title="Edit Penugasan"
                                                                >
                                                                    <Pencil className="w-4 h-4" />
                                                                </Link>
                                                                <button
                                                                    onClick={() => handleAction(item, 'deactivate')}
                                                                    className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                                                                    title="Nonaktifkan Kelompok"
                                                                >
                                                                    <PowerOff className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}

                                                        {item.status === 'INACTIVE' && (
                                                            <>
                                                                <Link
                                                                    href={`/superadmin/kelompok-verifikasi/${item.id}/edit`}
                                                                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                                                    title="Edit Penugasan"
                                                                >
                                                                    <Pencil className="w-4 h-4" />
                                                                </Link>
                                                                <button
                                                                    onClick={() => handleAction(item, 'activate')}
                                                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                                                                    title="Aktifkan Kembali"
                                                                >
                                                                    <Play className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}

                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="py-12 text-center">
                                            <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                                                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 mb-3">
                                                    <FolderKanban className="w-6 h-6" />
                                                </div>
                                                <p className="text-sm font-bold text-gray-800">Tidak ada kelompok verifikasi</p>
                                                <p className="text-xs text-gray-400 mt-1 text-center">
                                                    {search || filters?.periode_id || filters?.status || filters?.koordinator_id
                                                        ? 'Tidak ditemukan data yang cocok dengan kriteria pencarian / filter Anda.'
                                                        : 'Belum ada kelompok verifikasi yang dibuat. Buat kelompok baru untuk mulai menugaskan koordinator dan verifikator.'}
                                                </p>
                                                <Link
                                                    href="/superadmin/kelompok-verifikasi/create"
                                                    className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#801720] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#681219] transition-colors"
                                                >
                                                    <Plus className="w-3.5 h-3.5" /> Buat Kelompok Pertama
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {dataList.links && dataList.links.length > 3 && (
                        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                            <div>
                                Menampilkan <span className="font-bold text-gray-800">{dataList.from || 0}</span> -{' '}
                                <span className="font-bold text-gray-800">{dataList.to || 0}</span> dari{' '}
                                <span className="font-bold text-gray-800">{dataList.total || 0}</span> data
                            </div>
                            <div className="flex items-center gap-1">
                                {dataList.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        preserveScroll
                                        className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                                            link.active
                                                ? 'bg-[#801720] text-white'
                                                : link.url
                                                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                                : 'bg-transparent text-gray-300 cursor-not-allowed'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Konfirmasi Aksi */}
                {actionItem && actionType && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-100">
                        <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-4">
                            <div className="flex items-start gap-3">
                                <div className={`p-3 rounded-2xl ${
                                    actionType === 'activate' ? 'bg-emerald-50 text-emerald-600' :
                                    actionType === 'deactivate' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                                }`}>
                                    {actionType === 'activate' ? <Play className="w-6 h-6" /> :
                                     actionType === 'deactivate' ? <PowerOff className="w-6 h-6" /> : <Trash2 className="w-6 h-6" />}
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-base font-extrabold text-gray-900">
                                        {actionType === 'activate' ? 'Aktifkan Kelompok Verifikasi?' :
                                         actionType === 'deactivate' ? 'Nonaktifkan Kelompok Verifikasi?' : 'Hapus Kelompok Verifikasi?'}
                                    </h3>
                                    <p className="text-xs text-gray-500 leading-relaxed">
                                        {actionType === 'activate' ? `Kelompok "${actionItem.nama}" akan diaktifkan. Seluruh koordinator dan tim verifikator yang ditugaskan akan langsung mendapatkan akses operasional.` :
                                         actionType === 'deactivate' ? `Kelompok "${actionItem.nama}" akan dinonaktifkan sementara. Penugasan operasional dosen akan dihentikan.` :
                                         `Kelompok "${actionItem.nama}" akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                                <button
                                    onClick={() => { setActionItem(null); setActionType(null); }}
                                    disabled={processing}
                                    className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleConfirmAction}
                                    disabled={processing}
                                    className={`px-4 py-2 text-xs font-bold text-white rounded-xl transition-all shadow-sm cursor-pointer ${
                                        actionType === 'activate' ? 'bg-emerald-600 hover:bg-emerald-700' :
                                        actionType === 'deactivate' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-600 hover:bg-red-700'
                                    }`}
                                >
                                    {processing ? 'Memproses...' : 'Ya, Lanjutkan'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
