import React, { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Plus, Pencil, Trash2, AlertTriangle, X, Calendar, Search, CheckCircle2,
    PauseCircle, FileText, Eye, ChevronLeft, ChevronRight, History, ListChecks,
    BarChart3, Clock,
} from 'lucide-react';

import FlashAlert from '@/Components/FlashAlert';
import { showToast, showAlert, showConfirm } from '@/Utils/sweetalert';

function Toast({ flash }) {
    return <FlashAlert type="toast" flash={flash} />;
}


function Modal({ open, onClose, title, children }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <h2 className="text-base font-bold text-gray-800">{title}</h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-5">{children}</div>
            </div>
        </div>
    );
}

function TahunAjaranForm({ form, setForm, onSubmit, processing, editItem }) {
    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Tahun Ajaran <span className="text-red-500">*</span></label>
                <input type="text" value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] outline-none"
                    placeholder="Contoh: 2026/2027" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Tahun Mulai</label>
                    <input type="number" min="2000" max="2100" value={form.tahun_mulai} onChange={e => setForm(f => ({ ...f, tahun_mulai: +e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] outline-none" required />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Tahun Selesai</label>
                    <input type="number" min="2000" max="2100" value={form.tahun_selesai} onChange={e => setForm(f => ({ ...f, tahun_selesai: +e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] outline-none" required />
                </div>
            </div>
            {editItem && (
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] outline-none">
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                    </select>
                </div>
            )}
            <div className="flex justify-end pt-2">
                <button type="submit" disabled={processing} className="px-5 py-2.5 bg-[#801720] text-white rounded-xl text-sm font-semibold hover:bg-[#6a1219] disabled:opacity-60 cursor-pointer">
                    {processing ? 'Menyimpan...' : 'Simpan'}
                </button>
            </div>
        </form>
    );
}

function StatCard({ icon: Icon, iconBg, iconColor, value, label, sublabel }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div className="min-w-0">
                <p className="text-2xl font-extrabold text-gray-800 leading-tight">{value}</p>
                <p className="text-xs font-bold text-gray-700 leading-tight mt-0.5">{label}</p>
                {sublabel && <p className="text-[10px] text-gray-400">{sublabel}</p>}
            </div>
        </div>
    );
}

const statusBadge = (s) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${s === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${s === 'ACTIVE' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
        {s === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
    </span>
);

const periodeStatusBadge = (s) => {
    const cfg = {
        ACTIVE:   { label: 'Aktif',       bg: 'bg-emerald-100', text: 'text-emerald-700' },
        DRAFT:    { label: 'Belum Aktif', bg: 'bg-orange-100',  text: 'text-orange-600' },
        CLOSED:   { label: 'Selesai',     bg: 'bg-blue-100',    text: 'text-blue-600' },
        INACTIVE: { label: 'Nonaktif',    bg: 'bg-gray-100',    text: 'text-gray-500' },
    }[s] || { label: s, bg: 'bg-gray-100', text: 'text-gray-500' };
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>;
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const formatDateTime = (d) => d ? new Date(d).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const relativeTime = (dateStr) => {
    if (!dateStr) return '-';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Baru saja';
    if (mins < 60) return `${mins} menit lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    return `${days} hari lalu`;
};

const DETAIL_TABS = [
    { key: 'periode',   label: 'Periode',   icon: ListChecks },
    { key: 'statistik', label: 'Statistik', icon: BarChart3 },
    { key: 'riwayat',   label: 'Riwayat',   icon: History },
];

export default function TahunAjaranIndex({ list, stats, filters, selectedTahunAjaran }) {
    const { flash } = usePage().props;
    const [showAdd, setShowAdd] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [deleteItem, setDeleteItem] = useState(null);
    const [showAddPeriode, setShowAddPeriode] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [detailTab, setDetailTab] = useState('periode');
    const [search, setSearch] = useState(filters?.search || '');

    // Real-time reactive search with 300ms debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            const currentSearch = filters?.search || '';
            if (search !== currentSearch) {
                applyFilters({ search });
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    const currentYear = new Date().getFullYear();
    const today = new Date().toISOString().substring(0, 10);
    const [form, setForm] = useState({ nama: '', tahun_mulai: currentYear, tahun_selesai: currentYear + 1, status: 'ACTIVE' });
    const [periodeForm, setPeriodeForm] = useState({ nama: '', tanggal_mulai: today, tanggal_selesai: today, deadline_upload: today });

    const applyFilters = (next) => {
        router.get('/superadmin/tahun-ajaran', { ...filters, ...next }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const handleAdd = (e) => {
        e.preventDefault(); setProcessing(true);
        router.post('/superadmin/tahun-ajaran', form, { onFinish: () => { setProcessing(false); setShowAdd(false); } });
    };

    const handleEdit = (e) => {
        e.preventDefault(); setProcessing(true);
        router.put(`/superadmin/tahun-ajaran/${editItem.id}`, form, { onFinish: () => { setProcessing(false); setEditItem(null); } });
    };

    const handleDelete = async (item = deleteItem) => {
        if (!item) return;
        const result = await showConfirm({
            title: 'Hapus Tahun Ajaran?',
            text: `Apakah Anda yakin ingin menghapus tahun ajaran "${item?.nama}"? Data periode terkait juga akan terhapus.`,
            icon: 'warning',
            confirmButtonText: 'Ya, Hapus Data',
            confirmButtonColor: '#CD202E',
        });
        if (result.isConfirmed) {
            router.delete(`/superadmin/tahun-ajaran/${item.id}`, {
                onFinish: () => { setDeleteItem(null); },
            });
        }
    };

    const toggleStatus = async (item) => {
        const isActivating = item.status !== 'ACTIVE';
        const result = await showConfirm({
            title: isActivating ? 'Aktifkan Tahun Ajaran?' : 'Nonaktifkan Tahun Ajaran?',
            text: isActivating 
                ? `Aktifkan tahun ajaran "${item.nama}" sebagai tahun ajaran aktif?` 
                : `Nonaktifkan tahun ajaran "${item.nama}"?`,
            icon: 'question',
            confirmButtonText: isActivating ? 'Ya, Aktifkan' : 'Ya, Nonaktifkan',
            confirmButtonColor: isActivating ? '#059669' : '#801720',
        });
        if (result.isConfirmed) {
            router.put(`/superadmin/tahun-ajaran/${item.id}`, {
                nama: item.nama, tahun_mulai: item.tahun_mulai, tahun_selesai: item.tahun_selesai,
                status: item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
            }, { preserveScroll: true });
        }
    };


    const openEdit = (item) => {
        setForm({ nama: item.nama, tahun_mulai: item.tahun_mulai, tahun_selesai: item.tahun_selesai, status: item.status });
        setEditItem(item);
    };

    const handleAddPeriode = (e) => {
        e.preventDefault(); setProcessing(true);
        router.post('/superadmin/periode', { ...periodeForm, tahun_ajaran_id: selectedTahunAjaran.tahunAjaran.id }, {
            onFinish: () => { setProcessing(false); setShowAddPeriode(false); setPeriodeForm({ nama: '', tanggal_mulai: today, tanggal_selesai: today, deadline_upload: today }); },
        });
    };



    const st = selectedTahunAjaran?.statistik;

    return (
        <AuthenticatedLayout title="Tahun Ajaran">
            <Head title="Tahun Ajaran" />
            <Toast flash={flash} />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-[#801720]" /> Tahun Ajaran
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Kelola tahun ajaran akademik yang digunakan dalam sistem.</p>
                </div>

                <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
                    {/* LEFT: List */}
                    <div className="space-y-5 min-w-0">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <StatCard icon={Calendar} iconBg="bg-red-50" iconColor="text-[#801720]" value={stats.total} label="Total Tahun Ajaran" sublabel="Semua tahun ajaran" />
                            <StatCard icon={CheckCircle2} iconBg="bg-emerald-50" iconColor="text-emerald-600" value={stats.aktif} label="Aktif" sublabel="Tahun aktif saat ini" />
                            <StatCard icon={PauseCircle} iconBg="bg-orange-50" iconColor="text-orange-500" value={stats.nonaktif} label="Nonaktif" sublabel="Tahun tidak aktif" />
                            <StatCard icon={FileText} iconBg="bg-blue-50" iconColor="text-blue-500" value={stats.total_periode} label="Total Periode" sublabel="Periode terdaftar" />
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap gap-2 flex-1">
                                <form onSubmit={e => e.preventDefault()} className="relative flex-1 min-w-[180px]">
                                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Cari tahun ajaran..."
                                        className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#801720]/20 bg-white"
                                    />
                                </form>
                                <select value={filters?.status || ''} onChange={e => applyFilters({ status: e.target.value })}
                                    className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#801720]/20">
                                    <option value="">Semua Status</option>
                                    <option value="ACTIVE">Aktif</option>
                                    <option value="INACTIVE">Nonaktif</option>
                                </select>
                                <select value={filters?.sort || 'terbaru'} onChange={e => applyFilters({ sort: e.target.value })}
                                    className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#801720]/20">
                                    <option value="terbaru">Urutkan: Terbaru</option>
                                    <option value="terlama">Urutkan: Terlama</option>
                                    <option value="nama">Urutkan: Nama</option>
                                </select>
                            </div>
                            <button onClick={() => { setForm({ nama: '', tahun_mulai: currentYear, tahun_selesai: currentYear + 1, status: 'ACTIVE' }); setShowAdd(true); }}
                                className="flex items-center gap-1.5 px-4 py-2.5 bg-[#801720] text-white rounded-xl text-xs font-semibold hover:bg-[#6a1219] transition-all shadow-sm">
                                <Plus className="w-3.5 h-3.5" /> Tambah Tahun Ajaran
                            </button>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">No</th>
                                            <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Tahun Ajaran</th>
                                            <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Jumlah Periode</th>
                                            <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Dibuat Pada</th>
                                            <th className="text-right px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {list.data?.length === 0 ? (
                                            <tr><td colSpan={6} className="text-center py-14 text-gray-400">Belum ada tahun ajaran yang cocok.</td></tr>
                                        ) : list.data?.map((item, idx) => (
                                            <tr key={item.id}
                                                className={`hover:bg-gray-50/50 cursor-pointer transition-colors ${selectedTahunAjaran?.tahunAjaran?.id === item.id ? 'bg-red-50/40' : ''}`}
                                                onClick={() => router.get(`/superadmin/tahun-ajaran/${item.id}`, {}, { preserveScroll: true })}
                                            >
                                                <td className="px-5 py-4 text-gray-500 text-xs">{(list.current_page - 1) * list.per_page + idx + 1}</td>
                                                <td className="px-5 py-4">
                                                    <p className="font-semibold text-gray-800">{item.nama}</p>
                                                    <p className="text-[10px] text-gray-400">{item.tahun_mulai} — {item.tahun_selesai}</p>
                                                </td>
                                                <td className="px-5 py-4">{statusBadge(item.status)}</td>
                                                <td className="px-5 py-4 text-gray-700 text-xs font-semibold">{item.periode_verifikasi_count} Periode</td>
                                                <td className="px-5 py-4 text-gray-400 text-xs">{formatDate(item.created_at)}</td>
                                                <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Link href={`/superadmin/tahun-ajaran/${item.id}`} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><Eye className="w-3.5 h-3.5" /></Link>
                                                        <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                                                        <button onClick={() => handleDelete(item)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg cursor-pointer" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button>

                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {list.data?.length > 0 && (
                                <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                                    <span>Menampilkan {list.from}–{list.to} dari {list.total} data</span>
                                    <div className="flex gap-1">
                                        {list.links?.map((link, i) => (
                                            <button key={i} disabled={!link.url}
                                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                                                className={`min-w-[28px] h-7 px-1.5 rounded-lg font-semibold flex items-center justify-center ${link.active ? 'bg-[#801720] text-white' : 'hover:bg-gray-100 text-gray-600 disabled:opacity-40'}`}>
                                                {link.label.includes('Previous') ? <ChevronLeft className="w-3.5 h-3.5" /> : link.label.includes('Next') ? <ChevronRight className="w-3.5 h-3.5" /> : link.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Detail Panel */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm sticky top-6">
                        <div className="p-5 border-b border-gray-100">
                            <h2 className="font-bold text-gray-800">Detail Tahun Ajaran</h2>
                        </div>

                        {!selectedTahunAjaran ? (
                            <div className="p-8 text-center">
                                <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                <p className="text-sm text-gray-400">Pilih tahun ajaran dari daftar untuk melihat detail lengkap.</p>
                            </div>
                        ) : (
                            <>
                                <div className="p-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        {statusBadge(selectedTahunAjaran.tahunAjaran.status)}
                                        <Link href="/superadmin/tahun-ajaran" className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></Link>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-11 h-11 rounded-xl bg-[#801720]/10 flex items-center justify-center flex-shrink-0">
                                            <Calendar className="w-5 h-5 text-[#801720]" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-gray-800 leading-tight">{selectedTahunAjaran.tahunAjaran.nama}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {selectedTahunAjaran.tahunAjaran.status === 'ACTIVE' ? 'Tahun Ajaran Aktif' : 'Tahun Ajaran Nonaktif'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-xs pt-1">
                                        {[
                                            ['Periode Aktif', `${st.aktif} Periode`],
                                            ['Jumlah Periode', st.total],
                                            ['Periode Aktif Terakhir', selectedTahunAjaran.periode_aktif_terakhir || '-'],
                                            ['Dibuat Pada', formatDateTime(selectedTahunAjaran.tahunAjaran.created_at)],
                                            ['Dibuat Oleh', selectedTahunAjaran.dibuat_oleh || '-'],
                                        ].map(([label, value]) => (
                                            <div key={label} className="flex items-center justify-between py-1 border-b border-gray-50">
                                                <span className="text-gray-400 font-semibold">{label}</span>
                                                <span className="text-gray-700 font-bold text-right">{value}</span>
                                            </div>
                                        ))}
                                        <div className="pt-1">
                                            <span className="text-gray-400 font-semibold block mb-1">Keterangan</span>
                                            <p className="text-gray-600 leading-relaxed">
                                                {selectedTahunAjaran.tahunAjaran.status === 'ACTIVE'
                                                    ? 'Tahun ajaran aktif saat ini.'
                                                    : 'Tahun ajaran ini sudah tidak digunakan.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Tabs */}
                                <div className="border-t border-gray-100">
                                    <div className="flex overflow-x-auto">
                                        {DETAIL_TABS.map(t => {
                                            const Icon = t.icon;
                                            const active = detailTab === t.key;
                                            return (
                                                <button key={t.key} onClick={() => setDetailTab(t.key)}
                                                    className={`flex items-center gap-1.5 px-3.5 py-3 text-[11px] font-bold whitespace-nowrap border-b-2 transition-colors ${
                                                        active ? 'border-[#801720] text-[#801720]' : 'border-transparent text-gray-400 hover:text-gray-600'
                                                    }`}>
                                                    <Icon className="w-3.5 h-3.5" /> {t.label}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="p-5">
                                        {detailTab === 'periode' && (
                                            <div>
                                                <div className="flex items-center justify-end mb-3">
                                                    <button onClick={() => setShowAddPeriode(true)}
                                                        className="flex items-center gap-1.5 px-3 py-2 bg-[#801720] text-white rounded-lg text-[11px] font-bold hover:bg-[#6a1219]">
                                                        <Plus className="w-3.5 h-3.5" /> Tambah Periode
                                                    </button>
                                                </div>
                                                {selectedTahunAjaran.tahunAjaran.periode_verifikasi?.length === 0 ? (
                                                    <p className="text-xs text-gray-400 text-center py-6">Belum ada periode untuk tahun ajaran ini.</p>
                                                ) : (
                                                    <div className="overflow-x-auto -mx-1">
                                                        <table className="w-full text-xs">
                                                            <thead>
                                                                <tr className="text-left text-[10px] text-gray-400 uppercase font-bold">
                                                                    <th className="px-1 py-1.5">Periode</th>
                                                                    <th className="px-1 py-1.5">Mulai</th>
                                                                    <th className="px-1 py-1.5">Selesai</th>
                                                                    <th className="px-1 py-1.5">Status</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-50">
                                                                {selectedTahunAjaran.tahunAjaran.periode_verifikasi?.map(p => (
                                                                    <tr key={p.id}>
                                                                        <td className="px-1 py-2 font-semibold text-gray-700">{p.nama}</td>
                                                                        <td className="px-1 py-2 text-gray-500">{formatDate(p.tanggal_mulai)}</td>
                                                                        <td className="px-1 py-2 text-gray-500">{formatDate(p.tanggal_selesai)}</td>
                                                                        <td className="px-1 py-2">{periodeStatusBadge(p.status)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                                <div className="mt-4 flex items-start gap-2 bg-amber-50 text-amber-700 rounded-xl px-3 py-2.5 text-[11px]">
                                                    <Clock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                                    Periode aktif akan digunakan sebagai acuan untuk proses verifikasi soal dan penugasan.
                                                </div>
                                            </div>
                                        )}

                                        {detailTab === 'statistik' && (
                                            <div className="grid grid-cols-2 gap-2.5">
                                                {[
                                                    ['Total Periode', st.total, 'text-gray-700'],
                                                    ['Aktif', st.aktif, 'text-emerald-600'],
                                                    ['Akan Datang', st.draft, 'text-orange-500'],
                                                    ['Selesai', st.closed + st.inactive, 'text-blue-500'],
                                                ].map(([label, value, color]) => (
                                                    <div key={label} className="bg-gray-50 rounded-xl p-3">
                                                        <p className={`text-xl font-extrabold ${color}`}>{value}</p>
                                                        <p className="text-[10px] text-gray-400 font-semibold">{label}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {detailTab === 'riwayat' && (
                                            selectedTahunAjaran.riwayat.length === 0 ? (
                                                <p className="text-xs text-gray-400 text-center py-6">Belum ada riwayat perubahan.</p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {selectedTahunAjaran.riwayat.map(log => (
                                                        <div key={log.id} className="flex items-start gap-2.5">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-[#801720] mt-1.5 flex-shrink-0" />
                                                            <div className="min-w-0">
                                                                <p className="text-xs text-gray-700 font-semibold">{log.description}</p>
                                                                <p className="text-[10px] text-gray-400">{log.user} · {relativeTime(log.created_at)}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>

                                <div className="p-5 border-t border-gray-100 flex gap-2">
                                    <button onClick={() => openEdit(selectedTahunAjaran.tahunAjaran)}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50">
                                        <Pencil className="w-3.5 h-3.5" /> Edit Tahun Ajaran
                                    </button>
                                    <button onClick={() => toggleStatus(selectedTahunAjaran.tahunAjaran)}
                                        className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold ${
                                            selectedTahunAjaran.tahunAjaran.status === 'ACTIVE' ? 'border border-red-200 text-red-600 hover:bg-red-50' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                        }`}>
                                        <PauseCircle className="w-3.5 h-3.5" /> {selectedTahunAjaran.tahunAjaran.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Tambah Tahun Ajaran">
                <TahunAjaranForm
                    form={form}
                    setForm={setForm}
                    onSubmit={handleAdd}
                    processing={processing}
                    editItem={null}
                />
            </Modal>
            <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Tahun Ajaran">
                <TahunAjaranForm
                    form={form}
                    setForm={setForm}
                    onSubmit={handleEdit}
                    processing={processing}
                    editItem={editItem}
                />
            </Modal>
            <Modal open={!!deleteItem} onClose={() => setDeleteItem(null)} title="Hapus Tahun Ajaran">
                <div className="flex items-start gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
                    <p className="text-sm text-gray-700">Hapus tahun ajaran <strong>{deleteItem?.nama}</strong>? Data periode terkait juga akan terhapus.</p>
                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={() => setDeleteItem(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50">Batal</button>
                    <button onClick={handleDelete} disabled={processing} className="px-4 py-2 text-sm bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-60">
                        {processing ? 'Menghapus...' : 'Ya, Hapus'}
                    </button>
                </div>
            </Modal>

            {selectedTahunAjaran && (
                <Modal open={showAddPeriode} onClose={() => setShowAddPeriode(false)} title={`Tambah Periode — ${selectedTahunAjaran.tahunAjaran.nama}`}>
                    <form onSubmit={handleAddPeriode} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Periode <span className="text-red-500">*</span></label>
                            <input type="text" value={periodeForm.nama} onChange={e => setPeriodeForm(f => ({ ...f, nama: e.target.value }))}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] outline-none"
                                placeholder="Contoh: Ganjil 2026/2027" required />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Tanggal Mulai</label>
                                <input type="date" value={periodeForm.tanggal_mulai} onChange={e => setPeriodeForm(f => ({ ...f, tanggal_mulai: e.target.value }))}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] outline-none" required />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Tanggal Selesai</label>
                                <input type="date" value={periodeForm.tanggal_selesai} onChange={e => setPeriodeForm(f => ({ ...f, tanggal_selesai: e.target.value }))}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] outline-none" required />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Deadline Upload Soal</label>
                            <input type="date" value={periodeForm.deadline_upload} onChange={e => setPeriodeForm(f => ({ ...f, deadline_upload: e.target.value }))}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] outline-none" required />
                        </div>
                        <div className="flex justify-end pt-2">
                            <button type="submit" disabled={processing} className="px-5 py-2.5 bg-[#801720] text-white rounded-xl text-sm font-semibold hover:bg-[#6a1219] disabled:opacity-60">
                                {processing ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </AuthenticatedLayout>
    );
}
