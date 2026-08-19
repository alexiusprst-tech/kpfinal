import React, { useState, useEffect, useRef } from 'react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    Target, Plus, Search, Edit2, Trash2, Download, Upload,
    CheckCircle2, AlertCircle, FileSpreadsheet, Eye,
    AlertTriangle, X, ChevronRight, ArrowRight, Check,
    CloudUpload, FileText, Pencil, Save, RotateCcw
} from 'lucide-react';

// ─── Bloom options ────────────────────────────────────────────────────────────
const BLOOM_OPTIONS = [
    '1 - Remember', '2 - Understand', '3 - Apply',
    '4 - Analyze', '5 - Evaluate', '6 - Create',
];

// ─── Stepper ──────────────────────────────────────────────────────────────────
function Stepper({ steps, activeStep }) {
    return (
        <div className="flex items-center gap-0 mb-8">
            {steps.map((step, idx) => {
                const done = activeStep > step.number;
                const active = activeStep === step.number;
                return (
                    <React.Fragment key={step.number}>
                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                                done ? 'bg-emerald-500 border-emerald-500 text-white' :
                                active ? 'bg-[#801720] border-[#801720] text-white shadow-lg shadow-red-200' :
                                'bg-white border-gray-200 text-gray-400'
                            }`}>
                                {done ? <Check className="w-4 h-4" /> : step.number}
                            </div>
                            <span className={`text-[10px] font-semibold text-center leading-tight max-w-[72px] ${
                                active ? 'text-[#801720]' : done ? 'text-emerald-600' : 'text-gray-400'
                            }`}>{step.label}</span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-1 mb-5 transition-all ${done ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PloIndex({ ploList, filters }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState(filters.search || '');

    // Real-time reactive search with 300ms debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            const currentSearch = filters?.search || '';
            if (search !== currentSearch) {
                router.get('/superadmin/plo', { search }, { preserveState: true, replace: true });
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    // Modal states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editPlo, setEditPlo] = useState(null);
    const [deletePlo, setDeletePlo] = useState(null);

    // Import wizard states
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [activeStep, setActiveStep] = useState(1);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [previewRows, setPreviewRows] = useState([]);
    const [previewErrors, setPreviewErrors] = useState([]);
    const [previewStats, setPreviewStats] = useState(null);
    const [editingRow, setEditingRow] = useState(null); // index of row being edited inline
    const [isConfirming, setIsConfirming] = useState(false);
    const fileInputRef = useRef(null);

    // Create/Edit form state
    const [createForm, setCreateForm] = useState({ kode_plo: '', deskripsi: '' });
    const [editForm, setEditForm] = useState({ kode_plo: '', deskripsi: '' });
    const [formProcessing, setFormProcessing] = useState(false);

    const steps = [
        { number: 1, label: 'Download Template' },
        { number: 2, label: 'Import File' },
        { number: 3, label: 'Validasi & Preview' },
        { number: 4, label: 'Edit & Konfirmasi' },
        { number: 5, label: 'Berhasil' },
    ];

    // ─── Handlers ─────────────────────────────────────────────────────────────
    const handleSearch = (e) => {
        e.preventDefault();
    };

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        setFormProcessing(true);
        router.post('/superadmin/plo', createForm, {
            onSuccess: () => { setIsCreateOpen(false); setCreateForm({ kode_plo: '', deskripsi: '' }); },
            onFinish: () => setFormProcessing(false),
        });
    };

    const handleEditOpen = (plo) => {
        setEditPlo(plo);
        setEditForm({ kode_plo: plo.kode_plo, deskripsi: plo.deskripsi });
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        setFormProcessing(true);
        router.put(`/superadmin/plo/${editPlo.id}`, editForm, {
            onSuccess: () => setEditPlo(null),
            onFinish: () => setFormProcessing(false),
        });
    };

    const handleConfirmDelete = () => {
        if (!deletePlo) return;
        router.delete(`/superadmin/plo/${deletePlo.id}`, {
            onSuccess: () => setDeletePlo(null),
        });
    };

    // ─── Import Wizard ─────────────────────────────────────────────────────────
    const openImportWizard = () => {
        setIsImportOpen(true);
        setActiveStep(1);
        setSelectedFile(null);
        setPreviewRows([]);
        setPreviewErrors([]);
        setPreviewStats(null);
        setEditingRow(null);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setSelectedFile(file);
        setActiveStep(2);
        e.target.value = '';
    };

    const handleFileDrop = (file) => {
        if (!file) return;
        const allowed = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];
        const ext = file.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(ext)) {
            alert('Format file tidak didukung. Gunakan .xlsx, .xls, atau .csv');
            return;
        }
        setSelectedFile(file);
        setActiveStep(2);
    };

    const handlePreview = async () => {
        if (!selectedFile) return;
        setIsPreviewing(true);
        const fd = new FormData();
        fd.append('file', selectedFile);

        try {
            const res = await axios.post('/superadmin/plo/preview', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const data = res.data;
            if (data.success) {
                setPreviewRows(data.rows);
                setPreviewErrors(data.errors || []);
                setPreviewStats({ total: data.totalRows, valid: data.validRows, error: data.errorRows });
                setActiveStep(3);
            } else {
                alert(data.message || 'Gagal memproses file.');
            }
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Terjadi kesalahan saat menghubungi server.';
            alert(msg);
        } finally {
            setIsPreviewing(false);
        }
    };

    const proceedToEdit = () => {
        const hasErrors = previewRows.some(r => !r.is_valid);
        if (hasErrors) {
            if (!window.confirm(`Ada ${previewStats?.error} baris yang tidak valid. Lanjut ke step edit untuk diperbaiki?`)) return;
        }
        setActiveStep(4);
    };

    // Inline edit handlers
    const startEditRow = (idx) => setEditingRow(idx);

    const saveEditRow = (idx, field, value) => {
        setPreviewRows(rows => rows.map((r, i) => {
            if (i !== idx) return r;
            const updated = { ...r, [field]: value };
            // Re-validate
            const errs = [];
            const kode = (field === 'kode_plo' ? value : updated.kode_plo || '').toUpperCase();
            const desk = field === 'deskripsi' ? value : updated.deskripsi || '';
            if (!kode) errs.push('Kode PLO tidak boleh kosong');
            else if (!/^PLO\d+$/i.test(kode)) errs.push('Format kode PLO tidak valid (contoh: PLO01)');
            if (!desk) errs.push('Deskripsi tidak boleh kosong');
            return { ...updated, kode_plo: kode, errors: errs, is_valid: errs.length === 0 };
        }));
    };

    const deleteRow = (idx) => {
        setPreviewRows(rows => rows.filter((_, i) => i !== idx));
    };

    const addRow = () => {
        setPreviewRows(rows => [...rows, { row: rows.length + 1, kode_plo: '', deskripsi: '', is_valid: false, errors: ['Kode PLO tidak boleh kosong', 'Deskripsi tidak boleh kosong'] }]);
        setEditingRow(previewRows.length);
    };

    const handleConfirmImport = () => {
        const validRows = previewRows.filter(r => r.is_valid);
        if (validRows.length === 0) {
            alert('Tidak ada data yang valid untuk disimpan.');
            return;
        }
        setIsConfirming(true);
        router.post('/superadmin/plo/confirm', { rows: validRows }, {
            onSuccess: () => { setIsImportOpen(false); setActiveStep(5); },
            onFinish: () => setIsConfirming(false),
        });
    };

    // ─── Render ────────────────────────────────────────────────────────────────
    return (
        <AuthenticatedLayout title="Manajemen PLO">
            <Head title="Master Data PLO" />

            {/* Header */}
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
                    <button
                        onClick={openImportWizard}
                        className="flex items-center gap-1.5 px-3 py-2 border border-[#801720] text-[#801720] rounded-xl text-xs font-semibold cursor-pointer hover:bg-red-50 transition-all"
                    >
                        <Upload className="w-3.5 h-3.5" /> Import
                    </button>
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
                                        <td className="px-5 py-3 text-sm text-gray-600">{(ploList.current_page - 1) * ploList.per_page + idx + 1}</td>
                                        <td className="px-5 py-3 font-bold text-[#801720]">{plo.kode_plo}</td>
                                        <td className="px-5 py-3 text-gray-700">{plo.deskripsi}</td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEditOpen(plo)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer" title="Edit">
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={() => setDeletePlo(plo)} className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer" title="Hapus">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="4" className="text-center py-12 text-gray-400 text-sm">Tidak ada data PLO</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
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
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${link.active ? 'bg-[#801720] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ─── IMPORT WIZARD MODAL ─── */}
            {isImportOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
                        {/* Modal Header */}
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-[#801720]/5 to-white">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-[#801720]/10 flex items-center justify-center">
                                    <FileSpreadsheet className="w-5 h-5 text-[#801720]" />
                                </div>
                                <div>
                                    <h2 className="text-base font-extrabold text-slate-800">Import Data PLO</h2>
                                    <p className="text-xs text-slate-500">Upload Excel → Validasi → Preview → Edit → Simpan</p>
                                </div>
                            </div>
                            <button onClick={() => setIsImportOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Stepper */}
                        <div className="px-6 pt-5">
                            <Stepper steps={steps} activeStep={activeStep} />
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto px-6 pb-6">

                            {/* Step 1: Download Template */}
                            {activeStep === 1 && (
                                <div className="space-y-5">
                                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                                        <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                                            <FileText className="w-4 h-4" /> Format Template PLO
                                        </h3>
                                        <p className="text-xs text-blue-600 mb-3">Download template Excel, isi data, lalu import kembali ke sistem.</p>
                                        <div className="bg-white rounded-xl border border-blue-200 overflow-hidden">
                                            <table className="w-full text-xs">
                                                <thead className="bg-[#801720] text-white">
                                                    <tr>
                                                        <th className="p-2.5 text-left font-bold">KODE PLO</th>
                                                        <th className="p-2.5 text-left font-bold">Program Learning Outcome / Capaian Pembelajaran</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {[['PLO01', 'Mampu menerapkan pemikiran logis, kritis, sistematis...'], ['PLO02', 'Mampu merancang dan mengimplementasikan perangkat lunak...']].map(([k, d]) => (
                                                        <tr key={k} className="border-t border-blue-100">
                                                            <td className="p-2.5 font-semibold text-[#801720]">{k}</td>
                                                            <td className="p-2.5 text-gray-600">{d}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <a href="/superadmin/plo/template"
                                            className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[#801720]/40 rounded-xl text-sm font-semibold text-[#801720] hover:bg-red-50 transition-all"
                                        >
                                            <Download className="w-4 h-4" /> Download Template Excel
                                        </a>
                                        <button
                                            onClick={() => setActiveStep(2)}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#801720] text-white rounded-xl text-sm font-semibold hover:bg-[#6a1219] transition-all"
                                        >
                                            Lanjut ke Import <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Import File */}
                            {activeStep === 2 && (
                                <div className="space-y-5">
                                    <div
                                        className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
                                            isDragging
                                                ? 'border-[#801720] bg-red-50/60 scale-[1.01]'
                                                : 'border-gray-300 hover:border-[#801720]/50 hover:bg-red-50/30'
                                        }`}
                                        onClick={() => fileInputRef.current?.click()}
                                        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                                        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setIsDragging(false);
                                            const file = e.dataTransfer.files[0];
                                            handleFileDrop(file);
                                        }}
                                    >
                                        <CloudUpload className={`w-12 h-12 mx-auto mb-3 transition-colors ${isDragging ? 'text-[#801720]' : 'text-gray-300'}`} />
                                        <p className={`text-sm font-semibold transition-colors ${isDragging ? 'text-[#801720]' : 'text-gray-600'}`}>
                                            {isDragging ? 'Lepaskan file di sini!' : 'Klik atau seret file Excel ke sini'}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">Format: .xlsx, .xls, .csv (Maks. 5MB)</p>
                                        <input ref={fileInputRef} type="file" accept=".xlsx,.csv,.xls" className="hidden" onChange={handleFileSelect} />
                                    </div>
                                    {selectedFile && (
                                        <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                                            <FileSpreadsheet className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-emerald-800 truncate">{selectedFile.name}</p>
                                                <p className="text-xs text-emerald-600">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                            <button onClick={() => { setSelectedFile(null); }} className="text-emerald-500 hover:text-red-500"><X className="w-4 h-4" /></button>
                                        </div>
                                    )}
                                    <div className="flex gap-3">
                                        <button onClick={() => setActiveStep(1)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
                                            ← Kembali
                                        </button>
                                        <button
                                            onClick={handlePreview}
                                            disabled={!selectedFile || isPreviewing}
                                            className="flex-1 py-2.5 bg-[#801720] text-white rounded-xl text-sm font-semibold hover:bg-[#6a1219] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                        >
                                            {isPreviewing ? (<><span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></span> Memvalidasi...</>) : (<><Eye className="w-4 h-4" /> Validasi & Preview</>)}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Validasi & Preview */}
                            {activeStep === 3 && previewStats && (
                                <div className="space-y-4">
                                    {/* Stats */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                                            <p className="text-2xl font-extrabold text-blue-700">{previewStats.total}</p>
                                            <p className="text-xs text-blue-500 font-semibold mt-0.5">Total Baris</p>
                                        </div>
                                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                                            <p className="text-2xl font-extrabold text-emerald-700">{previewStats.valid}</p>
                                            <p className="text-xs text-emerald-500 font-semibold mt-0.5">Valid</p>
                                        </div>
                                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                                            <p className="text-2xl font-extrabold text-red-700">{previewStats.error}</p>
                                            <p className="text-xs text-red-500 font-semibold mt-0.5">Error</p>
                                        </div>
                                    </div>

                                    {/* Error summary */}
                                    {previewErrors.length > 0 && (
                                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 max-h-28 overflow-y-auto">
                                            <p className="text-xs font-bold text-red-700 mb-1.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Daftar Error:</p>
                                            {previewErrors.map((e, i) => <p key={i} className="text-xs text-red-600">• {e}</p>)}
                                        </div>
                                    )}

                                    {/* Preview table */}
                                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                                        <table className="w-full text-xs">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="p-2.5 text-left font-bold text-slate-600 w-10">No</th>
                                                    <th className="p-2.5 text-left font-bold text-slate-600 w-24">Kode PLO</th>
                                                    <th className="p-2.5 text-left font-bold text-slate-600">Deskripsi</th>
                                                    <th className="p-2.5 text-center font-bold text-slate-600 w-24">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {previewRows.map((row, idx) => (
                                                    <tr key={idx} className={`${!row.is_valid ? 'bg-red-50/60' : 'hover:bg-slate-50/50'}`}>
                                                        <td className="p-2.5 text-slate-400">{row.row}</td>
                                                        <td className="p-2.5 font-bold text-[#801720]">{row.kode_plo}</td>
                                                        <td className="p-2.5 text-slate-700">
                                                            <p className="line-clamp-2">{row.deskripsi}</p>
                                                            {row.errors?.length > 0 && (
                                                                <p className="text-red-500 mt-0.5 text-[10px]">⚠ {row.errors.join(' | ')}</p>
                                                            )}
                                                        </td>
                                                        <td className="p-2.5 text-center">
                                                            {row.is_valid
                                                                ? <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold inline-flex items-center gap-1"><Check className="w-3 h-3" /> Valid</span>
                                                                : <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold inline-flex items-center gap-1"><X className="w-3 h-3" /> Error</span>
                                                            }
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="flex gap-3">
                                        <button onClick={() => { setActiveStep(2); setSelectedFile(null); }} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1">
                                            <RotateCcw className="w-3.5 h-3.5" /> Ganti File
                                        </button>
                                        <button
                                            onClick={proceedToEdit}
                                            disabled={previewRows.length === 0}
                                            className="flex-1 py-2.5 bg-[#801720] text-white rounded-xl text-sm font-semibold hover:bg-[#6a1219] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Pencil className="w-4 h-4" /> Lanjut Edit & Konfirmasi
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Edit & Konfirmasi */}
                            {activeStep === 4 && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-slate-600">
                                            <span className="font-bold text-slate-800">{previewRows.filter(r => r.is_valid).length}</span> data valid dari <span className="font-bold">{previewRows.length}</span> baris. Edit langsung di bawah sebelum disimpan.
                                        </p>
                                        <button onClick={addRow} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-all">
                                            <Plus className="w-3.5 h-3.5" /> Tambah Baris
                                        </button>
                                    </div>

                                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
                                        <table className="w-full text-xs">
                                            <thead className="bg-slate-100 sticky top-0">
                                                <tr>
                                                    <th className="p-2.5 text-left font-bold text-slate-600 w-24">Kode PLO</th>
                                                    <th className="p-2.5 text-left font-bold text-slate-600">Deskripsi</th>
                                                    <th className="p-2.5 text-center font-bold text-slate-600 w-20">Status</th>
                                                    <th className="p-2.5 text-center font-bold text-slate-600 w-16">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {previewRows.map((row, idx) => (
                                                    <tr key={idx} className={`${!row.is_valid ? 'bg-red-50/40' : ''}`}>
                                                        <td className="p-2">
                                                            {editingRow === idx ? (
                                                                <input
                                                                    autoFocus
                                                                    defaultValue={row.kode_plo}
                                                                    onBlur={(e) => saveEditRow(idx, 'kode_plo', e.target.value)}
                                                                    className="w-full px-2 py-1 border border-[#801720] rounded-lg text-xs font-bold text-[#801720] focus:outline-none"
                                                                />
                                                            ) : (
                                                                <span className="font-bold text-[#801720]">{row.kode_plo || '—'}</span>
                                                            )}
                                                        </td>
                                                        <td className="p-2">
                                                            {editingRow === idx ? (
                                                                <textarea
                                                                    rows={2}
                                                                    defaultValue={row.deskripsi}
                                                                    onBlur={(e) => { saveEditRow(idx, 'deskripsi', e.target.value); setEditingRow(null); }}
                                                                    className="w-full px-2 py-1 border border-[#801720] rounded-lg text-xs focus:outline-none resize-none"
                                                                />
                                                            ) : (
                                                                <span className="text-slate-700 line-clamp-2">{row.deskripsi || '—'}</span>
                                                            )}
                                                            {row.errors?.length > 0 && <p className="text-red-500 text-[10px] mt-0.5">⚠ {row.errors.join(' | ')}</p>}
                                                        </td>
                                                        <td className="p-2 text-center">
                                                            {row.is_valid
                                                                ? <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">✓ Valid</span>
                                                                : <span className="px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold">✗ Error</span>
                                                            }
                                                        </td>
                                                        <td className="p-2">
                                                            <div className="flex items-center justify-center gap-1">
                                                                 <button onClick={() => startEditRow(idx)} title="Edit" className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer">
                                                                     <Pencil className="w-3 h-3" />
                                                                 </button>
                                                                <button onClick={() => deleteRow(idx)} title="Hapus" className="p-1 hover:bg-red-50 text-red-500 rounded">
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                                        <strong>Catatan:</strong> Baris dengan status Error tidak akan disimpan. Perbaiki atau hapus sebelum menyimpan.
                                        <br />Data valid yang akan disimpan: <strong>{previewRows.filter(r => r.is_valid).length}</strong> baris.
                                    </div>

                                    <div className="flex gap-3">
                                        <button onClick={() => setActiveStep(3)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
                                            ← Kembali ke Preview
                                        </button>
                                        <button
                                            onClick={handleConfirmImport}
                                            disabled={isConfirming || previewRows.filter(r => r.is_valid).length === 0}
                                            className="flex-1 py-2.5 bg-[#801720] text-white rounded-xl text-sm font-semibold hover:bg-[#6a1219] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                        >
                                            {isConfirming
                                                ? <><span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></span> Menyimpan...</>
                                                : <><Save className="w-4 h-4" /> Simpan {previewRows.filter(r => r.is_valid).length} Data PLO</>
                                            }
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ─── DELETE MODAL ─── */}
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
                                    Apakah Anda yakin ingin menghapus data PLO <strong className="text-slate-800 font-bold">{deletePlo.kode_plo}</strong>? Tindakan ini bersifat permanen.
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-6">
                            <button type="button" onClick={() => setDeletePlo(null)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer">
                                Batal
                            </button>
                            <button type="button" onClick={handleConfirmDelete} className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#801720] hover:bg-[#9B1724] transition-colors shadow-md cursor-pointer">
                                Ya, Hapus Data
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── CREATE MODAL ─── */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
                        <h2 className="text-lg font-extrabold text-[#1E293B] mb-4">Tambah Data PLO</h2>
                        <form onSubmit={handleCreateSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Kode PLO</label>
                                <input
                                    type="text"
                                    value={createForm.kode_plo}
                                    onChange={(e) => setCreateForm(f => ({ ...f, kode_plo: e.target.value }))}
                                    placeholder="Contoh: PLO01"
                                    required
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#801720]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Capaian</label>
                                <textarea
                                    rows="4"
                                    value={createForm.deskripsi}
                                    onChange={(e) => setCreateForm(f => ({ ...f, deskripsi: e.target.value }))}
                                    placeholder="Tuliskan deskripsi CPL / PLO..."
                                    required
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#801720]"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200">Batal</button>
                                <button type="submit" disabled={formProcessing} className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#801720] hover:bg-[#9B1724]">
                                    {formProcessing ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── EDIT MODAL ─── */}
            {editPlo && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
                        <h2 className="text-lg font-extrabold text-[#1E293B] mb-4">Edit Data PLO</h2>
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Kode PLO</label>
                                <input
                                    type="text"
                                    value={editForm.kode_plo}
                                    onChange={(e) => setEditForm(f => ({ ...f, kode_plo: e.target.value }))}
                                    required
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#801720]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Capaian</label>
                                <textarea
                                    rows="4"
                                    value={editForm.deskripsi}
                                    onChange={(e) => setEditForm(f => ({ ...f, deskripsi: e.target.value }))}
                                    required
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#801720]"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setEditPlo(null)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200">Batal</button>
                                <button type="submit" disabled={formProcessing} className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#801720] hover:bg-[#9B1724]">
                                    {formProcessing ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
