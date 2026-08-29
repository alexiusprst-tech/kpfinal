import React, { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Plus, Pencil, Trash2, AlertTriangle, X, FolderKanban, Search, CheckCircle2,
    PauseCircle, FileText, Eye, ChevronLeft, ChevronRight, History, Calendar,
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

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

function KategoriSoalForm({ form, setForm, onSubmit, processing, editItem }) {
    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Kategori <span className="text-red-500">*</span></label>
                <input type="text" value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] outline-none"
                    placeholder="Contoh: Pilihan Ganda" required />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Deskripsi</label>
                <textarea rows={2} value={form.deskripsi} onChange={e => setForm(f => ({ ...f, deskripsi: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] outline-none resize-none"
                    placeholder="Keterangan singkat..." />
            </div>
            {editItem && (
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                    <select value={form.status || 'ACTIVE'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] outline-none">
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                    </select>
                </div>
            )}
            <div className="flex justify-end pt-2">
                <button type="submit" disabled={processing}
                    className="px-5 py-2.5 bg-[#801720] text-white rounded-xl text-sm font-semibold hover:bg-[#6a1219] disabled:opacity-60 cursor-pointer">
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

export default function KategoriSoalIndex({ list, stats, filters, selectedKategori }) {
    const { flash } = usePage().props;
    const [showAdd, setShowAdd] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [deleteItem, setDeleteItem] = useState(null);
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
    const [form, setForm] = useState({ nama: '', deskripsi: '', status: 'ACTIVE' });

    const applyFilters = (next) => {
        router.get('/superadmin/kategori-soal', { ...filters, ...next }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const handleAdd = (e) => {
        e.preventDefault(); setProcessing(true);
        router.post('/superadmin/kategori-soal', form, {
            onFinish: () => { setProcessing(false); setShowAdd(false); setForm({ nama: '', deskripsi: '', status: 'ACTIVE' }); }
        });
    };

    const handleEdit = (e) => {
        e.preventDefault(); setProcessing(true);
        router.put(`/superadmin/kategori-soal/${editItem.id}`, form, {
            onFinish: () => { setProcessing(false); setEditItem(null); }
        });
    };

    const handleDelete = async (item = deleteItem) => {
        if (!item) return;
        const result = await showConfirm({
            title: 'Hapus Kategori Soal?',
            text: `Apakah Anda yakin ingin menghapus kategori soal "${item?.nama}"?`,
            icon: 'warning',
            confirmButtonText: 'Ya, Hapus Data',
            confirmButtonColor: '#CD202E',
        });
        if (result.isConfirmed) {
            router.delete(`/superadmin/kategori-soal/${item.id}`, {
                onFinish: () => { setDeleteItem(null); },
            });
        }
    };

    const toggleStatus = async (kategori) => {
        const isActivating = kategori.status !== 'ACTIVE';
        const result = await showConfirm({
            title: isActivating ? 'Aktifkan Kategori Soal?' : 'Nonaktifkan Kategori Soal?',
            text: isActivating
                ? `Aktifkan kategori "${kategori.nama}"? Kategori ini akan dapat dipilih saat pembuatan soal.`
                : `Nonaktifkan kategori "${kategori.nama}"?`,
            icon: 'question',
            confirmButtonText: isActivating ? 'Ya, Aktifkan' : 'Ya, Nonaktifkan',
            confirmButtonColor: isActivating ? '#059669' : '#801720',
        });
        if (result.isConfirmed) {
            router.put(`/superadmin/kategori-soal/${kategori.id}`, {
                nama: kategori.nama, deskripsi: kategori.deskripsi, status: kategori.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
            }, { preserveScroll: true });
        }
    };


    const openEdit = (item) => {
        setForm({ nama: item.nama, deskripsi: item.deskripsi || '', status: item.status });
        setEditItem(item);
    };



    const usage = selectedKategori?.usage;
    const doughnutData = usage && {
        labels: ['Approved', 'Dalam Review', 'Revisi', 'Ditolak'],
        datasets: [{
            data: [usage.approved, usage.dalam_review, usage.revisi, usage.ditolak],
            backgroundColor: ['#9B1724', '#F97316', '#EAB308', '#94A3B8'],
            borderWidth: 0,
        }],
    };

    return (
        <AuthenticatedLayout title="Kategori Soal">
            <Head title="Kategori Soal" />
            <Toast flash={flash} />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
                        <FolderKanban className="w-6 h-6 text-[#801720]" /> Kategori Soal
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Kelola kategori soal yang digunakan untuk klasifikasi jenis soal.</p>
                </div>

                <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
                    {/* LEFT: List */}
                    <div className="space-y-5 min-w-0">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <StatCard icon={FolderKanban} iconBg="bg-red-50" iconColor="text-[#801720]" value={stats.total} label="Total Kategori" sublabel="Semua kategori" />
                            <StatCard icon={CheckCircle2} iconBg="bg-emerald-50" iconColor="text-emerald-600" value={stats.aktif} label="Aktif" sublabel="Kategori aktif" />
                            <StatCard icon={PauseCircle} iconBg="bg-orange-50" iconColor="text-orange-500" value={stats.nonaktif} label="Nonaktif" sublabel="Kategori nonaktif" />
                            <StatCard icon={FileText} iconBg="bg-blue-50" iconColor="text-blue-500" value={stats.digunakan} label="Digunakan" sublabel="Digunakan pada soal" />
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap gap-2 flex-1">
                                <form onSubmit={e => e.preventDefault()} className="relative flex-1 min-w-[180px]">
                                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Cari kategori soal..."
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
                                    <option value="nama">Urutkan: Nama</option>
                                    <option value="jumlah">Urutkan: Jumlah Soal</option>
                                </select>
                            </div>
                            <button onClick={() => { setForm({ nama: '', deskripsi: '', status: 'ACTIVE' }); setShowAdd(true); }}
                                className="flex items-center gap-1.5 px-4 py-2.5 bg-[#801720] text-white rounded-xl text-xs font-semibold hover:bg-[#6a1219] transition-all shadow-sm">
                                <Plus className="w-3.5 h-3.5" /> Tambah Kategori
                            </button>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">No</th>
                                            <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Nama Kategori</th>
                                            <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Deskripsi</th>
                                            <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Jumlah Soal</th>
                                            <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Dibuat Pada</th>
                                            <th className="text-right px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {list.data?.length === 0 ? (
                                            <tr><td colSpan={7} className="text-center py-14 text-gray-400">Belum ada kategori soal yang cocok.</td></tr>
                                        ) : list.data?.map((item, idx) => (
                                            <tr key={item.id}
                                                className={`hover:bg-gray-50/50 cursor-pointer transition-colors ${selectedKategori?.kategori?.id === item.id ? 'bg-red-50/40' : ''}`}
                                                onClick={() => router.get(`/superadmin/kategori-soal/${item.id}`, {}, { preserveScroll: true })}
                                            >
                                                <td className="px-5 py-4 text-gray-500 text-xs">{(list.current_page - 1) * list.per_page + idx + 1}</td>
                                                <td className="px-5 py-4 font-semibold text-gray-800">{item.nama}</td>
                                                <td className="px-5 py-4 text-gray-500 text-xs max-w-xs truncate">{item.deskripsi || '—'}</td>
                                                <td className="px-5 py-4">{statusBadge(item.status)}</td>
                                                <td className="px-5 py-4 text-gray-700 text-xs font-semibold">{item.soal_count}</td>
                                                <td className="px-5 py-4 text-gray-400 text-xs">{formatDate(item.created_at)}</td>
                                                <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Link href={`/superadmin/kategori-soal/${item.id}`} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><Eye className="w-3.5 h-3.5" /></Link>
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
                            <h2 className="font-bold text-gray-800">Detail Kategori</h2>
                        </div>

                        {!selectedKategori ? (
                            <div className="p-8 text-center">
                                <FolderKanban className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                <p className="text-sm text-gray-400">Pilih kategori dari daftar untuk melihat detail lengkap.</p>
                            </div>
                        ) : (
                            <>
                                <div className="p-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        {statusBadge(selectedKategori.kategori.status)}
                                        <Link href="/superadmin/kategori-soal" className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></Link>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-11 h-11 rounded-xl bg-[#801720]/10 flex items-center justify-center flex-shrink-0">
                                            <FolderKanban className="w-5 h-5 text-[#801720]" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Nama Kategori</p>
                                            <p className="font-bold text-gray-800 leading-tight">{selectedKategori.kategori.nama}</p>
                                        </div>
                                    </div>

                                    {selectedKategori.kategori.deskripsi && (
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Deskripsi</p>
                                            <p className="text-sm text-gray-600 leading-relaxed">{selectedKategori.kategori.deskripsi}</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-gray-50 rounded-xl p-3">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Jumlah Soal</p>
                                            <p className="text-lg font-extrabold text-gray-800">{selectedKategori.usage.total}</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-3">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Dibuat Pada</p>
                                            <p className="text-xs font-bold text-gray-700 mt-1">{formatDateTime(selectedKategori.kategori.created_at)}</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-3">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Dibuat Oleh</p>
                                            <p className="text-xs font-bold text-gray-700 mt-1">{selectedKategori.dibuat_oleh || '-'}</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-3">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Terakhir Diubah</p>
                                            <p className="text-xs font-bold text-gray-700 mt-1">{formatDateTime(selectedKategori.kategori.updated_at)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-5 pb-5">
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-3">Statistik Penggunaan</p>
                                    {selectedKategori.usage.total === 0 ? (
                                        <p className="text-xs text-gray-400 text-center py-6 bg-gray-50 rounded-xl">Belum ada soal pada kategori ini.</p>
                                    ) : (
                                        <div className="flex items-center gap-4">
                                            <div className="w-28 h-28 relative flex-shrink-0">
                                                <Doughnut data={doughnutData} options={{ plugins: { legend: { display: false } }, cutout: '70%' }} />
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <p className="text-xl font-extrabold text-gray-800">{selectedKategori.usage.total}</p>
                                                    <p className="text-[9px] text-gray-400 font-semibold">Total Soal</p>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5 text-xs flex-1">
                                                {[
                                                    ['Approved', selectedKategori.usage.approved, '#9B1724'],
                                                    ['Dalam Review', selectedKategori.usage.dalam_review, '#F97316'],
                                                    ['Revisi', selectedKategori.usage.revisi, '#EAB308'],
                                                    ['Ditolak', selectedKategori.usage.ditolak, '#94A3B8'],
                                                ].map(([label, value, color]) => (
                                                    <div key={label} className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                                                        <span className="text-gray-500 flex-1">{label}</span>
                                                        <span className="font-bold text-gray-700">{value} ({selectedKategori.usage.total > 0 ? Math.round((value / selectedKategori.usage.total) * 100) : 0}%)</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5"><History className="w-3.5 h-3.5" /> Riwayat Perubahan</p>
                                    </div>
                                    {selectedKategori.riwayat.length === 0 ? (
                                        <p className="text-xs text-gray-400 text-center py-4">Belum ada riwayat perubahan.</p>
                                    ) : (
                                        <div className="space-y-3 max-h-52 overflow-y-auto">
                                            {selectedKategori.riwayat.map(log => (
                                                <div key={log.id} className="flex items-start gap-2.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#801720] mt-1.5 flex-shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-xs text-gray-700 font-semibold">{log.description}</p>
                                                        <p className="text-[10px] text-gray-400">{log.user} · {relativeTime(log.created_at)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="p-5 border-t border-gray-100 flex gap-2">
                                    <button onClick={() => openEdit(selectedKategori.kategori)}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50">
                                        <Pencil className="w-3.5 h-3.5" /> Edit Kategori
                                    </button>
                                    <button onClick={() => toggleStatus(selectedKategori.kategori)}
                                        className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold ${
                                            selectedKategori.kategori.status === 'ACTIVE' ? 'border border-red-200 text-red-600 hover:bg-red-50' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                        }`}>
                                        <PauseCircle className="w-3.5 h-3.5" /> {selectedKategori.kategori.status === 'ACTIVE' ? 'Nonaktifkan Kategori' : 'Aktifkan Kategori'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Tambah Kategori Soal">
                <KategoriSoalForm
                    form={form}
                    setForm={setForm}
                    onSubmit={handleAdd}
                    processing={processing}
                    editItem={null}
                />
            </Modal>
            <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Kategori Soal">
                <KategoriSoalForm
                    form={form}
                    setForm={setForm}
                    onSubmit={handleEdit}
                    processing={processing}
                    editItem={editItem}
                />
            </Modal>
            <Modal open={!!deleteItem} onClose={() => setDeleteItem(null)} title="Hapus Kategori">
                <div className="flex items-start gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
                    <div>
                        <p className="text-sm font-semibold text-gray-800">Hapus <span className="text-[#801720]">"{deleteItem?.nama}"</span>?</p>
                        <p className="text-xs text-gray-500 mt-1">Tindakan ini tidak dapat dibatalkan.</p>
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
