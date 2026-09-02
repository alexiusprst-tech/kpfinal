import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Plus, Pencil, Trash2, X, CheckCircle2, Play, Lock,
    Calendar, Search, Eye, ChevronLeft, ChevronRight,
    Users, FileCheck, BookOpen, ListChecks, History, CalendarClock, Flag,
    CheckCircle, Clock,
} from 'lucide-react';

import FlashAlert from '@/Components/FlashAlert';
import { showConfirm } from '@/Utils/sweetalert';
import { formatDate as fmt, formatDateTime as fmtDT } from '@/Utils/date';


// ─── Stat Card Widget (Kotak-kotak) ─────────────────────────────────────────
function StatCard({ label, value, icon: Icon, badgeBg = 'bg-slate-800' }) {
    return (
        <div className="bg-white border border-gray-100 shadow-xs rounded-2xl p-4 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl ${badgeBg} flex items-center justify-center text-white shadow-xs`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
            <div className="min-w-0">
                <p className="text-2xl font-extrabold text-gray-800 leading-tight tracking-tight">{value}</p>
                <p className="text-xs text-gray-500 font-medium leading-snug truncate mt-0.5">{label}</p>
            </div>
        </div>
    );
}

// ─── Generic Modal ────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h2 className="text-sm font-bold text-gray-800">{title}</h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 cursor-pointer">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="p-5">{children}</div>
            </div>
        </div>
    );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    DRAFT:    { label: 'Akan Datang', bg: 'bg-orange-50',  text: 'text-orange-600',  dot: 'bg-orange-400' },
    ACTIVE:   { label: 'Aktif',       bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    CLOSED:   { label: 'Selesai',     bg: 'bg-blue-50',    text: 'text-blue-600',    dot: 'bg-blue-400' },
    INACTIVE: { label: 'Nonaktif',    bg: 'bg-gray-100',   text: 'text-gray-500',    dot: 'bg-gray-400' },
};

