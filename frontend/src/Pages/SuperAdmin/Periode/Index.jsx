import React, { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Plus, Pencil, Trash2, AlertTriangle, X, Clock, CheckCircle2, Play, Lock,
    Calendar, Search, Eye, MoreVertical, ChevronLeft, ChevronRight, ArrowLeft,
    Users, FileCheck, BookOpen, ListChecks, History, CalendarClock, Flag,
    CheckCircle, Square,
} from 'lucide-react';

function Toast({ flash }) {
    const [visible, setVisible] = useState(true);
    if (!visible || (!flash?.success && !flash?.error)) return null;
    return (
        <div className={`fixed top-5 right-5 z-50 flex items-start gap-3 p-4 rounded-xl shadow-xl text-white text-sm max-w-sm ${flash.success ? 'bg-emerald-600' : 'bg-red-600'}`}>
            <span className="flex-1">{flash.success || flash.error}</span>
            <button onClick={() => setVisible(false)}><X className="w-4 h-4" /></button>
        </div>
    );
}

function Modal({ open, onClose, title, children }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <h2 className="text-base font-bold text-gray-800">{title}</h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-5">{children}</div>
            </div>
        </div>
    );
}

function PeriodeForm({ form, setForm, onSubmit, processing, editItem }) {
    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Tahun Ajaran <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={form.tahun_ajaran || form.tahun_ajaran_nama || ''}
                    onChange={(e) => setForm((f) => ({ ...f, tahun_ajaran: e.target.value, tahun_ajaran_nama: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] outline-none"
                    placeholder="Contoh: 2026/2027"
                    required
                />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Periode <span className="text-red-500">*</span></label>
                <input type="text" value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] outline-none"
                    placeholder="Contoh: Ganjil 2026/2027" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Tanggal Mulai</label>
                    <input type="date" value={form.tanggal_mulai} onChange={e => setForm(f => ({ ...f, tanggal_mulai: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] outline-none" required />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Tanggal Selesai</label>
                    <input type="date" value={form.tanggal_selesai} onChange={e => setForm(f => ({ ...f, tanggal_selesai: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] outline-none" required />
                </div>
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Deadline Upload Soal</label>
                <input type="date" value={form.deadline_upload} onChange={e => setForm(f => ({ ...f, deadline_upload: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] outline-none" required />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Catatan</label>
                <textarea value={form.catatan} onChange={e => setForm(f => ({ ...f, catatan: e.target.value }))} rows={3}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] outline-none resize-none"
                    placeholder="Opsional" />
            </div>
            <div className="flex justify-end pt-2">
                <button type="submit" disabled={processing} className="px-5 py-2.5 bg-[#801720] text-white rounded-xl text-sm font-semibold hover:bg-[#6a1219] disabled:opacity-60 cursor-pointer">
                    {processing ? 'Menyimpan...' : 'Simpan'}
                </button>
            </div>
        </form>
    );
}

const STATUS_CONFIG = {
    DRAFT:    { label: 'Akan Datang', bg: 'bg-orange-100',  text: 'text-orange-600',  dot: 'bg-orange-500' },
    ACTIVE:   { label: 'Aktif',       bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    CLOSED:   { label: 'Selesai',     bg: 'bg-blue-100',    text: 'text-blue-600',    dot: 'bg-blue-500' },
    INACTIVE: { label: 'Nonaktif',    bg: 'bg-gray-100',    text: 'text-gray-500',    dot: 'bg-gray-400' },
};

function StatusBadge({ status }) {
    const c = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${c.bg} ${c.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            {c.label}
        </span>
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
    { key: 'timeline',   label: 'Timeline',           icon: ListChecks },
    { key: 'penugasan',  label: 'Penugasan',          icon: Users },
    { key: 'statistik',  label: 'Statistik',          icon: FileCheck },
    { key: 'riwayat',    label: 'Riwayat',            icon: History },
];

export default function PeriodeIndex({ list, stats, tahunAjaranAll, tahunAjaranActive, filters, selectedPeriode }) {
    const { flash } = usePage().props;
    const [showAdd, setShowAdd] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [deleteItem, setDeleteItem] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [detailTab, setDetailTab] = useState('timeline');
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

    const today = new Date().toISOString().substring(0, 10);
    const [form, setForm] = useState({
        tahun_ajaran: tahunAjaranActive[0]?.nama || '2026/2027',
        nama: '',
        tanggal_mulai: today,
        tanggal_selesai: today,
        deadline_upload: today,
        catatan: '',
    });

    const applyFilters = (next) => {
        router.get('/superadmin/periode', { ...filters, ...next }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const handleAdd = (e) => {
        e.preventDefault(); setProcessing(true);
        router.post('/superadmin/periode', form, { onFinish: () => { setProcessing(false); setShowAdd(false); } });
    };

    const handleEdit = (e) => {
        e.preventDefault(); setProcessing(true);
        router.put(`/superadmin/periode/${editItem.id}`, form, { onFinish: () => { setProcessing(false); setEditItem(null); } });
    };

    const handleDelete = () => {
        setProcessing(true);
        router.delete(`/superadmin/periode/${deleteItem.id}`, { onFinish: () => { setProcessing(false); setDeleteItem(null); } });
    };

    const activate = (item) => { router.post(`/superadmin/periode/${item.id}/activate`, {}, { preserveScroll: true }); setOpenMenuId(null); };
    const close = (item) => { router.post(`/superadmin/periode/${item.id}/close`, {}, { preserveScroll: true }); setOpenMenuId(null); };

    const openEdit = (item) => {
        setForm({
            tahun_ajaran: item.tahun_ajaran?.nama || '',
            tahun_ajaran_id: item.tahun_ajaran_id || '',
            nama: item.nama,
            tanggal_mulai: item.tanggal_mulai?.substring(0, 10) || today,
            tanggal_selesai: item.tanggal_selesai?.substring(0, 10) || today,
            deadline_upload: item.deadline_upload?.substring(0, 10) || today,
            catatan: item.catatan || '',
        });
        setEditItem(item);
        setOpenMenuId(null);
    };



    return (
        <AuthenticatedLayout title="Periode Verifikasi">
            <Head title="Periode Verifikasi" />
            <Toast flash={flash} />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
                        <Clock className="w-6 h-6 text-[#801720]" /> Periode Verifikasi
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Kelola periode verifikasi soal pada setiap tahun ajaran.</p>
                </div>

                <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
                    {/* LEFT: List */}
                    <div className="space-y-5 min-w-0">
                        {/* Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <StatCard icon={Calendar} iconBg="bg-red-50" iconColor="text-[#801720]" value={stats.total} label="Total Periode" sublabel="Semua periode" />
                            <StatCard icon={CheckCircle2} iconBg="bg-emerald-50" iconColor="text-emerald-600" value={stats.aktif} label="Periode Aktif" sublabel="Sedang berjalan" />
                            <StatCard icon={Clock} iconBg="bg-orange-50" iconColor="text-orange-500" value={stats.akan_datang} label="Akan Datang" sublabel="Belum dimulai" />
                            <StatCard icon={Square} iconBg="bg-blue-50" iconColor="text-blue-500" value={stats.selesai} label="Selesai" sublabel="Telah berakhir" />
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap gap-2">
                            <form onSubmit={e => e.preventDefault()} className="relative flex-1 min-w-[180px]">
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Cari periode..."
                                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#801720]/20 bg-white"
                                />
                            </form>
                            <select value={filters?.tahun_ajaran_id || ''} onChange={e => applyFilters({ tahun_ajaran_id: e.target.value })}
                                className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#801720]/20">
                                <option value="">Semua Tahun Ajaran</option>
                                {tahunAjaranAll.map(ta => <option key={ta.id} value={ta.id}>{ta.nama}</option>)}
                            </select>
                            <select value={filters?.status || ''} onChange={e => applyFilters({ status: e.target.value })}
                                className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#801720]/20">
                                <option value="">Semua Status</option>
                                <option value="DRAFT">Akan Datang</option>
                                <option value="ACTIVE">Aktif</option>
                                <option value="CLOSED">Selesai</option>
                                <option value="INACTIVE">Nonaktif</option>
                            </select>
                            <select value={filters?.sort || 'terbaru'} onChange={e => applyFilters({ sort: e.target.value })}
                                className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#801720]/20">
                                <option value="terbaru">Urutkan: Terbaru</option>
                                <option value="terlama">Urutkan: Terlama</option>
                                <option value="nama">Urutkan: Nama</option>
                            </select>
                        </div>

                        {/* Table */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase">No</th>
                                            <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase">Periode</th>
                                            <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase">Tahun Ajaran</th>
                                            <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase">Jenis</th>
                                            <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase">Status</th>
                                            <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase">Tanggal Mulai</th>
                                            <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase">Tanggal Selesai</th>
                                            <th className="text-right px-4 py-3 text-[11px] font-bold text-gray-500 uppercase">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {list.data?.length === 0 && (
                                            <tr><td colSpan={8} className="text-center py-14 text-gray-400 text-sm">Belum ada periode verifikasi yang cocok.</td></tr>
                                        )}
                                        {list.data?.map((item, idx) => (
                                            <tr key={item.id}
                                                className={`hover:bg-gray-50/50 cursor-pointer transition-colors ${selectedPeriode?.periode?.id === item.id ? 'bg-red-50/40' : ''}`}
                                                onClick={() => router.get(`/superadmin/periode/${item.id}`, {}, { preserveScroll: true })}
                                            >
                                                <td className="px-4 py-3.5 text-xs text-gray-500">{(list.current_page - 1) * list.per_page + idx + 1}</td>
                                                <td className="px-4 py-3.5 font-semibold text-gray-800 text-xs">{item.nama}</td>
                                                <td className="px-4 py-3.5 text-xs text-gray-600">{item.tahun_ajaran?.nama}</td>
                                                <td className="px-4 py-3.5 text-xs text-gray-600">{item.jenis_periode}</td>
                                                <td className="px-4 py-3.5"><StatusBadge status={item.status} /></td>
                                                <td className="px-4 py-3.5 text-xs text-gray-500">{formatDate(item.tanggal_mulai)}</td>
                                                <td className="px-4 py-3.5 text-xs text-gray-500">{formatDate(item.tanggal_selesai)}</td>
                                                <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                                                    <div className="flex items-center justify-end gap-1 relative">
                                                        <Link href={`/superadmin/periode/${item.id}`} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </Link>
                                                        <button onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                                                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
                                                            <MoreVertical className="w-3.5 h-3.5" />
                                                        </button>
                                                        {openMenuId === item.id && (
                                                            <>
                                                                <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                                                                <div className="absolute right-0 top-9 z-20 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 w-44">
                                                                    {item.status === 'DRAFT' && (
                                                                        <button onClick={() => activate(item)} className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50">
                                                                            <Play className="w-3.5 h-3.5" /> Aktifkan
                                                                        </button>
                                                                    )}
                                                                    {item.status === 'ACTIVE' && (
                                                                        <button onClick={() => close(item)} className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                                                                            <Lock className="w-3.5 h-3.5" /> Nonaktifkan
                                                                        </button>
                                                                    )}
                                                                    {item.status !== 'ACTIVE' && (
                                                                        <>
                                                                             <button onClick={() => openEdit(item)} className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
                                                                                 <Pencil className="w-3.5 h-3.5" /> Edit
                                                                             </button>
                                                                            <button onClick={() => { setDeleteItem(item); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-red-500 hover:bg-red-50">
                                                                                <Trash2 className="w-3.5 h-3.5" /> Hapus
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {list.data?.length > 0 && (
                                <div className="px-4 py-3.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
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
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="font-bold text-gray-800">Detail Periode</h2>
                            <button onClick={() => setShowAdd(true)}
                                className="flex items-center gap-1.5 px-3 py-2 bg-[#801720] text-white rounded-xl text-xs font-semibold hover:bg-[#6a1219]">
                                <Plus className="w-3.5 h-3.5" /> Tambah Periode
                            </button>
                        </div>

                        {!selectedPeriode ? (
                            <div className="p-8 text-center">
                                <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                <p className="text-sm text-gray-400">Pilih periode dari daftar untuk melihat detail lengkap.</p>
                            </div>
                        ) : (
                            <>
                                <div className="p-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <StatusBadge status={selectedPeriode.periode.status} />
                                        <Link href="/superadmin/periode" className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></Link>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-11 h-11 rounded-xl bg-[#801720]/10 flex items-center justify-center flex-shrink-0">
                                            <Calendar className="w-5 h-5 text-[#801720]" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-gray-800 leading-tight">{selectedPeriode.periode.nama}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                Tahun Ajaran {selectedPeriode.periode.tahun_ajaran?.nama} · Periode {selectedPeriode.periode.jenis_periode}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-xs pt-1">
                                        {[
                                            ['Tahun Ajaran', selectedPeriode.periode.tahun_ajaran?.nama],
                                            ['Tanggal Mulai', formatDate(selectedPeriode.periode.tanggal_mulai)],
                                            ['Tanggal Selesai', formatDate(selectedPeriode.periode.tanggal_selesai)],
                                            ['Dibuat Pada', formatDateTime(selectedPeriode.periode.created_at)],
                                            ['Dibuat Oleh', selectedPeriode.dibuat_oleh || '-'],
                                            ['Terakhir Diubah', formatDateTime(selectedPeriode.periode.updated_at)],
                                        ].map(([label, value]) => (
                                            <div key={label} className="flex items-center justify-between py-1 border-b border-gray-50">
                                                <span className="text-gray-400 font-semibold">{label}</span>
                                                <span className="text-gray-700 font-bold text-right">{value}</span>
                                            </div>
                                        ))}
                                        <div className="flex items-center justify-between py-1 border-b border-gray-50">
                                            <span className="text-gray-400 font-semibold">Deadline Upload</span>
                                            <span className="text-red-600 font-bold text-right">{formatDateTime(selectedPeriode.periode.deadline_upload)}</span>
                                        </div>
                                        {selectedPeriode.periode.catatan && (
                                            <div className="pt-1">
                                                <span className="text-gray-400 font-semibold block mb-1">Catatan</span>
                                                <p className="text-gray-600 leading-relaxed">{selectedPeriode.periode.catatan}</p>
                                            </div>
                                        )}
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
                                        {detailTab === 'timeline' && (
                                            <div className="space-y-5">
                                                {[
                                                    { label: 'Periode dimulai', date: selectedPeriode.periode.tanggal_mulai, desc: 'Periode verifikasi dimulai', done: selectedPeriode.timeline.mulai_lewat, icon: CheckCircle },
                                                    { label: 'Deadline upload', date: selectedPeriode.periode.deadline_upload, desc: 'Batas akhir upload soal oleh koordinator MK', done: selectedPeriode.timeline.deadline_lewat, icon: CalendarClock },
                                                    { label: 'Periode berakhir', date: selectedPeriode.periode.tanggal_selesai, desc: 'Periode verifikasi berakhir', done: selectedPeriode.timeline.selesai_lewat, icon: Flag },
                                                ].map((step, i, arr) => {
                                                    const Icon = step.icon;
                                                    return (
                                                        <div key={step.label} className="flex gap-3 relative">
                                                            {i < arr.length - 1 && <div className="absolute left-[15px] top-8 bottom-[-20px] w-px bg-gray-100" />}
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                                                <Icon className="w-4 h-4" />
                                                            </div>
                                                            <div className="min-w-0 pb-1">
                                                                <p className="text-xs font-bold text-gray-800">{step.label}</p>
                                                                <p className="text-[11px] text-gray-400">{formatDateTime(step.date)}</p>
                                                                <p className="text-[11px] text-gray-500 mt-0.5">{step.desc}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {detailTab === 'penugasan' && (
                                            <div className="grid grid-cols-1 gap-3">
                                                {[
                                                    ['Koordinator Ditugaskan', selectedPeriode.penugasan.koordinator, Users],
                                                    ['Verifikator Ditugaskan', selectedPeriode.penugasan.verifikator, FileCheck],
                                                    ['Mata Kuliah Terlibat', selectedPeriode.penugasan.mata_kuliah, BookOpen],
                                                ].map(([label, value, Icon]) => (
                                                    <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                                                        <Icon className="w-4 h-4 text-[#801720] flex-shrink-0" />
                                                        <span className="text-xs font-semibold text-gray-600 flex-1">{label}</span>
                                                        <span className="text-sm font-extrabold text-gray-800">{value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {detailTab === 'statistik' && (
                                            <div className="space-y-4">
                                                <div>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs font-semibold text-gray-500">Progress Verifikasi</span>
                                                        <span className="text-xs font-extrabold text-[#801720]">{selectedPeriode.statistik.progress}%</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${selectedPeriode.statistik.progress}%` }} />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 text-center">
                                                    {[
                                                        ['Total', selectedPeriode.statistik.total, 'text-gray-700'],
                                                        ['Draft', selectedPeriode.statistik.draft, 'text-gray-500'],
                                                        ['Pending', selectedPeriode.statistik.pending, 'text-blue-600'],
                                                        ['Revisi', selectedPeriode.statistik.revisi, 'text-amber-600'],
                                                        ['Approved', selectedPeriode.statistik.approved, 'text-emerald-600'],
                                                        ['Rejected', selectedPeriode.statistik.rejected, 'text-red-500'],
                                                    ].map(([label, value, color]) => (
                                                        <div key={label} className="bg-gray-50 rounded-lg p-2.5">
                                                            <p className={`text-lg font-extrabold ${color}`}>{value}</p>
                                                            <p className="text-[10px] text-gray-400 font-semibold">{label}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {detailTab === 'riwayat' && (
                                            selectedPeriode.riwayat.length === 0 ? (
                                                <p className="text-xs text-gray-400 text-center py-6">Belum ada riwayat perubahan.</p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {selectedPeriode.riwayat.map(log => (
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
                                    <button onClick={() => openEdit(selectedPeriode.periode)}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50">
                                        <Pencil className="w-3.5 h-3.5" /> Edit Periode
                                    </button>
                                    {selectedPeriode.periode.status === 'DRAFT' && (
                                        <button onClick={() => activate(selectedPeriode.periode)}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700">
                                            <Play className="w-3.5 h-3.5" /> Aktifkan Periode
                                        </button>
                                    )}
                                    {selectedPeriode.periode.status === 'ACTIVE' && (
                                        <button onClick={() => close(selectedPeriode.periode)}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50">
                                            <Lock className="w-3.5 h-3.5" /> Nonaktifkan Periode
                                        </button>
                                    )}
                                    {['CLOSED', 'INACTIVE'].includes(selectedPeriode.periode.status) && (
                                        <button onClick={() => setDeleteItem(selectedPeriode.periode)}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50">
                                            <Trash2 className="w-3.5 h-3.5" /> Hapus Periode
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Tambah Periode Verifikasi">
                <PeriodeForm
                    form={form}
                    setForm={setForm}
                    onSubmit={handleAdd}
                    processing={processing}
                    editItem={null}
                />
            </Modal>
            <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Periode Verifikasi">
                <PeriodeForm
                    form={form}
                    setForm={setForm}
                    onSubmit={handleEdit}
                    processing={processing}
                    editItem={editItem}
                />
            </Modal>
            <Modal open={!!deleteItem} onClose={() => setDeleteItem(null)} title="Hapus Periode">
                <div className="flex items-start gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
                    <div>
                        <p className="text-sm font-semibold text-gray-800">Hapus "<span className="text-[#801720]">{deleteItem?.nama}</span>"?</p>
                        <p className="text-xs text-gray-500 mt-1">Data periode ini tidak dapat dikembalikan.</p>
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={() => setDeleteItem(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50">Batal</button>
                    <button onClick={handleDelete} disabled={processing} className="px-4 py-2 text-sm bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-60">
                        {processing ? 'Menghapus...' : 'Ya, Hapus'}
                    </button>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
