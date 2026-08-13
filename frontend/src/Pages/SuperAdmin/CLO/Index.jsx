import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Plus, Pencil, Trash2, Search, Download, Upload,
    AlertTriangle, X, ChevronLeft, ChevronRight, Activity
} from 'lucide-react';

// ─── Notification Toast ────────────────────────────────────────────────────────
function Toast({ flash }) {
    const [visible, setVisible] = useState(true);
    if (!visible || (!flash?.success && !flash?.error)) return null;
    const isSuccess = !!flash.success;
    return (
        <div className={`fixed top-5 right-5 z-50 flex items-start gap-3 p-4 rounded-xl shadow-xl text-white text-sm max-w-sm animate-in slide-in-from-right ${isSuccess ? 'bg-emerald-600' : 'bg-red-600'}`}>
            <span className="flex-1">{flash.success || flash.error}</span>
            <button onClick={() => setVisible(false)}><X className="w-4 h-4" /></button>
        </div>
    );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
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

// ─── CLO Form ─────────────────────────────────────────────────────────────────
function CloForm({ form, setForm, allPlo, onSubmit, processing }) {
    const togglePlo = (id) => {
        const current = form.plo_ids || [];
        setForm(f => ({ ...f, plo_ids: current.includes(id) ? current.filter(x => x !== id) : [...current, id] }));
    };

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Kode CLO <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    value={form.kode_clo || ''}
                    onChange={e => setForm(f => ({ ...f, kode_clo: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] outline-none"
                    placeholder="Contoh: CLO01"
                    required
                />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Deskripsi <span className="text-red-500">*</span></label>
                <textarea
                    rows={3}
                    value={form.deskripsi || ''}
                    onChange={e => setForm(f => ({ ...f, deskripsi: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] outline-none resize-none"
                    placeholder="Deskripsi CLO..."
                    required
                />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Mapping PLO</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-2">
                    {allPlo.map(plo => (
                        <label key={plo.id} className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-gray-50 rounded-lg">
                            <input
                                type="checkbox"
                                checked={(form.plo_ids || []).includes(plo.id)}
                                onChange={() => togglePlo(plo.id)}
                                className="accent-[#801720]"
                            />
                            <span className="text-xs font-medium text-gray-700">{plo.kode_plo}</span>
                        </label>
                    ))}
                    {allPlo.length === 0 && <p className="text-xs text-gray-500 col-span-2 text-center py-2">Belum ada data PLO</p>}
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <button type="submit" disabled={processing}
                    className="px-5 py-2.5 bg-[#801720] text-white rounded-xl text-sm font-semibold hover:bg-[#6a1219] disabled:opacity-60 transition-all">
                    {processing ? 'Menyimpan...' : 'Simpan'}
                </button>
            </div>
        </form>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CloIndex({ cloList, allPlo, filters }) {
    const { flash } = usePage().props;

    const [search, setSearch] = useState(filters?.search || '');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [deleteItem, setDeleteItem] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [form, setForm] = useState({ kode_clo: '', deskripsi: '', plo_ids: [] });

    const doSearch = (e) => {
        e.preventDefault();
        router.get('/superadmin/clo', { search }, { preserveState: true });
    };

    const handleAdd = (e) => {
        e.preventDefault();
        setProcessing(true);
        router.post('/superadmin/clo', form, {
            onFinish: () => { setProcessing(false); setShowAddModal(false); setForm({ kode_clo: '', deskripsi: '', plo_ids: [] }); }
        });
    };

    const handleEdit = (e) => {
        e.preventDefault();
        setProcessing(true);
        router.put(`/superadmin/clo/${editItem.id}`, form, {
            onFinish: () => { setProcessing(false); setEditItem(null); }
        });
    };

    const handleDelete = () => {
        setProcessing(true);
        router.delete(`/superadmin/clo/${deleteItem.id}`, {
            onFinish: () => { setProcessing(false); setDeleteItem(null); }
        });
    };

    const openEdit = (item) => {
        setForm({ kode_clo: item.kode_clo, deskripsi: item.deskripsi, plo_ids: item.plo?.map(p => p.id) || [] });
        setEditItem(item);
    };

    const statusBadge = (s) => {
        const map = { ACTIVE: 'bg-emerald-100 text-emerald-700', INACTIVE: 'bg-gray-100 text-gray-500' };
        return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${map[s] || 'bg-gray-100 text-gray-600'}`}>{s}</span>;
    };

    return (
        <AuthenticatedLayout title="Master CLO">
            <Head title="Master CLO" />
            <Toast flash={flash} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
                            <Activity className="w-6 h-6 text-[#801720]" /> Master CLO
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">Kelola Course Learning Outcomes (CLO) dan mapping ke PLO</p>
                    </div>
                    <div className="flex gap-2">
                        <a href="/superadmin/clo/template" className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                            <Download className="w-3.5 h-3.5" /> Template
                        </a>
                        <label className="flex items-center gap-1.5 px-3 py-2 border border-[#801720] text-[#801720] rounded-xl text-xs font-semibold cursor-pointer hover:bg-red-50 transition-all">
                            <Upload className="w-3.5 h-3.5" /> Import
                            <input type="file" className="hidden" accept=".xlsx,.csv,.xls" onChange={e => {
                                if (!e.target.files[0]) return;
                                const fd = new FormData();
                                fd.append('file', e.target.files[0]);
                                router.post('/superadmin/clo/import', fd);
                            }} />
                        </label>
                        <a href="/superadmin/clo/export" className="flex items-center gap-1.5 px-3 py-2 bg-gray-700 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-all">
                            <Download className="w-3.5 h-3.5" /> Export
                        </a>
                        <button onClick={() => { setForm({ kode_clo: '', deskripsi: '', plo_ids: [] }); setShowAddModal(true); }}
                            className="flex items-center gap-1.5 px-4 py-2 bg-[#801720] text-white rounded-xl text-xs font-semibold hover:bg-[#6a1219] transition-all shadow-sm">
                            <Plus className="w-3.5 h-3.5" /> Tambah CLO
                        </button>
                    </div>
                </div>

                {/* Search */}
                <form onSubmit={doSearch} className="flex gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari kode atau deskripsi..."
                            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] outline-none" />
                    </div>
                    <button type="submit" className="px-4 py-2.5 bg-[#801720] text-white rounded-xl text-sm font-semibold hover:bg-[#6a1219] transition-all">Cari</button>
                </form>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">No</th>
                                    <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Kode CLO</th>
                                    <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Deskripsi</th>
                                    <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Mapping PLO</th>
                                    <th className="text-right px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {cloList.data?.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-12 text-gray-400 text-sm">Tidak ada data CLO</td></tr>
                                ) : cloList.data?.map((item, idx) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4 text-gray-500 text-xs">{(cloList.current_page - 1) * cloList.per_page + idx + 1}</td>
                                        <td className="px-5 py-4 font-bold text-[#801720]">{item.kode_clo}</td>
                                        <td className="px-5 py-4 text-gray-700 max-w-xs">
                                            <p className="line-clamp-2 text-xs">{item.deskripsi}</p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {item.plo?.map(p => (
                                                    <span key={p.id} className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-semibold">{p.kode_plo}</span>
                                                ))}
                                                {(!item.plo || item.plo.length === 0) && <span className="text-xs text-gray-400">—</span>}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button onClick={() => openEdit(item)} className="p-1.5 hover:bg-amber-50 text-amber-600 rounded-lg transition-colors" title="Edit">
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={() => setDeleteItem(item)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors" title="Hapus">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {cloList.last_page > 1 && (
                        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                            <span>Menampilkan {cloList.from}–{cloList.to} dari {cloList.total} data</span>
                            <div className="flex gap-1">
                                {cloList.links?.map((link, i) => (
                                    <button key={i} disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                        className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${link.active ? 'bg-[#801720] text-white' : 'hover:bg-gray-100 text-gray-600 disabled:opacity-40'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Modal */}
            <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Tambah CLO">
                <CloForm form={form} setForm={setForm} allPlo={allPlo} onSubmit={handleAdd} processing={processing} />
            </Modal>

            {/* Edit Modal */}
            <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit CLO">
                <CloForm form={form} setForm={setForm} allPlo={allPlo} onSubmit={handleEdit} processing={processing} />
            </Modal>

            {/* Delete Confirm */}
            <Modal open={!!deleteItem} onClose={() => setDeleteItem(null)} title="Hapus CLO">
                <div className="flex items-start gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-800">Hapus <span className="text-[#801720]">{deleteItem?.kode_clo}</span>?</p>
                        <p className="text-xs text-gray-500 mt-1">Data CLO ini akan dihapus permanen dan tidak dapat dikembalikan.</p>
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
