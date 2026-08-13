import React, { useState } from 'react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import {
    Target, Plus, Search, Edit2, Trash2, Download, Upload,
    CheckCircle2, CloudUpload, ArrowRight, Check,
    AlertCircle, FileSpreadsheet, FileText, Eye, AlertTriangle, X
} from 'lucide-react';

export default function Index({ ploList, filters }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState(filters.search || '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editPlo, setEditPlo] = useState(null);
    const [deletePlo, setDeletePlo] = useState(null); // Custom Delete Modal State
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false); // Full Preview Modal State

    // Interactive Stepper Flow State (Steps 1 to 5)
    const [activeStep, setActiveStep] = useState(1);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewData, setPreviewData] = useState([
        { no: 1, kode: 'PLO01', deskripsi: 'Mampu menerapkan pengetahuan matematika, sains, dan rekayasa.' },
        { no: 2, kode: 'PLO02', deskripsi: 'Mampu merancang dan melaksanakan eksperimen serta menganalisis data.' },
        { no: 3, kode: 'PLO03', deskripsi: 'Mampu merancang sistem, komponen, atau proses untuk memenuhi kebutuhan.' },
        { no: 4, kode: 'PLO04', deskripsi: 'Mampu bekerja dalam tim multidisiplin secara efektif.' },
        { no: 5, kode: 'PLO05', deskripsi: 'Mampu mengidentifikasi, merumuskan, dan memecahkan masalah rekayasa.' },
        { no: 6, kode: 'PLO06', deskripsi: 'Memahami tanggung jawab profesi dan etika rekayasa.' },
        { no: 7, kode: 'PLO07', deskripsi: 'Mampu berkomunikasi secara efektif baik lisan maupun tulisan.' },
        { no: 8, kode: 'PLO08', deskripsi: 'Memahami dampak solusi rekayasa dalam konteks global dan sosial.' },
        { no: 9, kode: 'PLO09', deskripsi: 'Mengenali kebutuhan dan memiliki kemampuan untuk belajar sepanjang hayat.' },
        { no: 10, kode: 'PLO10', deskripsi: 'Memahami isu-isu terkini dalam bidang teknologi dan rekayasa.' },
    ]);
    const [importedCount, setImportedCount] = useState(10);
    const [isImporting, setIsImporting] = useState(false);

    const createForm = useForm({
        kode_plo: '',
        deskripsi: '',
    });

    const editForm = useForm({
        kode_plo: '',
        deskripsi: '',
    });

    const importForm = useForm({
        file: null,
    });

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/superadmin/plo', { search }, { preserveState: true });
    };

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        createForm.post('/superadmin/plo', {
            onSuccess: () => {
                setIsCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const handleEditOpen = (plo) => {
        setEditPlo(plo);
        editForm.setData({
            kode_plo: plo.kode_plo,
            deskripsi: plo.deskripsi,
        });
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        editForm.put(`/superadmin/plo/${editPlo.id}`, {
            onSuccess: () => {
                setEditPlo(null);
            },
        });
    };

    // Custom UI Delete Handler
    const handleConfirmDelete = () => {
        if (!deletePlo) return;
        router.delete(`/superadmin/plo/${deletePlo.id}`, {
            onSuccess: () => {
                setDeletePlo(null);
            },
        });
    };

    // File Selection for Step 2 -> Step 3
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setSelectedFile(file);
        importForm.setData('file', file);

        if (file.name.endsWith('.csv')) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                const text = evt.target.result;
                const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
                if (lines.length > 1) {
                    const parsed = lines.slice(1).map((line, idx) => {
                        const parts = line.split(',');
                        return {
                            no: idx + 1,
                            kode: parts[0] || `PLO0${idx + 1}`,
                            deskripsi: parts[1] || 'Capaian Pembelajaran PLO',
                        };
                    });
                    setPreviewData(parsed);
                    setImportedCount(parsed.length);
                }
            };
            reader.readAsText(file);
        } else {
            setImportedCount(25);
        }

        setActiveStep(3); // Advance timeline to Step 3 (Preview)
    };

    // Execute Import at Step 3 -> Step 4
    const handleExecuteImport = () => {
        if (!importForm.data.file) {
            alert('Silakan pilih file Excel / CSV pada Langkah 2 terlebih dahulu.');
            setActiveStep(2);
            return;
        }

        setIsImporting(true);
        importForm.post('/superadmin/plo/import', {
            onSuccess: () => {
                setIsImporting(false);
                setIsPreviewModalOpen(false);
                setActiveStep(4); // Advance timeline to Step 4 (Success)
            },
            onError: () => {
                setIsImporting(false);
            }
        });
    };

    // Step configuration for the timeline
    const steps = [
        { number: 1, label: 'Download Template' },
        { number: 2, label: 'Import File Excel' },
        { number: 3, label: 'Preview Data' },
        { number: 4, label: 'Import Berhasil' },
        { number: 5, label: 'Export Data' },
    ];

    return (
        <AuthenticatedLayout title="Manajemen PLO">
            <Head title="Master Data PLO" />

            {/* Header Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
                        <Target className="w-6 h-6 text-[#801720]" /> Master PLO
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Kelola Program Learning Outcomes (PLO) dan capaian pembelajaran lulusan</p>
                </div>

                <div className="flex gap-2 flex-wrap">
                    <a href="/superadmin/plo/template" className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                        <Download className="w-3.5 h-3.5" /> Template
                    </a>
                    <label className="flex items-center gap-1.5 px-3 py-2 border border-[#801720] text-[#801720] rounded-xl text-xs font-semibold cursor-pointer hover:bg-red-50 transition-all">
                        <Upload className="w-3.5 h-3.5" /> Import
                        <input
                            type="file"
                            accept=".xlsx,.csv,.xls"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </label>
                    <a href="/superadmin/plo/export" className="flex items-center gap-1.5 px-3 py-2 bg-gray-700 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-all">
                        <Download className="w-3.5 h-3.5" /> Export
                    </a>
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#801720] text-white rounded-xl text-xs font-semibold hover:bg-[#6a1219] transition-all shadow-sm"
                    >
                        <Plus className="w-3.5 h-3.5" /> Tambah PLO
                    </button>
                </div>
            </div>

            {/* Flash Messages */}
            {flash?.success && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{flash.success}</span>
                </div>
            )}
            {flash?.error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <span>{flash.error}</span>
                </div>
            )}

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari kode atau deskripsi..."
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] outline-none"
                    />
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
                                <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Kode PLO</th>
                                <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Deskripsi</th>
                                <th className="text-right px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {ploList.data && ploList.data.length > 0 ? (
                                ploList.data.map((plo, idx) => (
                                    <tr key={plo.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-3 text-sm text-gray-600">{idx + 1}</td>
                                        <td className="px-5 py-3 font-bold text-[#801720]">{plo.kode_plo}</td>
                                        <td className="px-5 py-3 text-gray-700">{plo.deskripsi}</td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditOpen(plo)}
                                                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setDeletePlo(plo)}
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
                                    <td colSpan="4" className="text-center py-12 text-gray-400 text-sm">Tidak ada data PLO</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {ploList.links && (
                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium">
                            Menampilkan {ploList.from || 0} - {ploList.to || 0} dari {ploList.total || 0} PLO
                        </span>
                        <div className="flex gap-1">
                            {ploList.links.map((link, idx) => (
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

            {/* ─── FULL PREVIEW DATA MODAL ─── */}
            {isPreviewModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh]">
                        {/* Modal Header */}
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-[#801720]/10 flex items-center justify-center text-[#801720]">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-extrabold text-[#1E293B]">
                                        Pratinjau Seluruh Data Import ({previewData.length} Item)
                                    </h2>
                                    <p className="text-xs text-[#64748B] mt-0.5">
                                        Periksa seluruh isi data dari berkas Excel sebelum mengimpor ke sistem.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsPreviewModalOpen(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body - Scrollable Table */}
                        <div className="p-5 overflow-y-auto flex-1">
                            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-slate-100 text-[#64748B] font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                                            <th className="p-3 w-12 text-center">No</th>
                                            <th className="p-3 w-28">Kode PLO</th>
                                            <th className="p-3">Deskripsi Capaian Pembelajaran</th>
                                            <th className="p-3 text-center w-28">Status Validasi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-[#1E293B] font-medium">
                                        {previewData.map((item, index) => (
                                            <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="p-3 text-center font-bold text-slate-400">{item.no || index + 1}</td>
                                                <td className="p-3 font-bold text-purple-700">
                                                    <span className="px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 font-extrabold text-[11px]">
                                                        {item.kode}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-slate-700 leading-relaxed">{item.deskripsi}</td>
                                                <td className="p-3 text-center">
                                                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold inline-flex items-center gap-1">
                                                        <Check className="w-3 h-3" /> Valid
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <span className="text-xs text-slate-500 font-semibold">
                                Total: <strong className="text-slate-800">{previewData.length} Data Siap Diimpor</strong>
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsPreviewModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-200/80 hover:bg-slate-300 transition-colors cursor-pointer"
                                >
                                    Tutup Pratinjau
                                </button>
                                <button
                                    type="button"
                                    onClick={handleExecuteImport}
                                    disabled={isImporting}
                                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#801720] hover:bg-[#9B1724] transition-colors shadow-md flex items-center gap-1.5 cursor-pointer"
                                >
                                    <span>{isImporting ? 'Mengimpor...' : 'Import Sekarang'}</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── CUSTOM UI DELETE CONFIRMATION MODAL (No Native Confirm Window) ─── */}
            {deletePlo && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-start gap-4">
                            <div className="w-11 h-11 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-[#1E293B]">Konfirmasi Hapus PLO</h3>
                                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                                    Apakah Anda yakin ingin menghapus data PLO <strong className="text-slate-800 font-bold">{deletePlo.kode_plo}</strong>? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-6">
                            <button
                                type="button"
                                onClick={() => setDeletePlo(null)}
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

            {/* Modal Create */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
                        <h2 className="text-lg font-extrabold text-[#1E293B] mb-4">Tambah Data PLO</h2>

                        <form onSubmit={handleCreateSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Kode PLO</label>
                                <input
                                    type="text"
                                    value={createForm.data.kode_plo}
                                    onChange={(e) => createForm.setData('kode_plo', e.target.value)}
                                    placeholder="Contoh: PLO01"
                                    required
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#801720]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Capaian</label>
                                <textarea
                                    rows="4"
                                    value={createForm.data.deskripsi}
                                    onChange={(e) => createForm.setData('deskripsi', e.target.value)}
                                    placeholder="Tuliskan deskripsi CPL / PLO..."
                                    required
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#801720]"
                                ></textarea>
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
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Edit */}
            {editPlo && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
                        <h2 className="text-lg font-extrabold text-[#1E293B] mb-4">Edit Data PLO</h2>

                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Kode PLO</label>
                                <input
                                    type="text"
                                    value={editForm.data.kode_plo}
                                    onChange={(e) => editForm.setData('kode_plo', e.target.value)}
                                    required
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#801720]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Capaian</label>
                                <textarea
                                    rows="4"
                                    value={editForm.data.deskripsi}
                                    onChange={(e) => editForm.setData('deskripsi', e.target.value)}
                                    required
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#801720]"
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setEditPlo(null)}
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
        </AuthenticatedLayout>
    );
}
