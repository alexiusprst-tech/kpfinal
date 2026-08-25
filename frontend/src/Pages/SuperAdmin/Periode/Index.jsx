import React, { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Plus, Pencil, Trash2, AlertTriangle, X, Clock, CheckCircle2, Play, Lock,
    Calendar, Search, Eye, ChevronLeft, ChevronRight,
    Users, FileCheck, BookOpen, ListChecks, History, CalendarClock, Flag,
    CheckCircle, Square,
} from 'lucide-react';

import FlashAlert from '@/Components/FlashAlert';
import { showToast, showAlert, showConfirm } from '@/Utils/sweetalert';

function Toast({ flash }) {
    return <FlashAlert type="toast" flash={flash} />;
}

function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200`}>
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <h2 className="text-base font-bold text-gray-800">{title}</h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 cursor-pointer"><X className="w-4 h-4" /></button>
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
    { key: 'statistik',  label: 'Statistik Soal',     icon: FileCheck },
    { key: 'riwayat',    label: 'Riwayat Perubahan',  icon: History },
];

export default function PeriodeIndex({ list, stats, tahunAjaranAll, tahunAjaranActive, filters, selectedPeriode }) {
    const { flash } = usePage().props;
    const [showAdd, setShowAdd] = useState(false);
    const [viewItem, setViewItem] = useState(selectedPeriode || null);
    const [editItem, setEditItem] = useState(null);
    const [deleteItem, setDeleteItem] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [detailTab, setDetailTab] = useState('timeline');
    const [search, setSearch] = useState(filters?.search || '');

    useEffect(() => {
        if (selectedPeriode) {
            setViewItem(selectedPeriode);
        }
    }, [selectedPeriode]);

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
        router.put(`/superadmin/periode/${editItem.id}`, form, {
            onFinish: () => {
                setProcessing(false);
                setEditItem(null);
                if (viewItem && viewItem.periode?.id === editItem.id) {
                    setViewItem(prev => ({
                        ...prev,
                        periode: { ...prev.periode, ...form }
                    }));
                }
            }
        });
    };

    const handleDelete = async (item = deleteItem) => {
        if (!item) return;
        const result = await showConfirm({
            title: 'Hapus Periode Verifikasi?',
            text: `Apakah Anda yakin ingin menghapus periode "${item?.nama}"? Tindakan ini bersifat permanen.`,
            icon: 'warning',
            confirmButtonText: 'Ya, Hapus Periode',
            confirmButtonColor: '#CD202E',
        });
        if (result.isConfirmed) {
            router.delete(`/superadmin/periode/${item.id}`, {
                onFinish: () => {
                    setDeleteItem(null);
                    if (viewItem && viewItem.periode?.id === item.id) {
                        setViewItem(null);
                    }
                },
            });
        }
    };

    const activate = async (item) => {
        const result = await showConfirm({
            title: 'Aktifkan Periode Verifikasi?',
            text: `Aktifkan periode "${item.nama}"? Periode aktif lain pada tahun ajaran ini akan dinonaktifkan secara otomatis.`,
            icon: 'question',
            confirmButtonText: 'Ya, Aktifkan',
            confirmButtonColor: '#059669',
        });
        if (result.isConfirmed) {
            router.post(`/superadmin/periode/${item.id}/activate`, {}, {
                preserveScroll: true,
                onSuccess: () => {
                    if (viewItem && viewItem.periode?.id === item.id) {
                        setViewItem(prev => ({
                            ...prev,
                            periode: { ...prev.periode, status: 'ACTIVE' }
                        }));
                    }
                }
            });
        }
    };

    const close = async (item) => {
        const result = await showConfirm({
            title: 'Tutup / Nonaktifkan Periode?',
            text: `Nonaktifkan periode "${item.nama}"? Verifikasi soal untuk periode ini tidak akan dapat diubah lagi.`,
            icon: 'warning',
            confirmButtonText: 'Ya, Nonaktifkan',
            confirmButtonColor: '#801720',
        });
        if (result.isConfirmed) {
            router.post(`/superadmin/periode/${item.id}/close`, {}, {
                preserveScroll: true,
                onSuccess: () => {
                    if (viewItem && viewItem.periode?.id === item.id) {
                        setViewItem(prev => ({
                            ...prev,
                            periode: { ...prev.periode, status: 'CLOSED' }
                        }));
                    }
                }
            });
        }
    };

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
    };

    const openDetail = (item) => {
        if (selectedPeriode?.periode?.id === item.id) {
            setViewItem(selectedPeriode);
        } else {
            router.get(`/superadmin/periode/${item.id}`, {}, {
                preserveState: true,
                preserveScroll: true,
                only: ['selectedPeriode'],
                onSuccess: (page) => {
                    if (page.props.selectedPeriode) {
                        setViewItem(page.props.selectedPeriode);
                    }
                }
            });
            // Initial responsive fallback object while async loads
            setViewItem({
                periode: item,
                dibuat_oleh: '-',
                timeline: {
                    mulai_lewat: new Date() >= new Date(item.tanggal_mulai),
                    deadline_lewat: item.deadline_upload ? new Date() >= new Date(item.deadline_upload) : false,
                    selesai_lewat: new Date() >= new Date(item.tanggal_selesai),
                },
                penugasan: {
                    koordinator: item.koordinator_count ?? 0,
                    verifikator: item.verifikator_count ?? 0,
                    mata_kuliah: 0,
                },
                statistik: {
                    total: item.soal_count ?? 0,
                    draft: 0,
                    pending: 0,
                    revisi: 0,
                    approved: 0,
                    rejected: 0,
                    progress: 0,
                },
                riwayat: [],
            });
        }
    };

    return (
        <AuthenticatedLayout title="Periode Verifikasi">
            <Head title="Periode Verifikasi" />
            <Toast flash={flash} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
                            <Clock className="w-6 h-6 text-[#801720]" /> Periode Verifikasi
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">Kelola periode verifikasi soal pada setiap tahun ajaran akademik.</p>
                    </div>
                    <button
                        onClick={() => setShowAdd(true)}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-[#801720] text-white rounded-xl text-xs font-semibold hover:bg-[#6a1219] transition-all shadow-sm cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5" /> Tambah Periode
                    </button>
                </div>

                {/* 4 Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatCard icon={Calendar} iconBg="bg-red-50" iconColor="text-[#801720]" value={stats.total} label="Total Periode" sublabel="Semua periode" />
                    <StatCard icon={CheckCircle2} iconBg="bg-emerald-50" iconColor="text-emerald-600" value={stats.aktif} label="Periode Aktif" sublabel="Sedang berjalan" />
                    <StatCard icon={Clock} iconBg="bg-orange-50" iconColor="text-orange-500" value={stats.akan_datang} label="Akan Datang" sublabel="Belum dimulai" />
                    <StatCard icon={Square} iconBg="bg-blue-50" iconColor="text-blue-500" value={stats.selesai} label="Selesai" sublabel="Telah berakhir" />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                    <form onSubmit={e => e.preventDefault()} className="relative flex-1 min-w-[200px]">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Cari periode..."
                            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#801720]/20 bg-white"
                        />
                    </form>
                    <select
                        value={filters?.tahun_ajaran_id || ''}
                        onChange={e => applyFilters({ tahun_ajaran_id: e.target.value })}
                        className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#801720]/20"
                    >
                        <option value="">Semua Tahun Ajaran</option>
                        {tahunAjaranAll.map(ta => <option key={ta.id} value={ta.id}>{ta.nama}</option>)}
                    </select>
                    <select
                        value={filters?.status || ''}
                        onChange={e => applyFilters({ status: e.target.value })}
                        className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#801720]/20"
                    >
                        <option value="">Semua Status</option>
                        <option value="DRAFT">Akan Datang</option>
                        <option value="ACTIVE">Aktif</option>
                        <option value="CLOSED">Selesai</option>
                        <option value="INACTIVE">Nonaktif</option>
                    </select>
                    <select
                        value={filters?.sort || 'terbaru'}
                        onChange={e => applyFilters({ sort: e.target.value })}
                        className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#801720]/20"
                    >
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
                                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">No</th>
                                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Periode</th>
                                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Tahun Ajaran</th>
                                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Tanggal Mulai</th>
                                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Tanggal Selesai</th>
                                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Deadline Upload</th>
                                    <th className="text-right px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {list.data?.length === 0 && (
                                    <tr><td colSpan={8} className="text-center py-14 text-gray-400 text-sm">Belum ada periode verifikasi yang cocok.</td></tr>
                                )}
                                {list.data?.map((item, idx) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3.5 text-xs text-gray-500">{(list.current_page - 1) * list.per_page + idx + 1}</td>
                                        <td className="px-4 py-3.5 font-bold text-gray-800 text-xs">{item.nama}</td>
                                        <td className="px-4 py-3.5 text-xs font-medium text-gray-600">{item.tahun_ajaran?.nama || '-'}</td>
                                        <td className="px-4 py-3.5"><StatusBadge status={item.status} /></td>
                                        <td className="px-4 py-3.5 text-xs text-gray-500">{formatDate(item.tanggal_mulai)}</td>
                                        <td className="px-4 py-3.5 text-xs text-gray-500">{formatDate(item.tanggal_selesai)}</td>
                                        <td className="px-4 py-3.5 text-xs text-red-600 font-semibold">{formatDate(item.deadline_upload)}</td>
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => openDetail(item)}
                                                    className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors cursor-pointer"
                                                    title="Lihat Detail Periode"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openEdit(item)}
                                                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                                    title="Edit"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                {item.status === 'DRAFT' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => activate(item)}
                                                        className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors cursor-pointer"
                                                        title="Aktifkan Periode"
                                                    >
                                                        <Play className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                {item.status === 'ACTIVE' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => close(item)}
                                                        className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 transition-colors cursor-pointer"
                                                        title="Nonaktifkan Periode"
                                                    >
                                                        <Lock className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                {item.status !== 'ACTIVE' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(item)}
                                                        className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg cursor-pointer transition-colors"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
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

            {/* View Detail Modal */}
            <Modal open={!!viewItem} onClose={() => setViewItem(null)} title={`Detail Periode: ${viewItem?.periode?.nama || ''}`} maxWidth="max-w-3xl">
                {viewItem && viewItem.periode && (
                    <div className="space-y-5">
                        {/* Info Ringkasan Card */}
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-red-50 text-[#801720] flex items-center justify-center flex-shrink-0">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-base font-extrabold text-gray-800 leading-tight">{viewItem.periode.nama}</p>
                                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                                            Tahun Ajaran <span className="font-bold text-gray-700">{viewItem.periode.tahun_ajaran?.nama || '-'}</span>
                                        </p>
                                    </div>
                                </div>
                                <StatusBadge status={viewItem.periode.status} />
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                                <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                                    <span className="text-gray-400 text-[10px] uppercase font-bold block">Tanggal Mulai</span>
                                    <span className="text-gray-800 font-bold text-xs">{formatDate(viewItem.periode.tanggal_mulai)}</span>
                                </div>
                                <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                                    <span className="text-gray-400 text-[10px] uppercase font-bold block">Tanggal Selesai</span>
                                    <span className="text-gray-800 font-bold text-xs">{formatDate(viewItem.periode.tanggal_selesai)}</span>
                                </div>
                                <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                                    <span className="text-gray-400 text-[10px] uppercase font-bold block">Deadline Upload</span>
                                    <span className="text-red-600 font-extrabold text-xs">{formatDate(viewItem.periode.deadline_upload)}</span>
                                </div>
                                <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                                    <span className="text-gray-400 text-[10px] uppercase font-bold block">Dibuat Pada</span>
                                    <span className="text-gray-700 font-semibold text-xs">{formatDate(viewItem.periode.created_at)}</span>
                                </div>
                            </div>

                            {viewItem.periode.catatan && (
                                <div className="bg-white p-2.5 rounded-xl border border-gray-100 text-xs">
                                    <span className="text-gray-400 text-[10px] uppercase font-bold block mb-0.5">Catatan</span>
                                    <p className="text-gray-600 leading-relaxed">{viewItem.periode.catatan}</p>
                                </div>
                            )}
                        </div>

                        {/* Tabs */}
                        <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-xs">
                            <div className="flex overflow-x-auto border-b border-gray-100 bg-gray-50/70">
                                {DETAIL_TABS.map(t => {
                                    const Icon = t.icon;
                                    const active = detailTab === t.key;
                                    return (
                                        <button
                                            key={t.key}
                                            onClick={() => setDetailTab(t.key)}
                                            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                                                active ? 'border-[#801720] text-[#801720] bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'
                                            }`}
                                        >
                                            <Icon className="w-3.5 h-3.5" /> {t.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="p-4 sm:p-5 bg-white h-[390px] overflow-y-auto flex flex-col justify-start">
                                {detailTab === 'timeline' && viewItem.timeline && (
                                    <div className="space-y-4">
                                        {[
                                            { label: 'Periode dimulai', date: viewItem.periode.tanggal_mulai, desc: 'Periode verifikasi dimulai dan penugasan aktif', done: viewItem.timeline.mulai_lewat, icon: CheckCircle },
                                            { label: 'Deadline upload soal', date: viewItem.periode.deadline_upload, desc: 'Batas akhir pengunggahan draft soal oleh Koordinator MK', done: viewItem.timeline.deadline_lewat, icon: CalendarClock },
                                            { label: 'Periode berakhir', date: viewItem.periode.tanggal_selesai, desc: 'Periode verifikasi resmi berakhir', done: viewItem.timeline.selesai_lewat, icon: Flag },
                                        ].map((step, i, arr) => {
                                            const Icon = step.icon;
                                            return (
                                                <div key={step.label} className="flex gap-3 relative">
                                                    {i < arr.length - 1 && <div className="absolute left-[15px] top-8 bottom-[-16px] w-px bg-gray-200" />}
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${step.done ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
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

                                {detailTab === 'penugasan' && viewItem.penugasan && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {[
                                                ['Koordinator Ditugaskan', viewItem.penugasan.koordinator ?? 0, Users],
                                                ['Verifikator Ditugaskan', viewItem.penugasan.verifikator ?? 0, FileCheck],
                                                ['Mata Kuliah Terlibat', viewItem.penugasan.mata_kuliah ?? 0, BookOpen],
                                            ].map(([label, value, Icon]) => (
                                                <div key={label} className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                                                    <div className="w-9 h-9 rounded-lg bg-[#801720]/10 flex items-center justify-center flex-shrink-0 text-[#801720]">
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <span className="text-[11px] font-semibold text-gray-500 block">{label}</span>
                                                        <span className="text-base font-extrabold text-gray-800">{value}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Daftar Dosen Penugasan */}
                                        <div className="grid md:grid-cols-2 gap-4 pt-1">
                                            {/* Koordinator List */}
                                            <div className="border border-slate-200/80 rounded-2xl p-4 bg-white space-y-3 shadow-2xs">
                                                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                                    <div className="flex items-center gap-2">
                                                        <Users className="w-4 h-4 text-[#801720]" />
                                                        <h4 className="text-xs font-bold text-slate-800">Dosen Koordinator MK</h4>
                                                    </div>
                                                    <span className="px-2 py-0.5 rounded-full bg-red-50 text-[#801720] text-[10px] font-extrabold">
                                                        {viewItem.penugasan.koordinator_list?.length || 0} Dosen
                                                    </span>
                                                </div>

                                                {(!viewItem.penugasan.koordinator_list || viewItem.penugasan.koordinator_list.length === 0) ? (
                                                    <p className="text-xs text-slate-400 italic py-4 text-center">Belum ada dosen koordinator yang ditugaskan.</p>
                                                ) : (
                                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                                        {viewItem.penugasan.koordinator_list.map((d, i) => (
                                                            <div key={d.dosen_id || i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 hover:bg-slate-100/60 transition-colors">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <span className="text-xs font-bold text-slate-800 leading-snug">{d.dosen_nama}</span>
                                                                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200 flex-shrink-0">
                                                                        {d.dosen_kode}
                                                                    </span>
                                                                </div>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {d.mata_kuliah?.map((mk, mkIdx) => (
                                                                        <span key={mkIdx} className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200/80" title={mk.nama}>
                                                                            <span className="font-bold text-[#801720]">{mk.kode}</span>
                                                                            <span className="truncate max-w-[130px]">{mk.nama}</span>
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Verifikator List */}
                                            <div className="border border-slate-200/80 rounded-2xl p-4 bg-white space-y-3 shadow-2xs">
                                                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                                    <div className="flex items-center gap-2">
                                                        <FileCheck className="w-4 h-4 text-emerald-600" />
                                                        <h4 className="text-xs font-bold text-slate-800">Dosen Verifikator MK</h4>
                                                    </div>
                                                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold">
                                                        {viewItem.penugasan.verifikator_list?.length || 0} Dosen
                                                    </span>
                                                </div>

                                                {(!viewItem.penugasan.verifikator_list || viewItem.penugasan.verifikator_list.length === 0) ? (
                                                    <p className="text-xs text-slate-400 italic py-4 text-center">Belum ada dosen verifikator yang ditugaskan.</p>
                                                ) : (
                                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                                        {viewItem.penugasan.verifikator_list.map((d, i) => (
                                                            <div key={d.dosen_id || i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 hover:bg-slate-100/60 transition-colors">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <span className="text-xs font-bold text-slate-800 leading-snug">{d.dosen_nama}</span>
                                                                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200 flex-shrink-0">
                                                                        {d.dosen_kode}
                                                                    </span>
                                                                </div>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {d.mata_kuliah?.map((mk, mkIdx) => (
                                                                        <span key={mkIdx} className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200/80" title={mk.nama}>
                                                                            <span className="font-bold text-emerald-700">{mk.kode}</span>
                                                                            <span className="truncate max-w-[130px]">{mk.nama}</span>
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {detailTab === 'statistik' && viewItem.statistik && (
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-xs font-bold text-gray-600">Progress Verifikasi Soal</span>
                                                <span className="text-xs font-extrabold text-[#801720]">{viewItem.statistik.progress ?? 0}% Selesai</span>
                                            </div>
                                            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${viewItem.statistik.progress ?? 0}%` }} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                                            {[
                                                ['Total', viewItem.statistik.total ?? 0, 'text-gray-700'],
                                                ['Draft', viewItem.statistik.draft ?? 0, 'text-gray-500'],
                                                ['Pending', viewItem.statistik.pending ?? 0, 'text-blue-600'],
                                                ['Revisi', viewItem.statistik.revisi ?? 0, 'text-amber-600'],
                                                ['Approved', viewItem.statistik.approved ?? 0, 'text-emerald-600'],
                                                ['Rejected', viewItem.statistik.rejected ?? 0, 'text-red-500'],
                                            ].map(([label, value, color]) => (
                                                <div key={label} className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                                                    <p className={`text-base font-extrabold ${color}`}>{value}</p>
                                                    <p className="text-[10px] text-gray-400 font-semibold">{label}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {detailTab === 'riwayat' && (
                                    !viewItem.riwayat || viewItem.riwayat.length === 0 ? (
                                        <p className="text-xs text-gray-400 text-center py-6">Belum ada riwayat perubahan yang tercatat.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {viewItem.riwayat.map(log => (
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

                        {/* Footer Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const itm = viewItem.periode;
                                        setViewItem(null);
                                        openEdit(itm);
                                    }}
                                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Pencil className="w-3.5 h-3.5" /> Edit Periode
                                </button>
                                {viewItem.periode.status === 'DRAFT' && (
                                    <button
                                        type="button"
                                        onClick={() => activate(viewItem.periode)}
                                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <Play className="w-3.5 h-3.5" /> Aktifkan Periode
                                    </button>
                                )}
                                {viewItem.periode.status === 'ACTIVE' && (
                                    <button
                                        type="button"
                                        onClick={() => close(viewItem.periode)}
                                        className="px-3.5 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <Lock className="w-3.5 h-3.5" /> Nonaktifkan Periode
                                    </button>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => setViewItem(null)}
                                className="px-4 py-2 bg-[#801720] hover:bg-[#6a1219] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Add Modal */}
            <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Tambah Periode Verifikasi">
                <PeriodeForm
                    form={form}
                    setForm={setForm}
                    onSubmit={handleAdd}
                    processing={processing}
                    editItem={null}
                />
            </Modal>

            {/* Edit Modal */}
            <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Periode Verifikasi">
                <PeriodeForm
                    form={form}
                    setForm={setForm}
                    onSubmit={handleEdit}
                    processing={processing}
                    editItem={editItem}
                />
            </Modal>

            {/* Delete Modal */}
            <Modal open={!!deleteItem} onClose={() => setDeleteItem(null)} title="Hapus Periode">
                <div className="flex items-start gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
                    <div>
                        <p className="text-sm font-semibold text-gray-800">Hapus "<span className="text-[#801720]">{deleteItem?.nama}</span>"?</p>
                        <p className="text-xs text-gray-500 mt-1">Data periode ini tidak dapat dikembalikan.</p>
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={() => setDeleteItem(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 cursor-pointer">Batal</button>
                    <button onClick={handleDelete} disabled={processing} className="px-4 py-2 text-sm bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-60 cursor-pointer">
                        {processing ? 'Menghapus...' : 'Ya, Hapus'}
                    </button>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