function StatusBadge({ status }) {
    const c = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${c.bg} ${c.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            {c.label}
        </span>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const relTime = (dateStr) => {
    if (!dateStr) return '-';
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (mins < 1)  return 'Baru saja';
    if (mins < 60) return `${mins} menit lalu`;
    const h = Math.floor(mins / 60);
    if (h < 24)    return `${h} jam lalu`;
    return `${Math.floor(h / 24)} hari lalu`;
};

const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#801720]/15 focus:border-[#801720]/50 outline-none bg-white';

function Field({ label, required, children }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
        </div>
    );
}

// ─── Single Periode Form ──────────────────────────────────────────────────────
function PeriodeForm({ form, setForm, onSubmit, processing, isEdit }) {
    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Nama Periode Verifikasi" required>
                <input
                    type="text"
                    value={form.nama}
                    onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
                    className={inputCls}
                    placeholder="Contoh: UTS Ganjil 2026/2027"
                    required
                />
            </Field>

            <div className="grid grid-cols-2 gap-3">
                <Field label="Tanggal Mulai" required>
                    <input type="date" value={form.tanggal_mulai}
                        onChange={e => setForm(f => ({ ...f, tanggal_mulai: e.target.value }))}
                        className={inputCls} required />
                </Field>
                <Field label="Tanggal Selesai" required>
                    <input type="date" value={form.tanggal_selesai}
                        onChange={e => setForm(f => ({ ...f, tanggal_selesai: e.target.value }))}
                        className={inputCls} required />
                </Field>
            </div>

            <Field label="Deadline Upload Soal" required>
                <input type="date" value={form.deadline_upload}
                    onChange={e => setForm(f => ({ ...f, deadline_upload: e.target.value }))}
                    className={inputCls} required />
            </Field>

            <Field label="Catatan">
                <textarea
                    value={form.catatan}
                    onChange={e => setForm(f => ({ ...f, catatan: e.target.value }))}
                    rows={2}
                    className={`${inputCls} resize-none`}
                    placeholder="Opsional"
                />
            </Field>

            <div className="flex justify-end pt-1">
                <button type="submit" disabled={processing}
                    className="px-5 py-2.5 bg-[#801720] text-white rounded-xl text-sm font-semibold hover:bg-[#6a1219] disabled:opacity-60 cursor-pointer">
                    {processing ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Periode'}
                </button>
            </div>
        </form>
    );
}

// ─── Detail Modal Tabs ────────────────────────────────────────────────────────
const DETAIL_TABS = [
    { key: 'timeline',  label: 'Timeline',          icon: ListChecks },
    { key: 'penugasan', label: 'Penugasan',         icon: Users },
    { key: 'statistik', label: 'Statistik Soal',    icon: FileCheck },
    { key: 'riwayat',   label: 'Riwayat Perubahan', icon: History },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PeriodeIndex({ list, stats, filters, selectedPeriode }) {
    const { flash } = usePage().props;

    // UI state
    const [showAdd,    setShowAdd]    = useState(false);
    const [viewItem,   setViewItem]   = useState(null);
    const [editItem,   setEditItem]   = useState(null);
    const [processing, setProcessing] = useState(false);
    const [detailTab,  setDetailTab]  = useState('timeline');
    const [search,     setSearch]     = useState(filters?.search || '');

    const closeDetail = () => {
        setViewItem(null);
        if (typeof window !== 'undefined' && window.location.pathname !== '/superadmin/periode') {
            window.history.replaceState(null, '', '/superadmin/periode');
        }
    };

    useEffect(() => {
        const t = setTimeout(() => {
            if (search !== (filters?.search || '')) applyFilters({ search });
        }, 300);
        return () => clearTimeout(t);
    }, [search]);

    // Periode form
    const today = new Date().toISOString().substring(0, 10);
    const emptyForm = () => ({
        nama: '', tanggal_mulai: today, tanggal_selesai: today, deadline_upload: today, catatan: '',
    });
    const [form, setForm] = useState(emptyForm);

    // ── Periode handlers ──────────────────────────────────────────────────────
    const applyFilters = (next) =>
        router.get('/superadmin/periode', { ...filters, ...next }, { preserveState: true, preserveScroll: true, replace: true });

    const openAddModal = () => { setForm(emptyForm()); setShowAdd(true); };

    const handleAdd = (e) => {
        e.preventDefault(); setProcessing(true);
        router.post('/superadmin/periode', form, {
            onFinish: () => { setProcessing(false); setShowAdd(false); },
        });
    };

    const openEdit = (item) => {
        setForm({
            nama: item.nama,
            tanggal_mulai:   item.tanggal_mulai?.substring(0, 10)   || today,
            tanggal_selesai: item.tanggal_selesai?.substring(0, 10) || today,
            deadline_upload: item.deadline_upload?.substring(0, 10) || today,
            catatan: item.catatan || '',
        });
        setEditItem(item);
    };

    const handleEdit = (e) => {
        e.preventDefault(); setProcessing(true);
        router.put(`/superadmin/periode/${editItem.id}`, form, {
            onFinish: () => {
                setProcessing(false);
                setEditItem(null);
                if (viewItem?.periode?.id === editItem.id)
                    setViewItem(prev => ({ ...prev, periode: { ...prev.periode, ...form } }));
            },
        });
    };

    const handleDelete = async (item) => {
        if (!item) return;
        const r = await showConfirm({
            title: 'Hapus Periode?',
            text: `Apakah Anda yakin ingin menghapus "${item.nama}"? Tindakan ini permanen.`,
            icon: 'warning', confirmButtonText: 'Ya, Hapus', confirmButtonColor: '#CD202E',
        });
        if (r.isConfirmed) {
            router.delete(`/superadmin/periode/${item.id}`, {
                onFinish: () => { if (viewItem?.periode?.id === item.id) setViewItem(null); },
            });
        }
    };

    const activate = async (item) => {
        const r = await showConfirm({
            title: 'Aktifkan Periode?',
            text: `Aktifkan "${item.nama}"? Periode aktif lain akan dinonaktifkan secara otomatis.`,
            icon: 'question', confirmButtonText: 'Ya, Aktifkan', confirmButtonColor: '#059669',
        });
        if (r.isConfirmed) {
            router.post(`/superadmin/periode/${item.id}/activate`, {}, {
                preserveScroll: true,
                onSuccess: () => {
                    if (viewItem?.periode?.id === item.id)
                        setViewItem(prev => ({ ...prev, periode: { ...prev.periode, status: 'ACTIVE' } }));
                },
            });
        }
    };

    const closePeriode = async (item) => {
        const r = await showConfirm({
            title: 'Nonaktifkan Periode?',
            text: `Nonaktifkan "${item.nama}"? Verifikasi soal tidak dapat diubah lagi.`,
            icon: 'warning', confirmButtonText: 'Ya, Nonaktifkan', confirmButtonColor: '#801720',
        });
        if (r.isConfirmed) {
            router.post(`/superadmin/periode/${item.id}/close`, {}, {
                preserveScroll: true,
                onSuccess: () => {
                    if (viewItem?.periode?.id === item.id)
                        setViewItem(prev => ({ ...prev, periode: { ...prev.periode, status: 'CLOSED' } }));
                },
            });
        }
    };

    const openDetail = (item) => {
        setViewItem({
            periode: item,
            dibuat_oleh: '-',
            timeline:  {
                mulai_lewat:    new Date() >= new Date(item.tanggal_mulai),
                deadline_lewat: item.deadline_upload ? new Date() >= new Date(item.deadline_upload) : false,
                selesai_lewat:  new Date() >= new Date(item.tanggal_selesai),
            },
            penugasan: { koordinator: item.koordinator_count ?? 0, verifikator: item.verifikator_count ?? 0, mata_kuliah: 0 },
            statistik: { total: item.soal_count ?? 0, draft: 0, pending: 0, revisi: 0, approved: 0, rejected: 0, progress: 0 },
            riwayat: [],
        });
        router.get(`/superadmin/periode/${item.id}`, {}, {
            preserveState: true, preserveScroll: true, only: ['selectedPeriode'],
            onSuccess: (page) => {
                if (page.props.selectedPeriode) setViewItem(page.props.selectedPeriode);
                if (typeof window !== 'undefined' && window.location.pathname !== '/superadmin/periode') {
                    window.history.replaceState(null, '', '/superadmin/periode');
                }
            },
        });
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <AuthenticatedLayout title="Periode Verifikasi">
            <Head title="Periode Verifikasi" />
            <FlashAlert flash={flash} />

            <div className="space-y-4">

                {/* ─── Header ─────────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Periode Verifikasi</h1>
                        <p className="text-xs text-gray-400 mt-0.5">Kelola periode verifikasi soal pada setiap semester dan tahun ajaran.</p>
                    </div>
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#801720] text-white rounded-xl text-xs font-semibold hover:bg-[#6a1219] transition-colors cursor-pointer flex-shrink-0 self-start sm:self-auto"
                    >
                        <Plus className="w-3.5 h-3.5" /> Tambah Periode
                    </button>
                </div>

                {/* ─── 4 Stat Cards (Kotak-kotak) ─────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard label="Total Periode" value={stats.total} icon={Calendar} badgeBg="bg-slate-800" />
                    <StatCard label="Periode Aktif" value={stats.aktif} icon={CheckCircle2} badgeBg="bg-emerald-600" />
                    <StatCard label="Akan Datang" value={stats.akan_datang} icon={Clock} badgeBg="bg-amber-500" />
                    <StatCard label="Selesai" value={stats.selesai} icon={Lock} badgeBg="bg-blue-600" />
                </div>

                {/* ─── Filters ────────────────────────────────────────────── */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 min-w-[180px]">
                        <Search className="w-3.5 h-3.5 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Cari periode verifikasi..."
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#801720]/10 focus:border-[#801720]/30 text-gray-700 placeholder-gray-300"
                        />
                    </div>
                    <select
                        value={filters?.status || ''}
                        onChange={e => applyFilters({ status: e.target.value })}
                        className="text-sm border border-gray-200 bg-white rounded-xl px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#801720]/10"
                    >
                        <option value="">Semua Status</option>
                        <option value="DRAFT">Akan Datang</option>
                        <option value="ACTIVE">Aktif</option>
                        <option value="CLOSED">Selesai</option>
                        <option value="INACTIVE">Nonaktif</option>
                    </select>
                </div>

                {/* ─── Table ──────────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Nama Periode</th>
                                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Deadline Upload</th>
                                    <th className="text-right px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {list.data?.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="text-center py-14 text-gray-300 text-sm">
                                            Tidak ada periode verifikasi yang cocok.
                                        </td>
                                    </tr>
                                )}
                                {list.data?.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <p className="text-sm font-semibold text-gray-800">{item.nama}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {fmt(item.tanggal_mulai)} – {fmt(item.tanggal_selesai)}
                                            </p>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <StatusBadge status={item.status} />
                                        </td>
                                        <td className="px-5 py-3.5 text-sm font-semibold text-red-600">
                                            {fmt(item.deadline_upload)}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button type="button" onClick={() => openDetail(item)}
                                                    className="p-2 rounded-xl text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer" title="Detail">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button type="button" onClick={() => openEdit(item)}
                                                    className="p-2 rounded-xl text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors cursor-pointer" title="Edit">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                {item.status !== 'ACTIVE' && (
                                                    <button type="button" onClick={() => activate(item)}
                                                        className="p-2 rounded-xl text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer" title="Aktifkan">
                                                        <Play className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {item.status === 'ACTIVE' && (
                                                    <button type="button" onClick={() => closePeriode(item)}
                                                        className="p-2 rounded-xl text-orange-600 bg-orange-50 hover:bg-orange-100 transition-colors cursor-pointer" title="Nonaktifkan">
                                                        <Lock className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {item.status !== 'ACTIVE' && (
                                                    <button type="button" onClick={() => handleDelete(item)}
                                                        className="p-2 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer" title="Hapus">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {list.data?.length > 0 && (
                        <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between">
                            <span className="text-xs text-gray-400">Menampilkan {list.from}–{list.to} dari {list.total}</span>
                            <div className="flex gap-1">
                                {list.links?.map((link, i) => (
                                    <button key={i} disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                                        className={`min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors ${
                                            link.active ? 'bg-[#801720] text-white' : 'text-gray-400 hover:bg-gray-100 disabled:opacity-30'
                                        }`}>
                                        {link.label.includes('Previous') ? <ChevronLeft className="w-3.5 h-3.5" /> : link.label.includes('Next') ? <ChevronRight className="w-3.5 h-3.5" /> : link.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Add Periode Modal ───────────────────────────────────────── */}
            <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Tambah Periode Verifikasi">
                <PeriodeForm
                    form={form} setForm={setForm}
                    onSubmit={handleAdd} processing={processing}
                    isEdit={false}
                />
            </Modal>

            {/* ─── Edit Periode Modal ──────────────────────────────────────── */}
            <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Periode Verifikasi">
                <PeriodeForm
                    form={form} setForm={setForm}
                    onSubmit={handleEdit} processing={processing}
                    isEdit={true}
                />
            </Modal>

            {/* ─── Detail Modal ────────────────────────────────────────────── */}
            <Modal open={!!viewItem} onClose={closeDetail} title={`Detail: ${viewItem?.periode?.nama || ''}`} maxWidth="max-w-3xl">
                {viewItem?.periode && (
                    <div className="space-y-5">
                        {/* Summary row */}
                        <div className="flex items-start justify-between flex-wrap gap-3 pb-4 border-b border-gray-100">
                            <div>
                                <p className="text-base font-bold text-gray-800">{viewItem.periode.nama}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {fmt(viewItem.periode.tanggal_mulai)} – {fmt(viewItem.periode.tanggal_selesai)}
                                </p>
                                <p className="text-xs text-red-500 font-semibold mt-0.5">
                                    Deadline: {fmt(viewItem.periode.deadline_upload)}
                                </p>
                                {viewItem.periode.catatan && (
                                    <p className="text-xs text-gray-500 mt-1 italic">"{viewItem.periode.catatan}"</p>
                                )}
                            </div>
                            <StatusBadge status={viewItem.periode.status} />
                        </div>

                        {/* Tabs */}
                        <div className="border border-gray-100 rounded-2xl overflow-hidden">
                            <div className="flex overflow-x-auto border-b border-gray-100 bg-gray-50/60">
                                {DETAIL_TABS.map(t => {
                                    const Icon = t.icon;
                                    const active = detailTab === t.key;
                                    return (
                                        <button key={t.key} onClick={() => setDetailTab(t.key)}
                                            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                                                active ? 'border-[#801720] text-[#801720] bg-white' : 'border-transparent text-gray-400 hover:text-gray-600'
                                            }`}>
                                            <Icon className="w-3.5 h-3.5" /> {t.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="p-4 sm:p-5 bg-white h-[360px] overflow-y-auto">

                                {/* Timeline */}
                                {detailTab === 'timeline' && viewItem.timeline && (
                                    <div className="space-y-4">
                                        {[
                                            { label: 'Periode dimulai',      date: viewItem.periode.tanggal_mulai,   desc: 'Periode verifikasi dimulai dan penugasan aktif',              done: viewItem.timeline.mulai_lewat,    icon: CheckCircle },
                                            { label: 'Deadline upload soal', date: viewItem.periode.deadline_upload, desc: 'Batas akhir pengunggahan draft soal oleh Koordinator MK',     done: viewItem.timeline.deadline_lewat, icon: CalendarClock },
                                            { label: 'Periode berakhir',     date: viewItem.periode.tanggal_selesai, desc: 'Periode verifikasi resmi berakhir',                           done: viewItem.timeline.selesai_lewat,  icon: Flag },
                                        ].map((step, i, arr) => {
                                            const Icon = step.icon;
                                            return (
                                                <div key={step.label} className="flex gap-3 relative">
                                                    {i < arr.length - 1 && <div className="absolute left-[15px] top-8 bottom-[-16px] w-px bg-gray-100" />}
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${step.done ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <div className="min-w-0 pb-1">
                                                        <p className="text-xs font-bold text-gray-700">{step.label}</p>
                                                        <p className="text-[11px] text-gray-400">{fmtDT(step.date)}</p>
                                                        <p className="text-[11px] text-gray-500 mt-0.5">{step.desc}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Penugasan */}
                                {detailTab === 'penugasan' && viewItem.penugasan && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                ['Koordinator', viewItem.penugasan.koordinator ?? 0, Users],
                                                ['Verifikator', viewItem.penugasan.verifikator ?? 0, FileCheck],
                                                ['Mata Kuliah',  viewItem.penugasan.mata_kuliah  ?? 0, BookOpen],
                                            ].map(([label, value, Icon]) => (
                                                <div key={label} className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                                    <Icon className="w-4 h-4 text-[#801720] flex-shrink-0" />
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 font-semibold">{label}</p>
                                                        <p className="text-base font-extrabold text-gray-800">{value}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-3">
                                            {[
                                                { title: 'Koordinator MK', list: viewItem.penugasan.koordinator_list, colorText: 'text-[#801720]', colorBg: 'bg-red-50',     Icon: Users },
                                                { title: 'Verifikator MK', list: viewItem.penugasan.verifikator_list, colorText: 'text-emerald-700', colorBg: 'bg-emerald-50', Icon: FileCheck },
                                            ].map(({ title, list: dList, colorText, colorBg, Icon }) => (
                                                <div key={title} className="border border-gray-100 rounded-xl p-3 space-y-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <Icon className={`w-3.5 h-3.5 ${colorText}`} />
                                                        <p className="text-xs font-bold text-gray-700">{title}</p>
                                                        <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${colorBg} ${colorText}`}>
                                                            {dList?.length || 0}
                                                        </span>
                                                    </div>
                                                    {(!dList || dList.length === 0) ? (
                                                        <p className="text-xs text-gray-300 italic text-center py-2">Belum ada penugasan.</p>
                                                    ) : (
                                                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                                            {dList.map((d, i) => (
                                                                <div key={d.dosen_id || i} className="text-xs">
                                                                    <span className="font-semibold text-gray-700">{d.dosen_nama}</span>
                                                                    <span className="text-gray-400 ml-1">({d.dosen_kode})</span>
                                                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                                                        {d.mata_kuliah?.map((mk, j) => (
                                                                            <span key={j} className="inline-block text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                                                                {mk.kode}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Statistik */}
                                {detailTab === 'statistik' && viewItem.statistik && (
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-xs font-semibold text-gray-600">Progress Verifikasi</span>
                                                <span className="text-xs font-bold text-[#801720]">{viewItem.statistik.progress ?? 0}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${viewItem.statistik.progress ?? 0}%` }} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                                            {[
                                                ['Total',    viewItem.statistik.total    ?? 0, 'text-gray-700'],
                                                ['Draft',    viewItem.statistik.draft    ?? 0, 'text-gray-500'],
                                                ['Pending',  viewItem.statistik.pending  ?? 0, 'text-blue-600'],
                                                ['Revisi',   viewItem.statistik.revisi   ?? 0, 'text-amber-600'],
                                                ['Approved', viewItem.statistik.approved ?? 0, 'text-emerald-600'],
                                                ['Rejected', viewItem.statistik.rejected ?? 0, 'text-red-500'],
                                            ].map(([label, value, color]) => (
                                                <div key={label} className="bg-gray-50 rounded-xl p-2 border border-gray-100">
                                                    <p className={`text-base font-extrabold ${color}`}>{value}</p>
                                                    <p className="text-[10px] text-gray-400">{label}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Riwayat */}
                                {detailTab === 'riwayat' && (
                                    !viewItem.riwayat?.length ? (
                                        <p className="text-xs text-gray-300 text-center py-6">Belum ada riwayat perubahan.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {viewItem.riwayat.map(log => (
                                                <div key={log.id} className="flex items-start gap-2.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#801720] mt-1.5 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-700">{log.description}</p>
                                                        <p className="text-[10px] text-gray-400">{log.user} · {relTime(log.created_at)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                                <button type="button"
                                    onClick={() => { const itm = viewItem.periode; closeDetail(); openEdit(itm); }}
                                    className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
                                    <Pencil className="w-3.5 h-3.5" /> Edit
                                </button>
                                {viewItem.periode.status !== 'ACTIVE' && (
                                    <button type="button" onClick={() => activate(viewItem.periode)}
                                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
                                        <Play className="w-3.5 h-3.5" /> Aktifkan
                                    </button>
                                )}
                                {viewItem.periode.status === 'ACTIVE' && (
                                    <button type="button" onClick={() => closePeriode(viewItem.periode)}
                                        className="px-3.5 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
                                        <Lock className="w-3.5 h-3.5" /> Nonaktifkan
                                    </button>
                                )}
                            </div>
                            <button type="button" onClick={closeDetail}
                                className="px-4 py-2 bg-[#801720] hover:bg-[#6a1219] text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors">
                                Tutup
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}
