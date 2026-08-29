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

function Modal({ open, onClose, title, children, maxWidth = 'max-w-md' }) {
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
                    <select value={form.status || 'ACTIVE'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] outline-none bg-white">
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

export default function TahunAjaranIndex({ list, stats, filters, selectedTahunAjaran }) {
    const { flash } = usePage().props;
    const [showAdd, setShowAdd] = useState(false);
    const [viewItem, setViewItem] = useState(selectedTahunAjaran?.tahunAjaran || null);
    const [editItem, setEditItem] = useState(null);
    const [deleteItem, setDeleteItem] = useState(null);
    const [showAddPeriode, setShowAddPeriode] = useState(false);
    const [processing, setProcessing] = useState(false);
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
        router.put(`/superadmin/tahun-ajaran/${editItem.id}`, form, {
            onFinish: () => {
                setProcessing(false);
                setEditItem(null);
                if (viewItem && viewItem.id === editItem.id) {
                    setViewItem(prev => ({ ...prev, ...form }));
                }
            }
        });
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
                onFinish: () => {
                    setDeleteItem(null);
                    if (viewItem && viewItem.id === item.id) {
                        setViewItem(null);
                    }
                },
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
            const nextStatus = isActivating ? 'ACTIVE' : 'INACTIVE';
            router.put(`/superadmin/tahun-ajaran/${item.id}`, {
                nama: item.nama, tahun_mulai: item.tahun_mulai, tahun_selesai: item.tahun_selesai,
                status: nextStatus,
            }, {
                preserveScroll: true,
                onSuccess: () => {
                    if (viewItem && viewItem.id === item.id) {
                        setViewItem(prev => ({ ...prev, status: nextStatus }));
                    }
                }
            });
        }
    };

    const openEdit = (item) => {
        setForm({ nama: item.nama, tahun_mulai: item.tahun_mulai, tahun_selesai: item.tahun_selesai, status: item.status });
        setEditItem(item);
    };

    const handleAddPeriode = (e) => {
        e.preventDefault(); setProcessing(true);
        const targetTahunId = viewItem ? viewItem.id : (selectedTahunAjaran?.tahunAjaran?.id);
        router.post('/superadmin/periode', { ...periodeForm, tahun_ajaran_id: targetTahunId }, {
            onFinish: () => {
                setProcessing(false);
                setShowAddPeriode(false);
                setPeriodeForm({ nama: '', tanggal_mulai: today, tanggal_selesai: today, deadline_upload: today });
            },
        });
    };

    return (
        <AuthenticatedLayout title="Tahun Ajaran">
            <Head title="Tahun Ajaran" />
            <Toast flash={flash} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
                            <Calendar className="w-6 h-6 text-[#801720]" /> Tahun Ajaran
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">Kelola tahun ajaran akademik dan periode verifikasi soal.</p>
                    </div>
                    <button
                        onClick={() => { setForm({ nama: '', tahun_mulai: currentYear, tahun_selesai: currentYear + 1, status: 'ACTIVE' }); setShowAdd(true); }}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-[#801720] text-white rounded-xl text-xs font-semibold hover:bg-[#6a1219] transition-all shadow-sm cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5" /> Tambah Tahun Ajaran
                    </button>
                </div>

                {/* 4 Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatCard icon={Calendar} iconBg="bg-red-50" iconColor="text-[#801720]" value={stats.total} label="Total Tahun Ajaran" sublabel="Semua tahun ajaran" />
                    <StatCard icon={CheckCircle2} iconBg="bg-emerald-50" iconColor="text-emerald-600" value={stats.aktif} label="Aktif" sublabel="Tahun aktif saat ini" />
                    <StatCard icon={PauseCircle} iconBg="bg-orange-50" iconColor="text-orange-500" value={stats.nonaktif} label="Nonaktif" sublabel="Tahun tidak aktif" />
                    <StatCard icon={FileText} iconBg="bg-blue-50" iconColor="text-blue-500" value={stats.total_periode} label="Total Periode" sublabel="Periode terdaftar" />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                    <form onSubmit={e => e.preventDefault()} className="relative flex-1 min-w-[200px]">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Cari tahun ajaran..."
                            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#801720]/20 bg-white"
                        />
                    </form>
                    <select
                        value={filters?.status || ''}
                        onChange={e => applyFilters({ status: e.target.value })}
                        className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#801720]/20"
                    >
                        <option value="">Semua Status</option>
                        <option value="ACTIVE">Aktif</option>
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

                {/* Main Table */}
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
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4 text-gray-500 text-xs">{(list.current_page - 1) * list.per_page + idx + 1}</td>
                                        <td className="px-5 py-4">
                                            <p className="font-bold text-gray-800">{item.nama}</p>
                                            <p className="text-[11px] text-gray-400">{item.tahun_mulai} — {item.tahun_selesai}</p>
                                        </td>
                                        <td className="px-5 py-4">{statusBadge(item.status)}</td>
                                        <td className="px-5 py-4 text-gray-700 text-xs font-semibold">
                                            {item.periode_verifikasi_count ?? item.periode_verifikasi?.length ?? 0} Periode
                                        </td>
                                        <td className="px-5 py-4 text-gray-400 text-xs">{formatDate(item.created_at)}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setViewItem(item)}
                                                    className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors cursor-pointer"
                                                    title="Lihat Detail & Periode"
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
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(item)}
                                                    className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg cursor-pointer transition-colors"
                                                    title="Hapus"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
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

            {/* View Detail Modal */}
            <Modal open={!!viewItem} onClose={() => setViewItem(null)} title={`Detail Tahun Ajaran: ${viewItem?.nama || ''}`} maxWidth="max-w-2xl">
                {viewItem && (
                    <div className="space-y-5">
                        {/* Info Ringkasan Card */}
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-red-50 text-[#801720] flex items-center justify-center flex-shrink-0">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-base font-extrabold text-gray-800 leading-tight">{viewItem.nama}</p>
                                        <p className="text-xs text-gray-400 font-medium">{viewItem.tahun_mulai} — {viewItem.tahun_selesai}</p>
                                    </div>
                                </div>
                                {statusBadge(viewItem.status)}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                                <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                                    <span className="text-gray-400 text-[10px] uppercase font-bold block">Total Periode</span>
                                    <span className="text-gray-800 font-extrabold text-sm">{viewItem.periode_verifikasi?.length ?? viewItem.periode_verifikasi_count ?? 0}</span>
                                </div>
                                <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                                    <span className="text-gray-400 text-[10px] uppercase font-bold block">Periode Aktif</span>
                                    <span className="text-emerald-600 font-extrabold text-sm">
                                        {viewItem.periode_verifikasi?.filter(p => p.status === 'ACTIVE').length ?? 0}
                                    </span>
                                </div>
                                <div className="bg-white p-2.5 rounded-xl border border-gray-100 col-span-2 sm:col-span-1">
                                    <span className="text-gray-400 text-[10px] uppercase font-bold block">Dibuat Pada</span>
                                    <span className="text-gray-700 font-semibold text-xs">{formatDate(viewItem.created_at)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Section Periode Verifikasi */}
                        <div>
                            <div className="flex items-center justify-between mb-2.5">
                                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                                    <ListChecks className="w-4 h-4 text-[#801720]" />
                                    <span>Daftar Periode Verifikasi ({viewItem.periode_verifikasi?.length || 0})</span>
                                </h3>
                                {viewItem.status === 'ACTIVE' && (
                                    <button
                                        type="button"
                                        onClick={() => setShowAddPeriode(true)}
                                        className="flex items-center gap-1 px-2.5 py-1.5 bg-[#801720] hover:bg-[#6a1219] text-white rounded-lg text-[11px] font-bold transition-all shadow-xs cursor-pointer"
                                    >
                                        <Plus className="w-3 h-3" /> Tambah Periode
                                    </button>
                                )}
                            </div>

                            {!viewItem.periode_verifikasi || viewItem.periode_verifikasi.length === 0 ? (
                                <div className="p-6 text-center rounded-2xl border border-dashed border-gray-200 bg-slate-50/50 space-y-2">
                                    <Clock className="w-8 h-8 text-gray-300 mx-auto" />
                                    <p className="text-xs font-bold text-gray-700">Belum Ada Periode Verifikasi</p>
                                    <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
                                        Tahun ajaran ini belum memiliki periode verifikasi terdaftar.
                                    </p>
                                </div>
                            ) : (
                                <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-xs">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead className="bg-gray-50 border-b border-gray-100">
                                                <tr className="text-left text-[10px] text-gray-500 uppercase font-bold">
                                                    <th className="px-3 py-2">Periode</th>
                                                    <th className="px-3 py-2">Mulai</th>
                                                    <th className="px-3 py-2">Selesai</th>
                                                    <th className="px-3 py-2">Deadline Upload</th>
                                                    <th className="px-3 py-2 text-right">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50 bg-white">
                                                {viewItem.periode_verifikasi.map(p => (
                                                    <tr key={p.id} className="hover:bg-slate-50/60">
                                                        <td className="px-3 py-2.5 font-bold text-gray-800">{p.nama}</td>
                                                        <td className="px-3 py-2.5 text-gray-600">{formatDate(p.tanggal_mulai)}</td>
                                                        <td className="px-3 py-2.5 text-gray-600">{formatDate(p.tanggal_selesai)}</td>
                                                        <td className="px-3 py-2.5 text-gray-600">{formatDate(p.deadline_upload)}</td>
                                                        <td className="px-3 py-2.5 text-right">{periodeStatusBadge(p.status)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const itm = viewItem;
                                        setViewItem(null);
                                        openEdit(itm);
                                    }}
                                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Pencil className="w-3.5 h-3.5" /> Edit Tahun Ajaran
                                </button>
                                <button
                                    type="button"
                                    onClick={() => toggleStatus(viewItem)}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                        viewItem.status === 'ACTIVE'
                                            ? 'border border-red-200 text-red-600 hover:bg-red-50'
                                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                    }`}
                                >
                                    <PauseCircle className="w-3.5 h-3.5" />
                                    {viewItem.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'}
                                </button>
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
            <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Tambah Tahun Ajaran">
                <TahunAjaranForm
                    form={form}
                    setForm={setForm}
                    onSubmit={handleAdd}
                    processing={processing}
                    editItem={null}
                />
            </Modal>

            {/* Edit Modal */}
            <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Tahun Ajaran">
                <TahunAjaranForm
                    form={form}
                    setForm={setForm}
                    onSubmit={handleEdit}
                    processing={processing}
                    editItem={editItem}
                />
            </Modal>

            {/* Delete Modal */}
            <Modal open={!!deleteItem} onClose={() => setDeleteItem(null)} title="Hapus Tahun Ajaran">
                <div className="flex items-start gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
                    <p className="text-sm text-gray-700">Hapus tahun ajaran <strong>{deleteItem?.nama}</strong>? Data periode terkait juga akan terhapus.</p>
                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={() => setDeleteItem(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 cursor-pointer">Batal</button>
                    <button onClick={handleDelete} disabled={processing} className="px-4 py-2 text-sm bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-60 cursor-pointer">
                        {processing ? 'Menghapus...' : 'Ya, Hapus'}
                    </button>
                </div>
            </Modal>

            {/* Add Periode Modal */}
            {viewItem && (
                <Modal open={showAddPeriode} onClose={() => setShowAddPeriode(false)} title={`Tambah Periode — ${viewItem.nama}`}>
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
                            <button type="submit" disabled={processing} className="px-5 py-2.5 bg-[#801720] text-white rounded-xl text-sm font-semibold hover:bg-[#6a1219] disabled:opacity-60 cursor-pointer">
                                {processing ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </AuthenticatedLayout>
    );
}
