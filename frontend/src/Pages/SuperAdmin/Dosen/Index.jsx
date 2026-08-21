import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';
import FlashAlert from '../../../Components/FlashAlert';
import { showToast, showAlert, showConfirm } from '@/Utils/sweetalert';
import { Head, useForm, router, usePage } from '@inertiajs/react';

import { 
    Users, Plus, Search, Edit2, Trash2, CheckCircle, XCircle, 
    UserCheck, FileCheck, ShieldAlert, AlertTriangle, X, Filter,
    UserMinus, ShieldOff, BookOpen, Calendar, AlertCircle
} from 'lucide-react';

export default function Index({ dosenList, filters }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState(filters.search || '');
    const [kategori, setKategori] = useState(filters.kategori || '');
    const [status, setStatus] = useState(filters.status || '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editDosen, setEditDosen] = useState(null);
    const [deleteDosen, setDeleteDosen] = useState(null);
    const [revokeDosen, setRevokeDosen] = useState(null);
    const [isRevoking, setIsRevoking] = useState(false);

    // Real-time reactive search & filtering with 250ms debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            const currentSearch = filters.search || '';
            const currentKategori = filters.kategori || '';
            const currentStatus = filters.status || '';

            if (search !== currentSearch || kategori !== currentKategori || status !== currentStatus) {
                router.get(
                    '/superadmin/dosen',
                    { search, kategori, status },
                    { preserveState: true, preserveScroll: true, replace: true }
                );
            }
        }, 250);

        return () => clearTimeout(timer);
    }, [search, kategori, status]);

    const handleResetFilters = () => {
        setSearch('');
        setKategori('');
        setStatus('');
        router.get('/superadmin/dosen', {}, { preserveState: true, preserveScroll: true });
    };

    const createForm = useForm({
        kode_dosen: '',
        nama_lengkap: '',
        email: '',
        kategori_dosen: 'Dosen Tetap',
        create_user: false,
        role: 'KOORDINATOR',
    });

    const editForm = useForm({
        kode_dosen: '',
        nama_lengkap: '',
        email: '',
        kategori_dosen: 'Dosen Tetap',
        status: 'ACTIVE',
    });

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        createForm.post('/superadmin/dosen', {
            onSuccess: () => {
                setIsCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const handleEditOpen = (dosen) => {
        setEditDosen(dosen);
        editForm.setData({
            kode_dosen: dosen.kode_dosen,
            nama_lengkap: dosen.nama_lengkap,
            email: dosen.email || '',
            kategori_dosen: dosen.kategori_dosen || 'Dosen Tetap',
            status: dosen.status,
        });
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        editForm.put(`/superadmin/dosen/${editDosen.id}`, {
            onSuccess: () => {
                setEditDosen(null);
            },
        });
    };

    const handleConfirmDelete = async (dosen = deleteDosen) => {
        if (!dosen) return;
        const result = await showConfirm({
            title: 'Hapus Data Dosen?',
            text: `Apakah Anda yakin ingin menghapus data dosen "${dosen?.nama_lengkap}" (${dosen?.kode_dosen})? Semua riwayat penugasan juga akan terhapus.`,
            icon: 'warning',
            confirmButtonText: 'Ya, Hapus Data',
            confirmButtonColor: '#CD202E',
        });
        if (result.isConfirmed) {
            router.delete(`/superadmin/dosen/${dosen.id}`, {
                onSuccess: () => {
                    setDeleteDosen(null);
                },
            });
        }
    };


    const handleRevokeAssignment = (type, penugasanId = null, penugasanType = null) => {
        if (!revokeDosen) return;
        setIsRevoking(true);
        router.post(
            `/superadmin/dosen/${revokeDosen.id}/cabut-penugasan`,
            {
                type,
                penugasan_id: penugasanId,
                penugasan_type: penugasanType,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setRevokeDosen(null);
                    setIsRevoking(false);
                },
                onError: () => {
                    setIsRevoking(false);
                },
            }
        );
    };

    return (
        <AuthenticatedLayout title="Manajemen Dosen">
            <Head title="Master Data Dosen" />

            {/* Header Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-extrabold text-[#1E293B] tracking-tight">Manajemen Dosen</h1>
                    <p className="text-xs sm:text-sm text-[#64748B] font-medium">
                        Kelola data master dosen, hak akses penugasan, dan pencabutan peran secara real-time.
                    </p>
                </div>

                <button 
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#801720] hover:bg-[#9B1724] text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Dosen</span>
                </button>
            </div>

            {/* Flash Messages */}
            <FlashAlert flash={flash} />

            {/* Filter & Real-Time Search Bar */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/70 shadow-sm mb-6 space-y-3">
                <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
                    {/* Real-Time Search Input */}
                    <div className="relative w-full md:w-96">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input 
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama, kode dosen, atau email secara real-time..."
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

                    {/* Filter Badges & Reset Button */}
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold mr-1">
                            <Filter className="w-3.5 h-3.5 text-[#801720]" />
                            <span>Filter:</span>
                        </div>

                        {/* Kategori Filter */}
                        <div className="inline-flex bg-slate-100 p-1 rounded-xl gap-1">
                            <button
                                onClick={() => setKategori('')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${!kategori ? 'bg-white text-[#801720] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                Semua Kategori
                            </button>
                            <button
                                onClick={() => setKategori('Dosen Tetap')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${kategori === 'Dosen Tetap' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                Dosen Tetap
                            </button>
                            <button
                                onClick={() => setKategori('LB')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${kategori === 'LB' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                LB
                            </button>
                        </div>

                        {/* Status Filter */}
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

                        {(search || kategori || status) && (
                            <button
                                onClick={handleResetFilters}
                                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors"
                            >
                                Reset Filter
                            </button>
                        )}
                    </div>
                </div>

                {/* Active Filter Indicators & Total Count */}
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold pt-1 border-t border-slate-100">
                    <div>
                        Menampilkan <strong className="text-[#801720] font-extrabold">{dosenList.total}</strong> data dosen
                        {(search || kategori || status) && <span className="text-slate-400 font-normal"> (hasil filter)</span>}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden mb-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[#64748B] font-extrabold uppercase tracking-wider">
                                <th className="p-4">Kode Dosen</th>
                                <th className="p-4">Nama Lengkap</th>
                                <th className="p-4">Kategori</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Status Penugasan</th>
                                <th className="p-4">Status Akun</th>
                                <th className="p-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[#1E293B] font-medium">
                            {dosenList.data.length > 0 ? (
                                dosenList.data.map((dosen) => {
                                    const hasAssignments = (dosen.active_koordinator_count > 0) || (dosen.active_verifikator_count > 0);

                                    return (
                                        <tr key={dosen.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="p-4 font-bold text-[#801720]">{dosen.kode_dosen}</td>
                                            <td className="p-4 font-bold">{dosen.nama_lengkap}</td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${dosen.kategori_dosen === 'LB' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-purple-50 text-purple-700 border border-purple-200'}`}>
                                                    {dosen.kategori_dosen || 'Dosen Tetap'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-500">{dosen.email || '-'}</td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    {dosen.user?.role === 'SUPER_ADMIN' && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 text-white font-bold text-[10px]">
                                                            <ShieldAlert className="w-3 h-3 text-red-400" />
                                                            SUPER ADMIN
                                                        </span>
                                                    )}
                                                    {dosen.active_koordinator_count > 0 && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200">
                                                            <UserCheck className="w-3 h-3" />
                                                            KOORDINATOR ({dosen.active_koordinator_count})
                                                        </span>
                                                    )}
                                                    {dosen.active_verifikator_count > 0 && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-200">
                                                            <FileCheck className="w-3 h-3" />
                                                            VERIFIKATOR ({dosen.active_verifikator_count})
                                                        </span>
                                                    )}
                                                    {!hasAssignments && dosen.user?.role !== 'SUPER_ADMIN' && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 font-semibold text-[10px]">
                                                            Belum Ditugaskan
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {dosen.status === 'ACTIVE' ? (
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
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {hasAssignments && (
                                                        <button 
                                                            onClick={() => setRevokeDosen(dosen)}
                                                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors cursor-pointer"
                                                            title="Cabut Penugasan (Koordinator / Verifikator)"
                                                        >
                                                            <UserMinus className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => handleEditOpen(dosen)}
                                                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                                        title="Edit"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleConfirmDelete(dosen)}
                                                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>

                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-slate-400 font-semibold">
                                        Belum ada data Dosen yang ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {dosenList.links && (
                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium">
                            Menampilkan {dosenList.from || 0} - {dosenList.to || 0} dari {dosenList.total} Dosen
                        </span>
                        <div className="flex gap-1">
                            {dosenList.links.map((link, idx) => (
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

            {/* Modal Tambah Dosen */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
                        <h2 className="text-lg font-extrabold text-[#1E293B] mb-4">Tambah Data Dosen</h2>
                        
                        <form onSubmit={handleCreateSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Kode Dosen</label>
                                <input 
                                    type="text"
                                    value={createForm.data.kode_dosen}
                                    onChange={(e) => createForm.setData('kode_dosen', e.target.value)}
                                    placeholder="Contoh: DSN006"
                                    required
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#801720]"
                                />
                                {createForm.errors.kode_dosen && <p className="text-[10px] text-red-600 mt-1">{createForm.errors.kode_dosen}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
                                <input 
                                    type="text"
                                    value={createForm.data.nama_lengkap}
                                    onChange={(e) => createForm.setData('nama_lengkap', e.target.value)}
                                    placeholder="Contoh: Dr. Budi Santoso, M.Kom."
                                    required
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#801720]"
                                />
                                {createForm.errors.nama_lengkap && <p className="text-[10px] text-red-600 mt-1">{createForm.errors.nama_lengkap}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                                <input 
                                    type="email"
                                    value={createForm.data.email}
                                    onChange={(e) => createForm.setData('email', e.target.value)}
                                    placeholder="Contoh: budi@telkomuniversity.ac.id"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#801720]"
                                />
                                {createForm.errors.email && <p className="text-[10px] text-red-600 mt-1">{createForm.errors.email}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Dosen</label>
                                <select 
                                    value={createForm.data.kategori_dosen}
                                    onChange={(e) => createForm.setData('kategori_dosen', e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#801720]"
                                >
                                    <option value="Dosen Tetap">Dosen Tetap</option>
                                    <option value="LB">LB (Luar Biasa)</option>
                                </select>
                            </div>

                            <div className="pt-2 border-t border-slate-100 space-y-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        checked={createForm.data.create_user}
                                        onChange={(e) => createForm.setData('create_user', e.target.checked)}
                                        className="rounded border-slate-300 text-[#801720] focus:ring-[#801720]"
                                    />
                                    <span className="text-xs font-bold text-slate-700">Buat Akun User Sekaligus</span>
                                </label>

                                {createForm.data.create_user && (
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 animate-in fade-in duration-200">
                                        <p className="text-[10px] text-slate-500">
                                            Password default: <code className="bg-white px-1 py-0.5 rounded text-[#801720] font-bold">password</code>
                                        </p>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-600 mb-1">Role Akun</label>
                                            <select 
                                                value={createForm.data.role}
                                                onChange={(e) => createForm.setData('role', e.target.value)}
                                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-[#801720]"
                                            >
                                                <option value="KOORDINATOR">Koordinator</option>
                                                <option value="VERIFIKATOR">Verifikator</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
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
                                    Simpan Dosen
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Edit Dosen */}
            {editDosen && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
                        <h2 className="text-lg font-extrabold text-[#1E293B] mb-4">Edit Data Dosen</h2>
                        
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Kode Dosen</label>
                                <input 
                                    type="text"
                                    value={editForm.data.kode_dosen}
                                    onChange={(e) => editForm.setData('kode_dosen', e.target.value)}
                                    required
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#801720]"
                                />
                                {editForm.errors.kode_dosen && <p className="text-[10px] text-red-600 mt-1">{editForm.errors.kode_dosen}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
                                <input 
                                    type="text"
                                    value={editForm.data.nama_lengkap}
                                    onChange={(e) => editForm.setData('nama_lengkap', e.target.value)}
                                    required
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#801720]"
                                />
                                {editForm.errors.nama_lengkap && <p className="text-[10px] text-red-600 mt-1">{editForm.errors.nama_lengkap}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                                <input 
                                    type="email"
                                    value={editForm.data.email}
                                    onChange={(e) => editForm.setData('email', e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#801720]"
                                />
                                {editForm.errors.email && <p className="text-[10px] text-red-600 mt-1">{editForm.errors.email}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Dosen</label>
                                <select 
                                    value={editForm.data.kategori_dosen}
                                    onChange={(e) => editForm.setData('kategori_dosen', e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#801720]"
                                >
                                    <option value="Dosen Tetap">Dosen Tetap</option>
                                    <option value="LB">LB (Luar Biasa)</option>
                                </select>
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

                            <div className="flex justify-end gap-2 pt-4">
                                <button 
                                    type="button" 
                                    onClick={() => setEditDosen(null)}
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
            {deleteDosen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-start gap-4">
                            <div className="w-11 h-11 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-[#1E293B]">Konfirmasi Hapus Dosen</h3>
                                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                                    Apakah Anda yakin ingin menghapus data dosen <strong className="text-slate-800 font-bold">{deleteDosen.nama_lengkap}</strong> ({deleteDosen.kode_dosen})? Akun autentikasi terkait juga akan dinonaktifkan.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-6">
                            <button 
                                type="button" 
                                onClick={() => setDeleteDosen(null)}
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

            {/* ================= MODAL CABUT PENUGASAN ================= */}
            {revokeDosen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto space-y-5">
                        
                        {/* Header */}
                        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                                    <UserMinus className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-gray-900">Cabut Penugasan Dosen</h3>
                                    <p className="text-xs text-gray-500">
                                        Pilih penugasan yang ingin dicabut dari dosen ini.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setRevokeDosen(null)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Dosen Info Card */}
                        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                            <div>
                                <span className="font-extrabold text-sm text-[#801720] block">
                                    {revokeDosen.kode_dosen}
                                </span>
                                <span className="text-xs font-bold text-gray-800">
                                    {revokeDosen.nama_lengkap}
                                </span>
                            </div>
                            <span className="text-xs text-gray-500">
                                {revokeDosen.email || 'Tanpa Email'}
                            </span>
                        </div>

                        {/* 1. Active Koordinator Assignments */}
                        {revokeDosen.penugasan_koordinator && revokeDosen.penugasan_koordinator.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-blue-900 uppercase">
                                        <UserCheck className="w-4 h-4 text-blue-600" />
                                        Penugasan Sebagai Koordinator ({revokeDosen.penugasan_koordinator.length})
                                    </div>
                                    <button
                                        type="button"
                                        disabled={isRevoking}
                                        onClick={() => handleRevokeAssignment('KOORDINATOR')}
                                        className="text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                                    >
                                        Cabut Semua Koordinator
                                    </button>
                                </div>

                                <div className="space-y-1.5">
                                    {revokeDosen.penugasan_koordinator.map((penugasan) => (
                                        <div 
                                            key={penugasan.id}
                                            className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl flex items-center justify-between text-xs"
                                        >
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-extrabold text-blue-950">
                                                        {penugasan.mata_kuliah?.kode_mk}
                                                    </span>
                                                    <span className="font-bold text-gray-800">
                                                        {penugasan.mata_kuliah?.nama_mk}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-gray-500 flex items-center gap-3">
                                                    <span>Periode: {penugasan.periode?.nama_periode || '-'}</span>
                                                    {penugasan.kelompok?.nama && (
                                                        <span>Kelompok: {penugasan.kelompok.nama}</span>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                disabled={isRevoking}
                                                onClick={() => handleRevokeAssignment('SPECIFIC', penugasan.id, 'KOORDINATOR')}
                                                className="px-2.5 py-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ml-2"
                                            >
                                                Cabut MK Ini
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 2. Active Verifikator Assignments */}
                        {revokeDosen.penugasan_verifikator && revokeDosen.penugasan_verifikator.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-indigo-900 uppercase">
                                        <FileCheck className="w-4 h-4 text-indigo-600" />
                                        Penugasan Sebagai Verifikator ({revokeDosen.penugasan_verifikator.length})
                                    </div>
                                    <button
                                        type="button"
                                        disabled={isRevoking}
                                        onClick={() => handleRevokeAssignment('VERIFIKATOR')}
                                        className="text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                                    >
                                        Cabut Semua Verifikator
                                    </button>
                                </div>

                                <div className="space-y-1.5">
                                    {revokeDosen.penugasan_verifikator.map((penugasan) => (
                                        <div 
                                            key={penugasan.id}
                                            className="p-3 bg-indigo-50/60 border border-indigo-200/80 rounded-xl flex items-center justify-between text-xs"
                                        >
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-extrabold text-indigo-950">
                                                        {penugasan.mata_kuliah?.kode_mk}
                                                    </span>
                                                    <span className="font-bold text-gray-800">
                                                        {penugasan.mata_kuliah?.nama_mk}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-gray-500 flex items-center gap-3">
                                                    <span>Periode: {penugasan.periode?.nama_periode || '-'}</span>
                                                    {penugasan.kelompok?.nama && (
                                                        <span>Kelompok: {penugasan.kelompok.nama}</span>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                disabled={isRevoking}
                                                onClick={() => handleRevokeAssignment('SPECIFIC', penugasan.id, 'VERIFIKATOR')}
                                                className="px-2.5 py-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ml-2"
                                            >
                                                Cabut MK Ini
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Notice */}
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-900">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <p>
                                Mencabut penugasan akan mengakhiri akses dosen terhadap mata kuliah terkait. Jika seluruh penugasan dicabut, role akun akan disesuaikan secara otomatis.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                disabled={isRevoking}
                                onClick={() => handleRevokeAssignment('ALL')}
                                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm cursor-pointer"
                            >
                                {isRevoking ? 'Memproses...' : 'Cabut SEMUA Penugasan (Koor & Verifikator)'}
                            </button>

                            <button 
                                type="button" 
                                onClick={() => setRevokeDosen(null)}
                                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer text-center"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
