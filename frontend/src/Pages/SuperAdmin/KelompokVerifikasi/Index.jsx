import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ArrowLeft,
    Plus,
    Pencil,
    Eye,
    Search,
    X,
    FolderKanban,
    Play,
    Lock,
    Clock,
    Shield,
    BookOpen,
    RotateCcw,
    GraduationCap,
    MoreVertical
} from 'lucide-react';

import { showConfirm } from '@/Utils/sweetalert';
import { formatDate } from '@/Utils/date';

const STATUS_CONFIG = {
    MENUNGGU_VERIFIKATOR: { label: 'Menunggu Verifikator', bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200/60', dot: 'bg-orange-500' },
    DRAFT:    { label: 'Draf',      bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200/60', dot: 'bg-amber-400' },
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

export default function KelompokVerifikasiIndex({
    list = { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, links: [] }, 
    kelompokList, 
    stats = { total: 0, active: 0, menunggu_verifikator: 0, draft: 0, inactive: 0, closed: 0 }, 
    periodeAll = [], 
    periodeList = [], 
    tahunAjaranAll = [], 
    dosenAll = [], 
    dosenList = [], 
    filters = {} 
}) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState(filters?.search || '');
    const [openMenuId, setOpenMenuId] = useState(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
    const menuRef = useRef(null);
    const buttonRefs = useRef({});

    const handleToggleMenu = (e, id) => {
        e.stopPropagation();
        if (openMenuId === id) {
            setOpenMenuId(null);
        } else {
            const rect = e.currentTarget.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const menuHeight = 90;
            const openUpward = spaceBelow < menuHeight && rect.top > menuHeight;

            setMenuPosition({
                top: openUpward ? rect.top - menuHeight - 4 : rect.bottom + 4,
                right: Math.max(16, window.innerWidth - rect.right),
            });
            setOpenMenuId(id);
        }
    };

    // Tutup dropdown saat klik di luar atau saat scroll / resize
    useEffect(() => {
        if (!openMenuId) return;

        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                const btn = buttonRefs.current[openMenuId];
                if (!btn || !btn.contains(e.target)) {
                    setOpenMenuId(null);
                }
            }
        };

        const handleScrollOrResize = () => {
            setOpenMenuId(null);
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScrollOrResize, true);
        window.addEventListener('resize', handleScrollOrResize);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
        };
    }, [openMenuId]);

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
                confirmButtonColor: '#9E1B28',
            });
            if (result.isConfirmed) {
                router.post(`/superadmin/kelompok-verifikasi/${item.id}/deactivate`, {}, { preserveScroll: true });
            }
        } else if (type === 'reset-verifikator') {
            const result = await showConfirm({
                title: 'Reset Verifikator?',
                text: `Reset kelompok "${item.nama}" kembali ke status Menunggu Verifikator? Semua data verifikator akan dihapus dan koordinator MK harus menentukan ulang.`,
                icon: 'warning',
                confirmButtonText: 'Ya, Reset',
                confirmButtonColor: '#d97706',
            });
            if (result.isConfirmed) {
                setOpenMenuId(null);
                router.post(`/superadmin/kelompok-verifikasi/${item.id}/reset-verifikator`, {}, { preserveScroll: true });
            }
        }

    };

    return (
        <AuthenticatedLayout title="Kelompok Verifikasi">
            <Head title="Kelompok Verifikasi - Super Admin" />

            <div className="space-y-6 w-full pb-12">
                
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-[#9E1B28] to-[#9E1B28] rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-red-900/10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold backdrop-blur-xs text-rose-100 mb-2 border border-white/10">
                                <FolderKanban className="w-3.5 h-3.5" />
                                <span>Penugasan</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Kelompok Verifikasi</h1>
                            <p className="text-xs sm:text-sm text-rose-100/90 font-medium max-w-2xl">
                                Kelola target mata kuliah, koordinator MK, dan tim verifikator dalam satu kelompok penugasan terpadu.
                            </p>
                        </div>
                        <Link
                            href="/superadmin/kelompok-verifikasi/create"
                            className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#9E1B28] rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer hover:bg-rose-50 flex-shrink-0 self-start sm:self-auto"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Buat Kelompok</span>
                        </Link>
                    </div>
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
                        iconBg="bg-orange-50"
                        iconColor="text-orange-500"
                        value={(stats?.menunggu_verifikator ?? 0) + (stats?.draft ?? 0)}
                        label="MENUNGGU VERIFIKATOR"
                        sublabel="Koordinator Belum Submit"
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        
                        {/* Search Input */}
                        <div className="relative lg:col-span-2">
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama kelompok, MK, atau dosen..."
                                className="w-full pl-9 pr-8 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9E1B28]/15 focus:border-[#9E1B28] transition-all bg-gray-50/50 hover:bg-white"
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
                                className="w-full py-2 px-3 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9E1B28]/15 focus:border-[#9E1B28] transition-all bg-gray-50/50 hover:bg-white cursor-pointer"
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
                                className="w-full py-2 px-3 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9E1B28]/15 focus:border-[#9E1B28] transition-all bg-gray-50/50 hover:bg-white cursor-pointer"
                            >
                                <option value="">Semua Status</option>
                                <option value="MENUNGGU_VERIFIKATOR">Menunggu Verifikator</option>
                                <option value="ACTIVE">Aktif</option>
                                <option value="INACTIVE">Nonaktif</option>
                                <option value="CLOSED">Selesai (Closed)</option>
                                <option value="DRAFT">Draf (Lama)</option>
                            </select>
                        </div>
                    </div>

                    {/* Active filter count & reset */}
                    {(filters?.periode_id || filters?.status || filters?.tahun_ajaran_id || search) && (
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px] text-gray-500">
                            <span>Menampilkan hasil terfilter</span>
                            <button
                                onClick={resetFilters}
                                className="inline-flex items-center gap-1 text-[#9E1B28] hover:underline font-bold cursor-pointer"
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
                                                        className="font-extrabold text-gray-900 hover:text-[#9E1B28] transition-colors block text-[13px]"
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
                                                    {item.periode?.tahun_ajaran?.nama && item.periode?.tahun_ajaran?.nama !== '-' && (
                                                        <span className="text-[10px] text-gray-400">
                                                            {item.periode.tahun_ajaran.nama}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Mata Kuliah */}
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    {mkCount === 0 ? (
                                                        <span className="text-gray-400 italic">Belum ada MK</span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-800 font-bold rounded-lg text-[11px] whitespace-nowrap">
                                                            <BookOpen className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                                            <span>{mkCount} Mata Kuliah</span>
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Koordinator MK */}
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    {koordinatorCount === 0 ? (
                                                        <span className="text-gray-400">—</span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-[#9E1B28] font-bold rounded-lg text-[11px] border border-red-100 whitespace-nowrap">
                                                            <GraduationCap className="w-3.5 h-3.5 text-[#9E1B28] shrink-0" />
                                                            <span>{koordinatorCount} Koordinator</span>
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Verifikator */}
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    {item.status === 'MENUNGGU_VERIFIKATOR' ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 text-orange-600 font-bold rounded-lg text-[11px] border border-orange-100 whitespace-nowrap">
                                                            <Clock className="w-3.5 h-3.5 shrink-0" />
                                                            <span>Menunggu Koordinator</span>
                                                        </span>
                                                    ) : verifikatorCount === 0 ? (
                                                        <span className="text-gray-400 italic">0 Orang</span>
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

                                                {/* Aksi  Kebab Menu */}
                                                <td className="py-3.5 px-4 text-right">
                                                    <div className="inline-block">
                                                        {/* Tombol  */}
                                                        <button
                                                            ref={(el) => { buttonRefs.current[item.id] = el; }}
                                                            onClick={(e) => handleToggleMenu(e, item.id)}
                                                            className="p-1.5 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer"
                                                            title="Aksi"
                                                        >
                                                            <MoreVertical className="w-4 h-4" />
                                                        </button>
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
                                                ? 'bg-[#9E1B28] text-white'
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
            </div>

            {/* Dropdown Menu Portaled to document.body (tampil di luar box card tanpa scroll) */}
            {typeof document !== 'undefined' && openMenuId && (() => {
                const activeItem = dataList.data?.find((d) => d.id === openMenuId);
                if (!activeItem) return null;

                return createPortal(
                    <div
                        ref={menuRef}
                        style={{
                            position: 'fixed',
                            top: `${menuPosition.top}px`,
                            right: `${menuPosition.right}px`,
                            zIndex: 99999,
                        }}
                        className="min-w-[170px] bg-white border border-gray-100 rounded-2xl shadow-xl py-1 animate-fadeIn"
                    >
                        {/* Lihat Detail  selalu tampil */}
                        <Link
                            href={`/superadmin/kelompok-verifikasi/${activeItem.id}`}
                            onClick={() => setOpenMenuId(null)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            <Eye className="w-3.5 h-3.5 text-gray-500" />
                            Lihat Detail
                        </Link>

                        {/* Ubah Kelompok */}
                        {activeItem.status !== 'CLOSED' && (
                            <>
                                <div className="my-1 border-t border-gray-100" />
                                <Link
                                    href={`/superadmin/kelompok-verifikasi/${activeItem.id}/edit`}
                                    onClick={() => setOpenMenuId(null)}
                                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    <Pencil className="w-3.5 h-3.5 text-gray-500" />
                                    Ubah Kelompok
                                </Link>
                            </>
                        )}

                        {/* Reset Verifikator — hanya untuk ACTIVE */}
                        {activeItem.status === 'ACTIVE' && (
                            <>
                                <div className="my-1 border-t border-gray-100" />
                                <button
                                    onClick={() => { handleAction(activeItem, 'reset-verifikator'); }}
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-orange-600 hover:bg-orange-50 transition-colors cursor-pointer"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Reset Verifikator
                                </button>
                            </>
                        )}
                    </div>,
                    document.body
                );
            })()}
        </AuthenticatedLayout>
    );
}
