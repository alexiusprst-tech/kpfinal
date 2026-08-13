import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { BookOpen, Plus, Search, Edit2, Trash2, CheckCircle, XCircle, AlertTriangle, Target, Activity, X, Filter } from 'lucide-react';

export default function Index({ mataKuliahList, allPlo, allClo, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [semester, setSemester] = useState(filters.semester || '');
    const [status, setStatus] = useState(filters.status || '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editMk, setEditMk] = useState(null);

    // Real-time reactive search & filtering with 250ms debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            const currentSearch = filters.search || '';
            const currentSemester = filters.semester || '';
            const currentStatus = filters.status || '';

            if (search !== currentSearch || semester !== currentSemester || status !== currentStatus) {
                router.get(
                    '/superadmin/mata-kuliah',
                    { search, semester, status },
                    { preserveState: true, preserveScroll: true, replace: true }
                );
            }
        }, 250);

        return () => clearTimeout(timer);
    }, [search, semester, status]);

    const handleResetFilters = () => {
        setSearch('');
        setSemester('');
        setStatus('');
        router.get('/superadmin/mata-kuliah', {}, { preserveState: true, preserveScroll: true });
    };

    const createForm = useForm({
        kode_mk: '',
        nama_mk: '',
        nama_mk_en: '',
        sks: 3,
        semester: 1,
        plo_ids: [],
        clo_ids: [],
    });

    const editForm = useForm({
        kode_mk: '',
        nama_mk: '',
        nama_mk_en: '',
        sks: 3,
        semester: 1,
        status: 'ACTIVE',
        plo_ids: [],
        clo_ids: [],
    });

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        createForm.post('/superadmin/mata-kuliah', {
            onSuccess: () => {
                setIsCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const handleEditOpen = (mk) => {
        setEditMk(mk);
        editForm.setData({
            kode_mk: mk.kode_mk,
            nama_mk: mk.nama_mk,
            nama_mk_en: mk.nama_mk_en || '',
            sks: mk.sks,
            semester: mk.semester || 1,
            status: mk.status,
            plo_ids: mk.plo ? mk.plo.map((p) => p.id) : [],
            clo_ids: mk.clo ? mk.clo.map((c) => c.id) : [],
        });
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        editForm.put(`/superadmin/mata-kuliah/${editMk.id}`, {
            onSuccess: () => {
                setEditMk(null);
            },
        });
    };

    const [deleteMk, setDeleteMk] = useState(null);

    const handleConfirmDelete = () => {
        if (!deleteMk) return;
        router.delete(`/superadmin/mata-kuliah/${deleteMk.id}`, {
            onSuccess: () => {
                setDeleteMk(null);
            },
        });
    };

    const togglePlo = (form, ploId) => {
        const current = form.data.plo_ids;
        if (current.includes(ploId)) {
            form.setData('plo_ids', current.filter((id) => id !== ploId));
        } else {
            form.setData('plo_ids', [...current, ploId]);
        }
    };

    const toggleClo = (form, cloId) => {
        const current = form.data.clo_ids;
        if (current.includes(cloId)) {
            form.setData('clo_ids', current.filter((id) => id !== cloId));
        } else {
            form.setData('clo_ids', [...current, cloId]);
        }
    };

    return (
        <AuthenticatedLayout title="Manajemen Mata Kuliah">
            <Head title="Master Data Mata Kuliah" />

            {/* Header Title & Action Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-extrabold text-[#1E293B] tracking-tight">Manajemen Mata Kuliah</h1>
                    <p className="text-xs sm:text-sm text-[#64748B] font-medium">
                        Kelola data master mata kuliah kurikulum dan pemetaan terhadap PLO serta CLO secara real-time.
                    </p>
                </div>

                <button 
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#801720] hover:bg-[#9B1724] text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Mata Kuliah</span>
                </button>
            </div>

            {/* Filter & Real-Time Search Bar */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/70 shadow-sm mb-6 space-y-4">
                <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
                    {/* Real-Time Search Input */}
                    <div className="relative w-full md:w-96">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input 
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari kode MK, nama Indonesia, atau Inggris secara real-time..."
                            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] transition-all font-medium"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                                title="Bersihkan pencarian"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Status & Action Filters */}
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold mr-1">
                            <Filter className="w-3.5 h-3.5 text-[#801720]" />
                            <span>Status:</span>
                        </div>

                        <div className="inline-flex bg-slate-100 p-1 rounded-xl gap-1">
                            <button
                                onClick={() => setStatus('')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${!status ? 'bg-white text-[#801720] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                Semua Status
                            </button>
                            <button
                                onClick={() => setStatus('ACTIVE')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${status === 'ACTIVE' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                Aktif
                            </button>
                            <button
                                onClick={() => setStatus('INACTIVE')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${status === 'INACTIVE' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                Nonaktif
                            </button>
                        </div>

                        {(search || semester || status) && (
                            <button
                                onClick={handleResetFilters}
                                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors"
                            >
                                Reset Filter
                            </button>
                        )}
                    </div>
                </div>

                {/* Semester Badges Filter Bar */}
                <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 pb-1">
                    <span className="text-xs font-bold text-slate-500 flex-shrink-0">Semester:</span>
                    <button
                        onClick={() => setSemester('')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${!semester ? 'bg-[#801720] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        Semua
                    </button>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <button
                            key={s}
                            onClick={() => setSemester(s.toString())}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${semester === s.toString() ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            Semester {s}
                        </button>
                    ))}
                </div>

                {/* Counter Footer */}
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold pt-2 border-t border-slate-100">
                    <div>
                        Menampilkan <strong className="text-[#801720] font-extrabold">{mataKuliahList.total}</strong> mata kuliah kurikulum
                        {(search || semester || status) && <span className="text-slate-400 font-normal"> (hasil filter)</span>}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden mb-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[#64748B] font-extrabold uppercase tracking-wider">
                                <th className="p-4 text-center">Semester</th>
                                <th className="p-4">Kode MK</th>
                                <th className="p-4">Nama Mata Kuliah</th>
                                <th className="p-4 text-center">SKS</th>
                                <th className="p-4">Mapping PLO</th>
                                <th className="p-4">Mapping CLO</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[#1E293B] font-medium">
                            {mataKuliahList.data.length > 0 ? (
                                mataKuliahList.data.map((mk) => (
                                    <tr key={mk.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="p-4 text-center">
                                            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-extrabold text-[11px] border border-blue-200">
                                                Semester {mk.semester || 1}
                                            </span>
                                        </td>
                                        <td className="p-4 font-bold text-[#801720]">{mk.kode_mk}</td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800">{mk.nama_mk}</div>
                                            {mk.nama_mk_en && (
                                                <div className="text-[11px] text-slate-400 italic font-medium mt-0.5">{mk.nama_mk_en}</div>
                                            )}
                                        </td>
                                        <td className="p-4 text-center font-extrabold">{mk.sks} SKS</td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1">
                                                {mk.plo && mk.plo.map((p) => (
                                                    <span key={p.id} className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold text-[10px]" title={p.deskripsi}>
                                                        {p.kode_plo}
                                                    </span>
                                                ))}
                                                {(!mk.plo || mk.plo.length === 0) && <span className="text-slate-400 text-[10px]">-</span>}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1">
                                                {mk.clo && mk.clo.map((c) => (
                                                    <span key={c.id} className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]" title={c.deskripsi}>
                                                        {c.kode_clo}
                                                    </span>
                                                ))}
                                                {(!mk.clo || mk.clo.length === 0) && <span className="text-slate-400 text-[10px]">-</span>}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {mk.status === 'ACTIVE' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                                                    <CheckCircle className="w-3 h-3" />
                                                    ACTIVE
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-700 font-bold text-[10px]">
                                                    <XCircle className="w-3 h-3" />
                                                    INACTIVE
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button 
                                                    onClick={() => handleEditOpen(mk)}
                                                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button 
                                                    onClick={() => setDeleteMk(mk)}
                                                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                                                    title="Hapus"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="p-8 text-center text-slate-400 font-semibold">
                                        Belum ada data Mata Kuliah yang sesuai filter.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {mataKuliahList.links && (
                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium">
                            Menampilkan {mataKuliahList.from || 0} - {mataKuliahList.to || 0} dari {mataKuliahList.total} Mata Kuliah
                        </span>
                        <div className="flex gap-1">
                            {mataKuliahList.links.map((link, idx) => (
                                <button
                                    key={idx}
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url)}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                        link.active ? 'bg-[#801720] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Create */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-lg font-extrabold text-[#1E293B] mb-4">Tambah Mata Kuliah</h2>
                        
                        <form onSubmit={handleCreateSubmit} className="space-y-4">
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Semester</label>
                                    <select 
                                        value={createForm.data.semester}
                                        onChange={(e) => createForm.setData('semester', parseInt(e.target.value) || 1)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#801720]"
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                                            <option key={s} value={s}>Semester {s}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Kode MK</label>
                                    <input 
                                        type="text"
                                        value={createForm.data.kode_mk}
                                        onChange={(e) => createForm.setData('kode_mk', e.target.value)}
                                        placeholder="Contoh: BBK1AAB4"
                                        required
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#801720]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">SKS</label>
                                    <input 
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={createForm.data.sks}
                                        onChange={(e) => createForm.setData('sks', parseInt(e.target.value) || 3)}
                                        required
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#801720]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Mata Kuliah (Indonesia)</label>
                                <input 
                                    type="text"
                                    value={createForm.data.nama_mk}
                                    onChange={(e) => createForm.setData('nama_mk', e.target.value)}
                                    placeholder="Contoh: Algoritma dan Pemrograman"
                                    required
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#801720]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Mata Kuliah (Inggris)</label>
                                <input 
                                    type="text"
                                    value={createForm.data.nama_mk_en}
                                    onChange={(e) => createForm.setData('nama_mk_en', e.target.value)}
                                    placeholder="Contoh: Algorithms and Programming"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#801720]"
                                />
                            </div>

                            {/* PLO Mapping */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                    <Target className="w-3.5 h-3.5 text-purple-600" />
                                    <span>Pilih PLO Terkait</span>
                                </label>
                                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200 max-h-36 overflow-y-auto">
                                    {allPlo.map((plo) => {
                                        const isSelected = createForm.data.plo_ids.includes(plo.id);
                                        return (
                                            <button
                                                type="button"
                                                key={plo.id}
                                                onClick={() => togglePlo(createForm, plo.id)}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                    isSelected ? 'bg-purple-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                                }`}
                                            >
                                                {plo.kode_plo}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* CLO Mapping */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                    <Activity className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Pilih CLO Terkait</span>
                                </label>
                                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200 max-h-36 overflow-y-auto">
                                    {allClo.map((clo) => {
                                        const isSelected = createForm.data.clo_ids.includes(clo.id);
                                        return (
                                            <button
                                                type="button"
                                                key={clo.id}
                                                onClick={() => toggleClo(createForm, clo.id)}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                    isSelected ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                                }`}
                                            >
                                                {clo.kode_clo}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                                <button 
                                    type="button" 
                                    onClick={() => setIsCreateOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={createForm.processing}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#801720] hover:bg-[#9B1724]"
                                >
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Edit */}
            {editMk && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-lg font-extrabold text-[#1E293B] mb-4">Edit Mata Kuliah</h2>
                        
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div className="grid grid-cols-4 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Semester</label>
                                    <select 
                                        value={editForm.data.semester}
                                        onChange={(e) => editForm.setData('semester', parseInt(e.target.value) || 1)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#801720]"
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                                            <option key={s} value={s}>Semester {s}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Kode MK</label>
                                    <input 
                                        type="text"
                                        value={editForm.data.kode_mk}
                                        onChange={(e) => editForm.setData('kode_mk', e.target.value)}
                                        required
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#801720]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">SKS</label>
                                    <input 
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={editForm.data.sks}
                                        onChange={(e) => editForm.setData('sks', parseInt(e.target.value) || 3)}
                                        required
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#801720]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                                    <select 
                                        value={editForm.data.status}
                                        onChange={(e) => editForm.setData('status', e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#801720]"
                                    >
                                        <option value="ACTIVE">ACTIVE</option>
                                        <option value="INACTIVE">INACTIVE</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Mata Kuliah (Indonesia)</label>
                                <input 
                                    type="text"
                                    value={editForm.data.nama_mk}
                                    onChange={(e) => editForm.setData('nama_mk', e.target.value)}
                                    required
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#801720]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Mata Kuliah (Inggris)</label>
                                <input 
                                    type="text"
                                    value={editForm.data.nama_mk_en}
                                    onChange={(e) => editForm.setData('nama_mk_en', e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#801720]"
                                />
                            </div>

                            {/* PLO Mapping */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                    <Target className="w-3.5 h-3.5 text-purple-600" />
                                    <span>Pilih PLO Terkait</span>
                                </label>
                                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200 max-h-36 overflow-y-auto">
                                    {allPlo.map((plo) => {
                                        const isSelected = editForm.data.plo_ids.includes(plo.id);
                                        return (
                                            <button
                                                type="button"
                                                key={plo.id}
                                                onClick={() => togglePlo(editForm, plo.id)}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                    isSelected ? 'bg-purple-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                                }`}
                                            >
                                                {plo.kode_plo}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* CLO Mapping */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                    <Activity className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Pilih CLO Terkait</span>
                                </label>
                                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200 max-h-36 overflow-y-auto">
                                    {allClo.map((clo) => {
                                        const isSelected = editForm.data.clo_ids.includes(clo.id);
                                        return (
                                            <button
                                                type="button"
                                                key={clo.id}
                                                onClick={() => toggleClo(editForm, clo.id)}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                    isSelected ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                                }`}
                                            >
                                                {clo.kode_clo}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                                <button 
                                    type="button" 
                                    onClick={() => setEditMk(null)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={editForm.processing}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#801720] hover:bg-[#9B1724]"
                                >
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Custom UI Delete Confirmation Modal */}
            {deleteMk && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-start gap-4">
                            <div className="w-11 h-11 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-[#1E293B]">Konfirmasi Hapus Mata Kuliah</h3>
                                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                                    Apakah Anda yakin ingin menghapus Mata Kuliah <strong className="text-slate-800 font-bold">{deleteMk.nama_mk}</strong> ({deleteMk.kode_mk})? Tindakan ini bersifat permanen.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-6">
                            <button 
                                type="button" 
                                onClick={() => setDeleteMk(null)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                                Batal
                            </button>
                            <button 
                                type="button" 
                                onClick={handleConfirmDelete}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#801720] hover:bg-[#9B1724] transition-colors shadow-md cursor-pointer"
                            >
                                Ya, Hapus Data
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
