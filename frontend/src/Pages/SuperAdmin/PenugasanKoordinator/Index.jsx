import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Plus, Trash2, AlertTriangle, X, FileCheck, Search } from 'lucide-react';

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

export default function PenugasanKoordinatorIndex({ list, dosenAll, mkAll, periodeAll, filters }) {
    const { flash } = usePage().props;
    const [showAdd, setShowAdd] = useState(false);
    const [deleteItem, setDeleteItem] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [periodeFilter, setPeriodeFilter] = useState(filters?.periode_id || '');
    const [form, setForm] = useState({ dosen_id: dosenAll[0]?.id || '', mata_kuliah_id: mkAll[0]?.id || '', periode_id: periodeAll[0]?.id || '' });

    const handleFilter = (pid) => {
        setPeriodeFilter(pid);
        router.get('/superadmin/penugasan-koordinator', { periode_id: pid }, { preserveState: true });
    };

    const handleAdd = (e) => {
        e.preventDefault(); setProcessing(true);
        router.post('/superadmin/penugasan-koordinator', form, { onFinish: () => { setProcessing(false); setShowAdd(false); } });
    };

    const handleDelete = () => {
        setProcessing(true);
        router.delete(`/superadmin/penugasan-koordinator/${deleteItem.id}`, { onFinish: () => { setProcessing(false); setDeleteItem(null); } });
    };

    const statusBadge = (s) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{s}</span>
    );

    return (
        <AuthenticatedLayout title="Penugasan Koordinator">
            <Head title="Penugasan Koordinator" />
            <Toast flash={flash} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
                            <FileCheck className="w-6 h-6 text-[#801720]" /> Penugasan Koordinator MK
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">Tugaskan dosen sebagai koordinator mata kuliah per periode</p>
                    </div>
                    <button onClick={() => setShowAdd(true)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#801720] text-white rounded-xl text-xs font-semibold hover:bg-[#6a1219] transition-all shadow-sm">
                        <Plus className="w-3.5 h-3.5" /> Tambah Penugasan
                    </button>
                </div>

                {/* Filter by Periode */}
                <div className="flex gap-2 flex-wrap">
                    <button onClick={() => handleFilter('')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${!periodeFilter ? 'bg-[#801720] text-white border-[#801720]' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                        Semua Periode
                    </button>
                    {periodeAll.map(p => (
                        <button key={p.id} onClick={() => handleFilter(p.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors truncate max-w-[180px] ${periodeFilter === p.id ? 'bg-[#801720] text-white border-[#801720]' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                            {p.nama}
                        </button>
                    ))}
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase">No</th>
                                    <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase">Dosen</th>
                                    <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase">Mata Kuliah</th>
                                    <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase">Periode</th>
                                    <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase">Status</th>
                                    <th className="text-right px-5 py-3.5 text-xs font-bold text-gray-500 uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {list.data?.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-12 text-gray-400">Belum ada penugasan</td></tr>
                                ) : list.data?.map((item, idx) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4 text-gray-500 text-xs">{(list.current_page - 1) * list.per_page + idx + 1}</td>
                                        <td className="px-5 py-4">
                                            <p className="font-semibold text-gray-800 text-xs">{item.dosen?.nama_lengkap || item.dosen?.nama}</p>
                                            <p className="text-[10px] text-gray-400">{item.dosen?.kode_dosen} · {item.dosen?.email}</p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="font-semibold text-xs text-gray-800">{item.mata_kuliah?.nama_mk}</p>
                                            <p className="text-[10px] text-gray-400">{item.mata_kuliah?.kode_mk}</p>
                                        </td>
                                        <td className="px-5 py-4 text-xs text-gray-600">{item.periode?.nama || '—'}</td>
                                        <td className="px-5 py-4">{statusBadge(item.status)}</td>
                                        <td className="px-5 py-4 text-right">
                                            <button onClick={() => setDeleteItem(item)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg" title="Akhiri Penugasan">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {list.last_page > 1 && (
                        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                            <span>Menampilkan {list.from}–{list.to} dari {list.total} data</span>
                            <div className="flex gap-1">
                                {list.links?.map((link, i) => (
                                    <button key={i} disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                        className={`px-2.5 py-1 rounded-lg font-semibold ${link.active ? 'bg-[#801720] text-white' : 'hover:bg-gray-100 text-gray-600 disabled:opacity-40'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Modal */}
            <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Tambah Penugasan Koordinator">
                <form onSubmit={handleAdd} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Dosen <span className="text-red-500">*</span></label>
                        <select value={form.dosen_id} onChange={e => setForm(f => ({ ...f, dosen_id: e.target.value }))}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] outline-none" required>
                            {dosenAll.map(d => <option key={d.id} value={d.id}>{d.nama_lengkap || d.nama || d.kode_dosen} ({d.kode_dosen})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Mata Kuliah <span className="text-red-500">*</span></label>
                        <select value={form.mata_kuliah_id} onChange={e => setForm(f => ({ ...f, mata_kuliah_id: e.target.value }))}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] outline-none" required>
                            {mkAll.map(m => <option key={m.id} value={m.id}>{m.nama_mk} ({m.kode_mk})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Periode <span className="text-red-500">*</span></label>
                        <select value={form.periode_id} onChange={e => setForm(f => ({ ...f, periode_id: e.target.value }))}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] outline-none" required>
                            {periodeAll.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end pt-2">
                        <button type="submit" disabled={processing} className="px-5 py-2.5 bg-[#801720] text-white rounded-xl text-sm font-semibold hover:bg-[#6a1219] disabled:opacity-60">
                            {processing ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirm */}
            <Modal open={!!deleteItem} onClose={() => setDeleteItem(null)} title="Akhiri Penugasan">
                <div className="flex items-start gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
                    <div>
                        <p className="text-sm font-semibold text-gray-800">Akhiri penugasan <span className="text-[#801720]">{deleteItem?.dosen?.nama_lengkap || deleteItem?.dosen?.nama}</span>?</p>
                        <p className="text-xs text-gray-500 mt-1">Status penugasan akan diubah menjadi ENDED.</p>
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={() => setDeleteItem(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50">Batal</button>
                    <button onClick={handleDelete} disabled={processing} className="px-4 py-2 text-sm bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-60">
                        {processing ? 'Mengakhiri...' : 'Ya, Akhiri'}
                    </button>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
