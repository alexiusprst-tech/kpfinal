import React, { useState, useEffect, useRef } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { showToast, showAlert, showConfirm } from '@/Utils/sweetalert';
import axios from 'axios';

import {
    Plus, Pencil, Trash2, Search, Download, Upload,
    AlertTriangle, X, Activity, FileSpreadsheet, Eye,
    ArrowRight, Check, CloudUpload, FileText, Save,
    RotateCcw, AlertCircle, CheckCircle2, ChevronDown,
    ChevronRight, BookOpen, Layers, Filter
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

import FlashAlert from '@/Components/FlashAlert';

// ─── Toast ─────────────────────────────────────────────────────────────────────

// ─── CLO Form (tambah/edit manual dengan alur berurutan) ────────────────────
function CloForm({ form, setForm, allPlo, allMk, onSubmit, processing }) {
    const [mkSearch, setMkSearch] = useState('');
    const filteredMk = allMk.filter(mk =>
        mk.nama_mk.toLowerCase().includes(mkSearch.toLowerCase()) ||
        mk.kode_mk.toLowerCase().includes(mkSearch.toLowerCase())
    );

    const selectedPloId = (form.plo_ids && form.plo_ids.length > 0) ? form.plo_ids[0] : '';
    const isPloSelected = Boolean(selectedPloId);

    const toggleMk = (id) => {
        const current = form.mk_ids || [];
        setForm(f => ({ ...f, mk_ids: current.includes(id) ? current.filter(x => x !== id) : [...current, id] }));
    };

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            {/* 1. Pilih PLO Terlebih Dahulu */}
            <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center justify-between">
                    <span>1. Pilih Program Learning Outcome (PLO) <span className="text-red-500">*</span></span>
                    {isPloSelected && (
                        <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> PLO Terpilih
                        </span>
                    )}
                </label>
                <select
                    value={selectedPloId}
                    onChange={e => {
                        const val = e.target.value;
                        setForm(f => ({ ...f, plo_ids: val ? [val] : [] }));
                    }}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] outline-none bg-white transition-all font-medium text-gray-800"
                    required
                >
                    <option value="">-- Pilih PLO --</option>
                    {allPlo.map(plo => (
                        <option key={plo.id} value={plo.id}>
                            {plo.kode_plo} {plo.deskripsi ? `— ${plo.deskripsi}` : ''}
                        </option>
                    ))}
                </select>
                <p className="text-[11px] text-gray-400 mt-1">Pilih capaian PLO yang menjadi acuan penyusunan CLO ini.</p>
            </div>

            {/* 2. Input Kode CLO */}
            <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                    2. Kode CLO <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={form.kode_clo || ''}
                    onChange={e => setForm(f => ({ ...f, kode_clo: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] outline-none transition-all"
                    placeholder="Contoh: PLO02-CLO01"
                    required
                />
                <p className="text-[11px] text-gray-400 mt-1">Format penamaan standar: [KODE_PLO]-[KODE_CLO].</p>
            </div>

            {/* 3. Input Deskripsi CLO */}
            <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                    3. Deskripsi CLO <span className="text-red-500">*</span>
                </label>
                <textarea
                    rows={3}
                    value={form.deskripsi || ''}
                    onChange={e => setForm(f => ({ ...f, deskripsi: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] outline-none resize-none transition-all"
                    placeholder="Tuliskan deskripsi capaian pembelajaran mata kuliah (CLO)..."
                    required
                />
            </div>

            {/* 4. Pilih Bloom Taxonomy */}
            <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                    4. Bloom Taxonomy <span className="text-red-500">*</span>
                </label>
                <select
                    value={form.bloom || ''}
                    onChange={e => setForm(f => ({ ...f, bloom: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] outline-none bg-white transition-all"
                    required
                >
                    <option value="">Pilih Level Bloom Taxonomy...</option>
                    {BLOOM_OPTIONS.map(b => (
                        <option key={b} value={b}>{b}</option>
                    ))}
                </select>
            </div>

            {/* 5. Terakhir, Pilih Mata Kuliah mana saja yang ingin dimasukkan */}
            <div>
                <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-700">
                        5. Mapping Mata Kuliah
                    </label>
                    <span className="text-[11px] font-semibold text-[#801720]">
                        {(form.mk_ids || []).length} MK Dipilih
                    </span>
                </div>

                <div className="border border-gray-200 rounded-2xl overflow-hidden bg-slate-50/50">
                    <div className="p-2 border-b border-gray-100 bg-white">
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                value={mkSearch}
                                onChange={e => setMkSearch(e.target.value)}
                                placeholder="Cari kode atau nama mata kuliah..."
                                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-xl outline-none focus:border-[#801720] focus:ring-1 focus:ring-[#801720]/20"
                            />
                        </div>
                    </div>
                    <div className="max-h-40 overflow-y-auto p-2 space-y-1">
                        {filteredMk.map(mk => {
                            const isChecked = (form.mk_ids || []).includes(mk.id);
                            return (
                                <label
                                    key={mk.id}
                                    className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                                        isChecked
                                            ? 'bg-red-50/50 border-[#801720]/30 text-gray-900 font-semibold'
                                            : 'bg-white border-gray-100 text-gray-700 hover:bg-slate-100/60'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => toggleMk(mk.id)}
                                            className="w-4 h-4 rounded text-[#801720] focus:ring-[#801720] accent-[#801720] cursor-pointer"
                                        />
                                        <span className="text-xs truncate">{mk.nama_mk}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400 flex-shrink-0 bg-gray-100 px-1.5 py-0.5 rounded">
                                        {mk.kode_mk}
                                    </span>
                                </label>
                            );
                        })}
                        {filteredMk.length === 0 && (
                            <p className="text-xs text-gray-400 text-center py-4">Mata kuliah tidak ditemukan.</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                    type="submit"
                    disabled={processing}
                    className="px-5 py-2.5 bg-[#801720] text-white rounded-xl text-sm font-semibold hover:bg-[#6a1219] disabled:opacity-50 transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                >
                    {processing ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Menyimpan...</span>
                        </>
                    ) : (
                        <span>Simpan</span>
                    )}
                </button>
            </div>
        </form>
    );
}

// ─── Modal Wrapper ─────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <h2 className="text-base font-bold text-gray-800">{title}</h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-5">{children}</div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CloIndex({ cloList, allPlo = [], allMk = [], flatMappings = [], totalMappings = 0, filters }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState(filters?.search || '');
    const [selectedPlo, setSelectedPlo] = useState(filters?.plo || '');
    const [mappingSearch, setMappingSearch] = useState('');

    // Filter flat mappings locally
    const filteredFlatMappings = flatMappings.filter(row => {
        if (selectedPlo && row.plo && !row.plo.includes(selectedPlo)) {
            return false;
        }
        if (!mappingSearch.trim()) return true;
        const q = mappingSearch.toLowerCase();
        return (
            (row.kode_clo && row.kode_clo.toLowerCase().includes(q)) ||
            (row.deskripsi && row.deskripsi.toLowerCase().includes(q)) ||
            (row.bloom && row.bloom.toLowerCase().includes(q)) ||
            (row.plo && row.plo.toLowerCase().includes(q)) ||
            (row.mk && row.mk.toLowerCase().includes(q))
        );
    });

    // Real-time reactive search with 300ms debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            const currentSearch = filters?.search || '';
            const currentPlo = filters?.plo || '';
            if (search !== currentSearch || selectedPlo !== currentPlo) {
                const params = {};
                if (search.trim()) params.search = search.trim();
                if (selectedPlo) params.plo = selectedPlo;
                router.get('/superadmin/clo', params, { preserveState: true, replace: true });
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [search, selectedPlo]);

    const handlePloSelect = (ploCode) => {
        const newPlo = selectedPlo === ploCode ? '' : ploCode;
        setSelectedPlo(newPlo);
        const params = {};
        if (search.trim()) params.search = search.trim();
        if (newPlo) params.plo = newPlo;
        router.get('/superadmin/clo', params, { preserveState: true, replace: true });
    };
    const [showAddModal, setShowAddModal] = useState(false);
    const [viewItem, setViewItem] = useState(null);
    const [editItem, setEditItem] = useState(null);
    const [deleteItem, setDeleteItem] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [form, setForm] = useState({ kode_clo: '', deskripsi: '', bloom: '', plo_ids: [], mk_ids: [] });

    // Import wizard states
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [activeStep, setActiveStep] = useState(1);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [previewRows, setPreviewRows] = useState([]);
    const [previewErrors, setPreviewErrors] = useState([]);
    const [previewStats, setPreviewStats] = useState(null);
    const [editingRow, setEditingRow] = useState(null);
    const [isConfirming, setIsConfirming] = useState(false);
    const fileInputRef = useRef(null);

    const steps = [
        { number: 1, label: 'Download Template' },
        { number: 2, label: 'Import File' },
        { number: 3, label: 'Validasi & Preview' },
        { number: 4, label: 'Edit & Konfirmasi' },
        { number: 5, label: 'Berhasil' },
    ];

    // ─── CRUD handlers ──────────────────────────────────────────────────────────
    const doSearch = (e) => {
        e.preventDefault();
    };

    const handleAdd = (e) => {
        e.preventDefault();
        setProcessing(true);
        router.post('/superadmin/clo', form, {
            onFinish: () => { setProcessing(false); setShowAddModal(false); setForm({ kode_clo: '', deskripsi: '', bloom: '', plo_ids: [], mk_ids: [] }); }
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
        setForm({
            kode_clo: item.kode_clo,
            deskripsi: item.deskripsi,
            bloom: item.bloom || '',
            plo_ids: item.plo?.map(p => p.id) || [],
            mk_ids: item.mataKuliah?.map(m => m.id) || [],
        });
        setEditItem(item);
    };

    // ─── Import wizard handlers ─────────────────────────────────────────────────
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
        const ext = file.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(ext)) {
            showAlert({
                title: 'Format File Tidak Didukung',
                text: 'Format file tidak didukung. Silakan gunakan .xlsx, .xls, atau .csv',
                icon: 'error',
            });
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
            const res = await axios.post('/superadmin/clo/preview', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const data = res.data;
            if (data.success) {
                setPreviewRows(data.rows);
                setPreviewErrors(data.errors || []);
                setPreviewStats({ total: data.totalRows, valid: data.validRows, error: data.errorRows });
                setActiveStep(3);
            } else {
                showAlert({
                    title: 'Gagal Memproses File',
                    text: data.message || 'Terjadi kesalahan saat memproses file import CLO.',
                    icon: 'error',
                });
            }
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Terjadi kesalahan saat menghubungi server.';
            showAlert({
                title: 'Terjadi Kesalahan',
                text: msg,
                icon: 'error',
            });
        } finally {
            setIsPreviewing(false);
        }
    };

    const proceedToEdit = () => {
        setActiveStep(4);
    };

    const saveEditRow = (idx, field, value) => {
        setPreviewRows(rows => rows.map((r, i) => {
            if (i !== idx) return r;
            return { ...r, [field]: value };
        }));
    };

    const deleteRow = (idx) => {
        setPreviewRows(rows => rows.filter((_, i) => i !== idx));
    };

    const handleConfirmImport = () => {
        const validRows = previewRows.filter(r => r.is_valid);
        if (validRows.length === 0) {
            showAlert({
                title: 'Tidak Ada Data Valid',
                text: 'Tidak ada data yang valid untuk disimpan.',
                icon: 'warning',
            });
            return;
        }
        setIsConfirming(true);
        router.post('/superadmin/clo/confirm', { rows: validRows }, {
            onSuccess: () => { setIsImportOpen(false); },
            onFinish: () => setIsConfirming(false),
        });
    };


    // ─── Grouped preview for mapping tree ─────────────────────────────────────
    const getMappingTree = () => {
        const tree = {};
        previewRows.filter(r => r.is_valid).forEach(row => {
            const plo = row.plo || 'Tanpa PLO';
            const clo = row.kode_clo;
            if (!tree[plo]) tree[plo] = {};
            if (!tree[plo][clo]) tree[plo][clo] = { deskripsi: row.deskripsi, bloom: row.bloom, mks: [] };
            if (row.mk) {
                const individualMks = row.mk.split(';').map(m => m.trim()).filter(Boolean);
                individualMks.forEach(mkName => {
                    if (!tree[plo][clo].mks.includes(mkName)) {
                        tree[plo][clo].mks.push(mkName);
                    }
                });
            }
        });
        return tree;
    };

    const bloomColor = (bloom) => {
        const level = parseInt(bloom?.[0] || '0');
        const colors = ['', 'bg-gray-100 text-gray-600', 'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-yellow-100 text-yellow-700', 'bg-orange-100 text-orange-700', 'bg-red-100 text-red-700'];
        return colors[level] || 'bg-gray-100 text-gray-600';
    };

    return (
        <AuthenticatedLayout title="Master CLO">
            <Head title="Master CLO" />
            <FlashAlert flash={flash} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
                            <Activity className="w-6 h-6 text-[#801720]" /> Master CLO
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">Kelola Course Learning Outcomes (CLO), Bloom Taxonomy, dan mapping ke PLO & Mata Kuliah</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <a href="/superadmin/clo/template" className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                            <Download className="w-3.5 h-3.5" /> Template
                        </a>
                        <button onClick={openImportWizard} className="flex items-center gap-1.5 px-3 py-2 border border-[#801720] text-[#801720] rounded-xl text-xs font-semibold cursor-pointer hover:bg-red-50 transition-all">
                            <Upload className="w-3.5 h-3.5" /> Import
                        </button>
                        <a href="/superadmin/clo/export" className="flex items-center gap-1.5 px-3 py-2 bg-gray-700 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-all">
                            <Download className="w-3.5 h-3.5" /> Export
                        </a>
                        <button onClick={() => { setForm({ kode_clo: '', deskripsi: '', bloom: '', plo_ids: [], mk_ids: [] }); setShowAddModal(true); }}
                            className="flex items-center gap-1.5 px-4 py-2 bg-[#801720] text-white rounded-xl text-xs font-semibold hover:bg-[#6a1219] transition-all shadow-sm">
                            <Plus className="w-3.5 h-3.5" /> Tambah CLO
                        </button>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-[#801720]/10 flex items-center justify-center flex-shrink-0">
                            <Activity className="w-5 h-5 text-[#801720]" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500">Master CLO</p>
                            <h3 className="text-xl font-extrabold text-slate-800">{cloList.total || 0} <span className="text-xs font-normal text-slate-400">Kode CLO</span></h3>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-violet-700" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500">Total Pemetaan Mata Kuliah</p>
                            <h3 className="text-xl font-extrabold text-slate-800">{flatMappings.length || totalMappings} <span className="text-xs font-normal text-slate-400">Baris Relasi</span></h3>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500">PLO Terpetakan</p>
                            <h3 className="text-xl font-extrabold text-slate-800">{allPlo.length || 0} <span className="text-xs font-normal text-slate-400">Kode PLO</span></h3>
                        </div>
                    </div>
                </div>

                {/* Filter Bar & Quick PLO Pills */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
                    {/* Search Input */}
                    <div className="relative max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Cari kode CLO, deskripsi, atau kata kunci..."
                            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] focus:bg-white outline-none transition-all"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Quick-Filter Horizontal Pills for PLO */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 scrollbar-thin">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1 flex-shrink-0">
                            <Layers className="w-3.5 h-3.5 text-[#801720]" /> Filter PLO:
                        </span>
                        <button
                            type="button"
                            onClick={() => handlePloSelect('')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                                !selectedPlo
                                    ? 'bg-[#801720] text-white shadow-sm shadow-red-900/20'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            Semua ({totalMappings > 0 ? (totalMappings === cloList.total ? cloList.total : 37) : 37})
                        </button>
                        {allPlo.map(plo => {
                            const isActive = selectedPlo === plo.kode_plo;
                            return (
                                <button
                                    key={plo.id}
                                    type="button"
                                    onClick={() => handlePloSelect(plo.kode_plo)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                                        isActive
                                            ? 'bg-[#801720] text-white shadow-sm shadow-red-900/20'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    <span>{plo.kode_plo}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Table Master CLO */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">No</th>
                                    <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Kode CLO</th>
                                    <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Deskripsi</th>
                                    <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Bloom</th>
                                    <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">PLO</th>
                                    <th className="text-right px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {cloList.data?.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">Tidak ada data CLO</td></tr>
                                ) : cloList.data?.map((item, idx) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4 text-gray-500 text-xs">{(cloList.current_page - 1) * cloList.per_page + idx + 1}</td>
                                        <td className="px-5 py-4 font-bold text-[#801720]">{item.kode_clo}</td>
                                        <td className="px-5 py-4 text-gray-700 max-w-xs">
                                            <p className="line-clamp-2 text-xs">{item.deskripsi}</p>
                                        </td>
                                        <td className="px-5 py-4">
                                            {item.bloom ? (
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${bloomColor(item.bloom)}`}>{item.bloom}</span>
                                            ) : <span className="text-xs text-gray-400">—</span>}
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
                                                <button
                                                    type="button"
                                                    onClick={() => setViewItem(item)}
                                                    className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors cursor-pointer"
                                                    title="Lihat Detail CLO & Mata Kuliah"
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
                                                    onClick={() => setDeleteItem(item)}
                                                    className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors cursor-pointer"
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
                    {cloList.links && (
                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                            <span className="text-xs text-slate-500 font-medium">
                                Menampilkan {cloList.from || 0} - {cloList.to || 0} dari {cloList.total || 0} CLO
                            </span>
                            <div className="flex gap-1">
                                {cloList.links.map((link, idx) => (
                                    <button
                                        key={idx}
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${link.active ? 'bg-[#801720] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── IMPORT WIZARD MODAL ─── */}
            {isImportOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
                        {/* Modal Header */}
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-[#801720]/5 to-white">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-[#801720]/10 flex items-center justify-center">
                                    <FileSpreadsheet className="w-5 h-5 text-[#801720]" />
                                </div>
                                <div>
                                    <h2 className="text-base font-extrabold text-slate-800">Import Data CLO & Mapping</h2>
                                    <p className="text-xs text-slate-500">Upload Excel → Validasi → Preview Mapping → Edit → Simpan</p>
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
                                            <FileText className="w-4 h-4" /> Format Template CLO
                                        </h3>
                                        <p className="text-xs text-blue-600 mb-3">Satu CLO dapat dipetakan ke satu atau banyak Mata Kuliah. Beberapa Mata Kuliah pada baris yang sama dapat dipisahkan dengan simbol titik koma (;).</p>
                                        <div className="bg-white rounded-xl border border-blue-200 overflow-hidden">
                                            <table className="w-full text-xs">
                                                <thead className="bg-[#801720] text-white">
                                                    <tr>
                                                        {['PLO', 'Kode CLO', 'CLO', 'Bloom', 'MK'].map(h => (
                                                            <th key={h} className="p-2.5 text-left font-bold">{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {[
                                                        ['PLO02', 'PLO02-CLO01', 'Mampu menganalisis kebutuhan sistem...', '4 - Analyze', 'Analisis Sistem; Basis Data'],
                                                        ['PLO02', 'PLO02-CLO02', 'Mampu mengembangkan solusi...', '6 - Create', 'Pemrograman Web; Proyek Perangkat Lunak'],
                                                    ].map((row, i) => (
                                                        <tr key={i} className="border-t border-blue-100">
                                                            {row.map((cell, j) => <td key={j} className="p-2.5 text-gray-600">{cell}</td>)}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <a href="/superadmin/clo/template"
                                            className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[#801720]/40 rounded-xl text-sm font-semibold text-[#801720] hover:bg-red-50 transition-all"
                                        >
                                            <Download className="w-4 h-4" /> Download Template Excel
                                        </a>
                                        <button onClick={() => setActiveStep(2)}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#801720] text-white rounded-xl text-sm font-semibold hover:bg-[#6a1219] transition-all">
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
                                            <button onClick={() => setSelectedFile(null)} className="text-emerald-500 hover:text-red-500"><X className="w-4 h-4" /></button>
                                        </div>
                                    )}
                                    <div className="flex gap-3">
                                        <button onClick={() => setActiveStep(1)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">← Kembali</button>
                                        <button
                                            onClick={handlePreview}
                                            disabled={!selectedFile || isPreviewing}
                                            className="flex-1 py-2.5 bg-[#801720] text-white rounded-xl text-sm font-semibold hover:bg-[#6a1219] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                        >
                                            {isPreviewing ? (<><span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></span> Memvalidasi...</>) : (<><Eye className="w-4 h-4" /> Validasi & Preview</>)}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Validasi & Preview Mapping */}
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

                                    {/* Mapping Tree (valid rows only) */}
                                    {previewStats.valid > 0 && (
                                        <div>
                                            <p className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> Preview Mapping PLO → CLO → Mata Kuliah:</p>
                                            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-3 space-y-2 max-h-52 overflow-y-auto">
                                                {Object.entries(getMappingTree()).map(([ploKey, clos]) => (
                                                    <div key={ploKey}>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold">{ploKey}</span>
                                                        </div>
                                                        {Object.entries(clos).map(([cloKey, cloData]) => (
                                                            <div key={cloKey} className="ml-4 mb-1.5">
                                                                <div className="flex items-start gap-2 flex-wrap">
                                                                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                                                                    <span className="px-1.5 py-0.5 bg-[#801720]/10 text-[#801720] rounded text-[10px] font-bold">{cloKey}</span>
                                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${bloomColor(cloData.bloom)}`}>{cloData.bloom}</span>
                                                                    <span className="text-xs text-slate-600 flex-1 min-w-0 truncate">{cloData.deskripsi}</span>
                                                                </div>
                                                                <div className="ml-8 flex flex-wrap gap-1 mt-1">
                                                                    {cloData.mks.map(mk => (
                                                                        <span key={mk} className="px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded text-[10px] font-semibold">📚 {mk}</span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Flat table */}
                                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                                        <table className="w-full text-xs">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    {['No', 'PLO', 'Kode CLO', 'Bloom', 'MK', 'Status'].map(h => (
                                                        <th key={h} className="p-2.5 text-left font-bold text-slate-600">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {previewRows.map((row, idx) => (
                                                    <tr key={idx} className={`${!row.is_valid ? 'bg-red-50/60' : 'hover:bg-slate-50/50'}`}>
                                                        <td className="p-2.5 text-slate-400">{row.row}</td>
                                                        <td className="p-2.5 font-bold text-blue-700">{row.plo}</td>
                                                        <td className="p-2.5 font-bold text-[#801720]">{row.kode_clo}</td>
                                                        <td className="p-2.5">
                                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${bloomColor(row.bloom)}`}>{row.bloom}</span>
                                                        </td>
                                                        <td className="p-2.5 text-slate-600">{row.mk}</td>
                                                        <td className="p-2.5">
                                                            {row.is_valid
                                                                ? <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">✓ Valid</span>
                                                                : <div>
                                                                    <span className="px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold">✗ Error</span>
                                                                    {row.errors?.map((e, i) => <p key={i} className="text-red-500 text-[10px] mt-0.5">• {e}</p>)}
                                                                  </div>
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
                                        <button onClick={proceedToEdit} disabled={previewRows.length === 0}
                                            className="flex-1 py-2.5 bg-[#801720] text-white rounded-xl text-sm font-semibold hover:bg-[#6a1219] disabled:opacity-50 transition-all flex items-center justify-center gap-2">
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
                                            <span className="font-bold text-slate-800">{previewRows.filter(r => r.is_valid).length}</span> baris valid. Edit inline lalu simpan.
                                        </p>
                                    </div>

                                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
                                        <table className="w-full text-xs">
                                            <thead className="bg-slate-100 sticky top-0">
                                                <tr>
                                                    {['PLO', 'Kode CLO', 'CLO', 'Bloom', 'MK', 'Status', 'Aksi'].map(h => (
                                                        <th key={h} className="p-2.5 text-left font-bold text-slate-600">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {previewRows.map((row, idx) => (
                                                    <tr key={idx} className={`${!row.is_valid ? 'bg-red-50/40' : ''}`}>
                                                        <td className="p-2">
                                                            {editingRow === idx
                                                                ? <input defaultValue={row.plo} onBlur={e => saveEditRow(idx, 'plo', e.target.value)} className="w-20 px-1 py-0.5 border border-[#801720] rounded text-xs font-bold focus:outline-none" />
                                                                : <span className="font-bold text-blue-700">{row.plo}</span>
                                                            }
                                                        </td>
                                                        <td className="p-2">
                                                            {editingRow === idx
                                                                ? <input defaultValue={row.kode_clo} onBlur={e => saveEditRow(idx, 'kode_clo', e.target.value)} className="w-24 px-1 py-0.5 border border-[#801720] rounded text-xs font-bold text-[#801720] focus:outline-none" />
                                                                : <span className="font-bold text-[#801720]">{row.kode_clo}</span>
                                                            }
                                                        </td>
                                                        <td className="p-2 max-w-xs">
                                                            {editingRow === idx
                                                                ? <textarea rows={2} defaultValue={row.deskripsi} onBlur={e => saveEditRow(idx, 'deskripsi', e.target.value)} className="w-full px-1 py-0.5 border border-[#801720] rounded text-xs focus:outline-none resize-none" />
                                                                : <span className="line-clamp-2">{row.deskripsi}</span>
                                                            }
                                                        </td>
                                                        <td className="p-2">
                                                            {editingRow === idx
                                                                ? <select defaultValue={row.bloom} onBlur={e => saveEditRow(idx, 'bloom', e.target.value)} className="w-28 px-1 py-0.5 border border-[#801720] rounded text-xs focus:outline-none">
                                                                    {BLOOM_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                                                                  </select>
                                                                : <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${bloomColor(row.bloom)}`}>{row.bloom}</span>
                                                            }
                                                        </td>
                                                        <td className="p-2">
                                                            {editingRow === idx
                                                                ? <input defaultValue={row.mk} onBlur={e => saveEditRow(idx, 'mk', e.target.value)} className="w-28 px-1 py-0.5 border border-[#801720] rounded text-xs focus:outline-none" />
                                                                : <span className="text-violet-700 font-semibold">{row.mk}</span>
                                                            }
                                                        </td>
                                                        <td className="p-2">
                                                            {row.is_valid
                                                                ? <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">✓ Valid</span>
                                                                : <span className="px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold">✗ Error</span>
                                                            }
                                                        </td>
                                                        <td className="p-2">
                                                            <div className="flex items-center gap-1">
                                                                <button onClick={() => editingRow === idx ? setEditingRow(null) : setEditingRow(idx)} title="Edit" className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer">
                                                                    {editingRow === idx ? <Save className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
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
                                        <strong>Catatan:</strong> Baris Error tidak akan disimpan. Data valid yang akan disimpan: <strong>{previewRows.filter(r => r.is_valid).length}</strong> baris (digroup menjadi CLO unik dengan mapping PLO & MK).
                                    </div>

                                    <div className="flex gap-3">
                                        <button onClick={() => setActiveStep(3)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">← Kembali</button>
                                        <button
                                            onClick={handleConfirmImport}
                                            disabled={isConfirming || previewRows.filter(r => r.is_valid).length === 0}
                                            className="flex-1 py-2.5 bg-[#801720] text-white rounded-xl text-sm font-semibold hover:bg-[#6a1219] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                        >
                                            {isConfirming
                                                ? <><span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></span> Menyimpan...</>
                                                : <><Save className="w-4 h-4" /> Simpan Data CLO & Mapping</>
                                            }
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* View Detail Modal */}
            <Modal open={!!viewItem} onClose={() => setViewItem(null)} title={`Detail CLO: ${viewItem?.kode_clo || ''}`}>
                <div className="space-y-5">
                    {/* Ringkasan CLO */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <span className="text-base font-extrabold text-[#801720]">{viewItem?.kode_clo}</span>
                                {viewItem?.bloom && (
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${bloomColor(viewItem.bloom)}`}>
                                        {viewItem.bloom}
                                    </span>
                                )}
                            </div>
                            {viewItem?.plo && viewItem.plo.length > 0 && (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs text-gray-500 font-semibold">PLO:</span>
                                    {viewItem.plo.map(p => (
                                        <span key={p.id} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md text-[11px] font-bold">
                                            {p.kode_plo}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Deskripsi Capaian:</p>
                            <p className="text-xs text-gray-800 leading-relaxed font-medium bg-white p-3 rounded-xl border border-gray-200/80">
                                {viewItem?.deskripsi || 'Tidak ada deskripsi.'}
                            </p>
                        </div>
                    </div>

                    {/* Daftar Mata Kuliah */}
                    <div>
                        <div className="flex items-center justify-between mb-2.5">
                            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-[#801720]" />
                                <span>Mata Kuliah Terkait ({viewItem?.mataKuliah?.length || 0})</span>
                            </h3>
                            <span className="text-[11px] text-gray-500 font-medium">
                                Daftar mata kuliah yang menerapkan CLO ini
                            </span>
                        </div>

                        {!viewItem?.mataKuliah || viewItem.mataKuliah.length === 0 ? (
                            <div className="p-6 text-center rounded-2xl border border-dashed border-gray-200 bg-slate-50/50 space-y-2">
                                <BookOpen className="w-8 h-8 text-gray-300 mx-auto" />
                                <p className="text-xs font-bold text-gray-700">Belum Ada Mata Kuliah</p>
                                <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
                                    CLO ini belum dipetakan ke mata kuliah mana pun. Anda dapat menambahkan pemetaan melalui tombol edit di bawah.
                                </p>
                            </div>
                        ) : (
                            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-xs">
                                <div className="max-h-60 overflow-y-auto divide-y divide-gray-100">
                                    {viewItem.mataKuliah.map((mk, i) => (
                                        <div key={mk.id || i} className="p-3 bg-white hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="w-6 h-6 rounded-lg bg-red-50 text-[#801720] text-xs font-bold flex items-center justify-center flex-shrink-0">
                                                    {i + 1}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-gray-800 truncate">{mk.nama_mk}</p>
                                                    <p className="text-[10px] text-gray-400 font-medium">
                                                        Kode: <strong className="text-gray-600 font-semibold">{mk.kode_mk}</strong>
                                                        {mk.sks && ` · ${mk.sks} SKS`}
                                                        {mk.semester && ` · Semester ${mk.semester}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold flex-shrink-0">
                                                Terpetakan
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Action */}
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => {
                                const itm = viewItem;
                                setViewItem(null);
                                openEdit(itm);
                            }}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                            <Pencil className="w-3.5 h-3.5" /> Edit CLO & Pemetaan
                        </button>

                        <button
                            type="button"
                            onClick={() => setViewItem(null)}
                            className="px-4 py-2 bg-[#801720] hover:bg-[#6a1219] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Add Modal */}
            <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Tambah CLO">
                <CloForm form={form} setForm={setForm} allPlo={allPlo} allMk={allMk || []} onSubmit={handleAdd} processing={processing} />
            </Modal>

            {/* Edit Modal */}
            <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit CLO">
                <CloForm form={form} setForm={setForm} allPlo={allPlo} allMk={allMk || []} onSubmit={handleEdit} processing={processing} />
            </Modal>

            {/* Delete Confirm */}
            <Modal open={!!deleteItem} onClose={() => setDeleteItem(null)} title="Hapus CLO">
                <div className="flex items-start gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-800">Hapus <span className="text-[#801720]">{deleteItem?.kode_clo}</span>?</p>
                        <p className="text-xs text-gray-500 mt-1">Data CLO ini beserta seluruh mapping PLO dan Mata Kuliah akan dihapus permanen.</p>
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
