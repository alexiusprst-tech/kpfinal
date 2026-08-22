import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import axios from 'axios';
import {
    ArrowLeft, Upload, FileText, X, CheckCircle2, AlertTriangle, XCircle,
    Plus, Trash2, Download, MoveUp, MoveDown, Sparkles
} from 'lucide-react';

const ALLOWED_EXT = ['pdf', 'doc', 'docx'];
const MAX_SIZE_MB = 20;

function formatSize(bytes) {
    if (!bytes) return '0 KB';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

import FlashAlert from '@/Components/FlashAlert';
import { showToast, showAlert, showConfirm } from '@/Utils/sweetalert';

function Toast({ flash }) {
    return <FlashAlert type="toast" flash={flash} />;
}


export default function SoalCreate({ assignments, kategoriAll, defaultKategori, activePeriode, selectedMataKuliahId, uploadOpen }) {
    const { flash } = usePage().props;
    const [activeTab, setActiveTab] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('tab') === 'generator' ? 'generator' : 'upload';
    });
    const [clientError, setClientError] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    // Determine the fixed category based on the active period (UTS during UTS period, UAS during UAS period)
    const isUasPeriod = Boolean(
        activePeriode?.nama?.toLowerCase().includes('uas') ||
        activePeriode?.nama?.toLowerCase().includes('akhir')
    );

    const fixedCategory = defaultKategori || (() => {
        if (!kategoriAll || kategoriAll.length === 0) return null;
        if (isUasPeriod) {
            return kategoriAll.find(k => k.nama.toLowerCase().includes('uas') || (k.deskripsi && k.deskripsi.toLowerCase().includes('akhir'))) || kategoriAll[0];
        }
        return kategoriAll.find(k => k.nama.toLowerCase().includes('uts') || (k.deskripsi && k.deskripsi.toLowerCase().includes('tengah'))) || kategoriAll[0];
    })();

    // Form data for the file uploader
    const { data, setData, post, processing, errors } = useForm({
        mata_kuliah_id: selectedMataKuliahId || (assignments[0]?.id ?? ''),
        periode_id: activePeriode?.id || '',
        kategori_id: fixedCategory?.id || '',
        judul: '',
        file: null,
        submit_now: true,
    });

    useEffect(() => {
        if (fixedCategory?.id && data.kategori_id !== fixedCategory.id) {
            setData('kategori_id', fixedCategory.id);
        }
        if (activePeriode?.id && data.periode_id !== activePeriode.id) {
            setData('periode_id', activePeriode.id);
        }
    }, [fixedCategory?.id, activePeriode?.id]);

    const selectedMk = assignments.find(a => a.id === data.mata_kuliah_id);

    // --- Generator States ---
    const [generatorData, setGeneratorData] = useState(null);
    const [originalPloList, setOriginalPloList] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState('');

    // Fetch generator course data (PLO/CLO) dynamically when tab or course changes
    useEffect(() => {
        if (activeTab === 'generator' && data.mata_kuliah_id) {
            setIsLoadingData(true);
            setExportError('');
            axios.get(`/koordinator/soal-generator/course-data?mata_kuliah_id=${data.mata_kuliah_id}`)
                .then(res => {
                    const allPlos = res.data.plo || [];
                    setOriginalPloList(allPlos);
                    // Display only 1 PLO initially, rest can be added by dosen as requested
                    const initialPlos = allPlos.length > 0 ? [JSON.parse(JSON.stringify(allPlos[0]))] : [];
                    setGeneratorData({
                        ...res.data,
                        plo: initialPlos
                    });
                })
                .catch(err => {
                    console.error(err);
                    setExportError('Gagal mengambil data PLO/CLO untuk mata kuliah ini.');
                })
                .finally(() => {
                    setIsLoadingData(false);
                });
        }
    }, [activeTab, data.mata_kuliah_id]);

    // --- File Upload Handlers ---
    const validateFile = (file) => {
        const ext = file.name.split('.').pop().toLowerCase();
        if (!ALLOWED_EXT.includes(ext)) {
            return 'Format file harus PDF, DOC, atau DOCX.';
        }
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            return `Ukuran file maksimal ${MAX_SIZE_MB} MB.`;
        }
        return null;
    };

    const handleFile = (file) => {
        if (!file) return;
        const err = validateFile(file);
        if (err) {
            setClientError(err);
            return;
        }
        setClientError('');
        setData('file', file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        handleFile(e.dataTransfer.files?.[0]);
    };

    const handleSubmitUpload = (e) => {
        e?.preventDefault();
        if (!data.mata_kuliah_id) return setClientError('Pilih mata kuliah terlebih dahulu.');
        if (!data.kategori_id) return setClientError('Pilih kategori soal terlebih dahulu.');
        if (!data.judul.trim()) return setClientError('Judul soal wajib diisi.');
        if (!data.file) return setClientError('File soal wajib diunggah.');
        setClientError('');
        post('/koordinator/soal', { forceFormData: true });
    };

    // --- Generator Form Handlers ---
    const handleHeaderChange = (field, value) => {
        setGeneratorData(prev => prev ? { ...prev, [field]: value } : null);
    };

    const handlePetunjukChange = (index, value) => {
        setGeneratorData(prev => {
            if (!prev) return null;
            const list = [...prev.petunjuk_pengerjaan];
            list[index] = value;
            return { ...prev, petunjuk_pengerjaan: list };
        });
    };

    const addPetunjuk = () => {
        setGeneratorData(prev => {
            if (!prev) return null;
            return {
                ...prev,
                petunjuk_pengerjaan: [...prev.petunjuk_pengerjaan, '']
            };
        });
    };

    const removePetunjuk = (index) => {
        setGeneratorData(prev => {
            if (!prev) return null;
            const list = prev.petunjuk_pengerjaan.filter((_, i) => i !== index);
            return { ...prev, petunjuk_pengerjaan: list };
        });
    };

    const movePetunjuk = (index, direction) => {
        setGeneratorData(prev => {
            if (!prev) return null;
            const list = [...prev.petunjuk_pengerjaan];
            const targetIndex = index + direction;
            if (targetIndex < 0 || targetIndex >= list.length) return prev;
            
            const temp = list[index];
            list[index] = list[targetIndex];
            list[targetIndex] = temp;
            return { ...prev, petunjuk_pengerjaan: list };
        });
    };

    const handlePloChange = (ploIndex, field, value) => {
        setGeneratorData(prev => {
            if (!prev) return null;
            const plos = [...prev.plo];
            plos[ploIndex] = { ...plos[ploIndex], [field]: value };
            return { ...prev, plo: plos };
        });
    };

    const handleCloChange = (ploIndex, cloIndex, field, value) => {
        setGeneratorData(prev => {
            if (!prev) return null;
            const plos = [...prev.plo];
            const clos = [...plos[ploIndex].clo];
            clos[cloIndex] = { ...clos[cloIndex], [field]: value };
            plos[ploIndex] = { ...plos[ploIndex], clo: clos };
            return { ...prev, plo: plos };
        });
    };

    const handlePloSelect = (ploIndex, targetPloKode) => {
        const targetPlo = originalPloList.find(p => p.kode === targetPloKode);
        if (targetPlo) {
            setGeneratorData(prev => {
                if (!prev) return null;
                const plos = [...prev.plo];
                plos[ploIndex] = {
                    ...plos[ploIndex],
                    kode: targetPlo.kode,
                    deskripsi: targetPlo.deskripsi,
                    clo: targetPlo.clo && targetPlo.clo.length > 0 ? [JSON.parse(JSON.stringify(targetPlo.clo[0]))] : []
                };
                return { ...prev, plo: plos };
            });
        }
    };

    const handleCloSelect = (ploIndex, cloIndex, targetCloKode) => {
        const currentPlo = generatorData.plo[ploIndex];
        const originalPlo = originalPloList.find(p => p.kode === currentPlo.kode);
        if (!originalPlo) return;
        
        const targetClo = originalPlo.clo.find(c => c.kode === targetCloKode);
        if (targetClo) {
            setGeneratorData(prev => {
                if (!prev) return null;
                const plos = [...prev.plo];
                const clos = [...plos[ploIndex].clo];
                clos[cloIndex] = {
                    ...clos[cloIndex],
                    kode: targetClo.kode,
                    deskripsi: targetClo.deskripsi
                };
                plos[ploIndex] = { ...plos[ploIndex], clo: clos };
                return { ...prev, plo: plos };
            });
        }
    };

    const addPlo = () => {
        if (!generatorData || !originalPloList.length) return;
        
        const currentKodes = generatorData.plo.map(p => p.kode);
        const nextPlo = originalPloList.find(p => !currentKodes.includes(p.kode));
        
        if (nextPlo) {
            setGeneratorData(prev => ({
                ...prev,
                plo: [...prev.plo, JSON.parse(JSON.stringify(nextPlo))]
            }));
        } else {
            showToast('info', 'Semua PLO dari mata kuliah ini sudah ditambahkan.');
        }
    };

    const removePlo = (ploIdx) => {
        setGeneratorData(prev => {
            if (!prev) return null;
            const plos = prev.plo.filter((_, i) => i !== ploIdx);
            return { ...prev, plo: plos };
        });
    };

    const addClo = (ploIdx) => {
        if (!generatorData || !originalPloList.length) return;
        
        const currentPlo = generatorData.plo[ploIdx];
        const originalPlo = originalPloList.find(p => p.kode === currentPlo.kode);
        if (!originalPlo) return;
        
        const currentCloKodes = currentPlo.clo.map(c => c.kode);
        const nextClo = originalPlo.clo.find(c => !currentCloKodes.includes(c.kode));
        
        if (nextClo) {
            setGeneratorData(prev => {
                const plos = [...prev.plo];
                plos[ploIdx] = {
                    ...plos[ploIdx],
                    clo: [...plos[ploIdx].clo, JSON.parse(JSON.stringify(nextClo))]
                };
                return { ...prev, plo: plos };
            });
        } else {
            showToast('info', 'Semua CLO untuk PLO ini sudah ditambahkan.');
        }
    };


    const removeClo = (ploIdx, cloIdx) => {
        setGeneratorData(prev => {
            if (!prev) return null;
            const plos = [...prev.plo];
            const clos = plos[ploIdx].clo.filter((_, i) => i !== cloIdx);
            plos[ploIdx] = { ...plos[ploIdx], clo: clos };
            return { ...prev, plo: plos };
        });
    };

    const getPloWeight = (ploItem) => {
        if (!ploItem || !ploItem.clo) return 0;
        return ploItem.clo.reduce((acc, c) => acc + (parseInt(c.bobot_lo) || 0), 0);
    };

    const plosWeightInfo = useMemo(() => {
        if (!generatorData?.plo || generatorData.plo.length === 0) return [];
        return generatorData.plo.map(p => {
            const weight = getPloWeight(p);
            return {
                kode: p.kode,
                weight,
                isValid: weight === 100,
            };
        });
    }, [generatorData?.plo]);

    const isWeightValid = useMemo(() => {
        if (!plosWeightInfo || plosWeightInfo.length === 0) return false;
        return plosWeightInfo.every(p => p.isValid);
    }, [plosWeightInfo]);

    const handleExport = (type) => {
        if (!generatorData) return;
        setIsExporting(true);
        setExportError('');
        axios.post(`/koordinator/soal-generator/export-${type}`, generatorData, {
            responseType: 'blob'
        })
        .then(response => {
            const blob = new Blob([response.data], { type: response.headers['content-type'] });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const ext = type === 'pdf' ? 'pdf' : 'doc';
            const cleanMk = generatorData.kode_nama_mk.replace(/[\/\\?%*:|"<>\s]+/g, '_');
            link.setAttribute('download', `Lembar_Soal_${cleanMk}.${ext}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        })
        .catch(err => {
            console.error(err);
            setExportError('Gagal melakukan ekspor dokumen. Pastikan semua data terisi dengan format benar.');
        })
        .finally(() => {
            setIsExporting(false);
        });
    };

    let previewQuestionIndex = 1;

    // Dynamic width container based on active tab
    const containerClass = activeTab === 'generator' ? 'max-w-[1600px]' : 'max-w-xl';

    if (!uploadOpen) {
        return (
            <AuthenticatedLayout title="Upload Soal">
                <Head title="Upload Soal" />
                <div className="max-w-lg mx-auto mt-10 bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                    <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                    <h1 className="font-bold text-gray-800">Upload Soal Tidak Tersedia</h1>
                    <p className="text-sm text-gray-500 mt-2">
                        Periode verifikasi tidak sedang aktif atau deadline upload sudah lewat. Hubungi Super Admin jika Anda memerlukan perpanjangan.
                    </p>
                    <Link href="/koordinator/dashboard" className="inline-flex items-center gap-1.5 mt-5 px-4 py-2 bg-[#801720] text-white rounded-xl text-xs font-semibold hover:bg-[#6a1219]">
                        <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Dashboard
                    </Link>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout title="Kelola Lembar Soal">
            <Head title="Kelola Lembar Soal" />
            <Toast flash={flash} />

            <div className={`${containerClass} mx-auto pt-4 pb-10 transition-all duration-350`}>
                
                {/* Upper Breadcrumbs */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <Link href={selectedMk ? `/koordinator/mata-kuliah/${selectedMk.id}` : '/koordinator/dashboard'}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#801720] transition-colors">
                        <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Detail Mata Kuliah
                    </Link>

                    {activeTab === 'generator' && (
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                            isWeightValid ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'
                        }`}>
                            {isWeightValid ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                            )}
                            <span>
                                {isWeightValid
                                    ? 'Bobot per PLO: 100% (Valid)'
                                    : `Bobot per PLO: ${plosWeightInfo.filter(p => p.isValid).length}/${plosWeightInfo.length} Valid (Harus 100% per PLO)`
                                }
                            </span>
                        </div>
                    )}
                </div>

                {/* Unified Tab Selector */}
                <div className="flex bg-slate-100/80 border border-slate-200/40 p-1 rounded-2xl mb-6 max-w-md mx-auto shadow-xs">
                    <button
                        type="button"
                        onClick={() => setActiveTab('upload')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-extrabold rounded-xl transition-all select-none cursor-pointer ${
                            activeTab === 'upload'
                                ? 'bg-white text-slate-800 shadow-xs'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <Upload className="w-3.5 h-3.5" /> Upload File Soal
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('generator')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-extrabold rounded-xl transition-all select-none cursor-pointer ${
                            activeTab === 'generator'
                                ? 'bg-white text-slate-800 shadow-xs'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Generator Lembar Soal
                    </button>
                </div>

                {/* TAB CONTENT: UPLOAD */}
                {activeTab === 'upload' && (
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden max-w-xl mx-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                            <div>
                                <h2 className="text-base font-extrabold text-slate-800">Upload Soal Baru</h2>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                    Pastikan berkas soal yang diunggah telah sesuai dengan format template lembar soal yang dibuat.
                                </p>
                            </div>
                            <Link
                                href={selectedMk ? `/koordinator/mata-kuliah/${selectedMk.id}` : '/koordinator/dashboard'}
                                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </Link>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleSubmitUpload} className="p-6 space-y-4">
                            
                            {/* Info Banner Template Reminder */}
                            <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 flex items-start gap-3 text-xs">
                                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div className="space-y-0.5">
                                    <p className="font-bold text-amber-900">Petunjuk Format Berkas</p>
                                    <p className="text-amber-700/90 text-[11px] leading-relaxed">
                                        Pastikan lembar soal ujian telah mengikuti format template baku yang digenerate dari tab <strong>Generator Lembar Soal</strong> agar proses verifikasi berjalan lancar.
                                    </p>
                                </div>
                            </div>
                            
                            {/* Mata Kuliah Field */}
                            <div>
                                <label className="text-[13px] font-bold text-slate-700 block mb-1.5">
                                    Mata Kuliah <span className="text-red-500">*</span>
                                </label>
                                {assignments.length > 1 ? (
                                    <div className="relative">
                                        <select
                                            value={data.mata_kuliah_id}
                                            onChange={e => setData('mata_kuliah_id', e.target.value)}
                                            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#801720]/20 transition-all cursor-pointer appearance-none font-medium"
                                            style={{
                                                backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
                                                backgroundPosition: 'right 0.85rem center',
                                                backgroundSize: '1.25rem',
                                                backgroundRepeat: 'no-repeat',
                                                paddingRight: '2.5rem'
                                            }}
                                        >
                                            {assignments.map(a => (
                                                <option key={a.id} value={a.id}>{a.kode_mk ? `${a.kode_mk} - ` : ''}{a.nama_mk}</option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between border border-slate-200 bg-slate-50/80 rounded-xl px-3.5 py-2.5">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-xs font-bold text-slate-800 truncate">
                                                {assignments[0]?.nama_mk || 'Tidak ada mata kuliah'}
                                            </span>
                                            {assignments[0]?.kode_mk && (
                                                <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-200/80 text-slate-700 rounded-md">
                                                    {assignments[0].kode_mk}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[11px] font-semibold text-slate-400">Koordinator MK</span>
                                    </div>
                                )}
                                {errors.mata_kuliah_id && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.mata_kuliah_id}</p>}
                            </div>

                            {/* Periode Field (Fixed real-time following academic calendar) */}
                            <div>
                                <label className="text-[13px] font-bold text-slate-700 block mb-1.5">
                                    Periode <span className="text-red-500">*</span>
                                </label>
                                <div className="flex items-center justify-between border border-slate-200 bg-slate-50/80 rounded-xl px-3.5 py-2.5">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-xs font-semibold text-slate-800 truncate">
                                            {activePeriode?.nama || 'Tidak ada periode aktif'}
                                        </span>
                                        {activePeriode?.status === 'ACTIVE' && (
                                            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-md">
                                                Aktif
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[11px] font-semibold text-slate-400">Kalender Akademik</span>
                                </div>
                                {errors.periode_id && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.periode_id}</p>}
                            </div>

                            {/* Kategori Soal Field (Fixed following active period: UTS / UAS) */}
                            <div>
                                <label className="text-[13px] font-bold text-slate-700 block mb-1.5">
                                    Kategori Soal <span className="text-red-500">*</span>
                                </label>
                                <div className="flex items-center justify-between border border-slate-200 bg-slate-50/80 rounded-xl px-3.5 py-2.5">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-xs font-bold text-slate-800">
                                            {isUasPeriod ? 'Ujian Akhir Semester (UAS)' : 'Ujian Tengah Semester (UTS)'}
                                        </span>
                                    </div>
                                    <span className="px-2 py-0.5 text-[10px] font-bold bg-[#801720]/10 text-[#801720] rounded-md flex-shrink-0">
                                        Sesuai Periode ({isUasPeriod ? 'UAS' : 'UTS'})
                                    </span>
                                </div>
                                {errors.kategori_id && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.kategori_id}</p>}
                            </div>

                            {/* Judul Soal Field */}
                            <div>
                                <label className="text-[13px] font-bold text-slate-700 block mb-1.5">
                                    Judul Soal <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.judul}
                                    onChange={e => setData('judul', e.target.value)}
                                    placeholder={
                                        activePeriode?.nama?.toLowerCase().includes('uas')
                                            ? `Contoh: Soal UAS ${selectedMk?.nama_mk || 'Mata Kuliah'}`
                                            : `Contoh: Soal UTS ${selectedMk?.nama_mk || 'Mata Kuliah'}`
                                    }
                                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#801720]/20 transition-all font-medium"
                                />
                                {errors.judul && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.judul}</p>}
                            </div>

                            {/* File Soal Zone */}
                            <div>
                                <label className="text-[13px] font-bold text-slate-700 block">
                                    File Soal <span className="text-red-500">*</span>
                                </label>
                                <div
                                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`mt-1.5 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                                        dragOver ? 'border-[#801720] bg-[#801720]/5' : 'border-slate-200 hover:border-slate-350 bg-slate-50/40'
                                    }`}
                                >
                                    <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
                                        onChange={e => handleFile(e.target.files?.[0])} />
                                    {data.file ? (
                                        <div className="flex items-center justify-center gap-3">
                                            <FileText className="w-8 h-8 text-[#801720] flex-shrink-0" />
                                            <div className="text-left min-w-0">
                                                <p className="text-xs font-bold text-slate-800 truncate max-w-[240px]">{data.file.name}</p>
                                                <p className="text-[10px] text-slate-400 font-semibold">{formatSize(data.file.size)}</p>
                                            </div>
                                            <button type="button" onClick={(e) => { e.stopPropagation(); setData('file', null); }}
                                                className="p-1 rounded-lg hover:bg-slate-200/50 transition-colors">
                                                <X className="w-4 h-4 text-slate-450" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-2 text-slate-500">
                                            <Upload className="w-6 h-6 text-slate-400 mb-2" />
                                            <p className="text-xs font-semibold text-slate-600">Klik untuk pilih file PDF/DOC/DOCX (maks. 20MB)</p>
                                        </div>
                                    )}
                                </div>
                                {errors.file && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.file}</p>}
                            </div>

                            {/* Error Alert Banner */}
                            {clientError && (
                                <div className="flex items-center gap-2 text-[11px] text-red-700 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
                                    <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {clientError}
                                </div>
                            )}

                            {/* Bottom Actions Row */}
                            <div className="flex justify-end pt-3">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-6 py-2.5 rounded-xl bg-[#801720] hover:bg-[#6a1219] text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 select-none cursor-pointer"
                                >
                                    {processing ? 'Mengunggah...' : 'Upload Soal'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* TAB CONTENT: GENERATOR */}
                {activeTab === 'generator' && (
                    <>
                        {exportError && (
                            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                {exportError}
                            </div>
                        )}

                        {isLoadingData ? (
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-16 text-center max-w-xl mx-auto">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#801720] mx-auto mb-4"></div>
                                <p className="text-xs text-slate-500 font-bold">Mengambil data PLO &amp; CLO mata kuliah...</p>
                            </div>
                        ) : generatorData ? (
                            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                                
                                {/* Left Column: Form Editor (xl:span-5) */}
                                <div className="xl:col-span-5 space-y-5 max-h-[80vh] overflow-y-auto pr-1">
                                    
                                    {/* Box 1: Informasi Ujian */}
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                                        <h2 className="text-xs font-extrabold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-2">
                                            <Sparkles className="w-4 h-4 text-amber-500" /> Informasi Lembar Ujian
                                        </h2>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                            <div className="sm:col-span-2">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mata Kuliah</label>
                                                {assignments.length > 1 ? (
                                                    <select
                                                        value={data.mata_kuliah_id}
                                                        onChange={e => setData('mata_kuliah_id', e.target.value)}
                                                        className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#801720]/20 bg-white font-medium cursor-pointer"
                                                    >
                                                        {assignments.map(a => (
                                                            <option key={a.id} value={a.id}>{a.kode_mk ? `${a.kode_mk} - ` : ''}{a.nama_mk}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <div className="mt-1 flex items-center justify-between border border-gray-100 bg-gray-50 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800">
                                                        <span>{assignments[0]?.nama_mk || '-'}</span>
                                                        {assignments[0]?.kode_mk && (
                                                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gray-200 text-gray-700 rounded">
                                                                {assignments[0].kode_mk}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="sm:col-span-2">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nama Evaluasi</label>
                                                <div className="mt-1 flex items-center justify-between border border-gray-200 bg-gray-50/80 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800">
                                                    <span>{generatorData.nama_evaluasi || (activePeriode?.nama?.toLowerCase().includes('uas') ? 'Ujian Akhir Semester (UAS)' : 'Ujian Tengah Semester (UTS)')}</span>
                                                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#801720]/10 text-[#801720] rounded flex-shrink-0">
                                                        Sesuai Periode ({activePeriode?.nama?.toLowerCase().includes('uas') ? 'UAS' : 'UTS'})
                                                    </span>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Kode Dosen</label>
                                                <div className="mt-1 flex items-center justify-between border border-gray-200 bg-gray-50/80 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800">
                                                    <span>{generatorData.kode_dosen || '-'}</span>
                                                    <span className="text-[9px] font-bold text-gray-400">Paten</span>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tipe Ujian</label>
                                                <div className="mt-1 flex items-center justify-between border border-gray-200 bg-gray-50/80 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800">
                                                    <span>{generatorData.tipe_ujian || (activePeriode?.nama?.toLowerCase().includes('uas') ? 'UAS' : 'UTS')}</span>
                                                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#801720]/10 text-[#801720] rounded flex-shrink-0">
                                                        {generatorData.tipe_ujian || (activePeriode?.nama?.toLowerCase().includes('uas') ? 'UAS' : 'UTS')}
                                                    </span>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tanggal &amp; Durasi</label>
                                                <input
                                                    type="text"
                                                    value={generatorData.tanggal_evaluasi}
                                                    onChange={e => handleHeaderChange('tanggal_evaluasi', e.target.value)}
                                                    className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#801720]/20 font-medium"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sifat Ujian</label>
                                                <input
                                                    type="text"
                                                    value={generatorData.tipe_soal}
                                                    onChange={e => handleHeaderChange('tipe_soal', e.target.value)}
                                                    className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#801720]/20 font-medium"
                                                />
                                            </div>

                                            <div className="sm:col-span-2">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">No Form</label>
                                                <input
                                                    type="text"
                                                    value={generatorData.form_no}
                                                    onChange={e => handleHeaderChange('form_no', e.target.value)}
                                                    className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#801720]/20 font-medium"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Box 2: Petunjuk Pengerjaan */}
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                            <h2 className="text-xs font-extrabold text-gray-800 flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-[#801720]" /> Petunjuk Pengerjaan
                                            </h2>
                                            <button
                                                type="button"
                                                onClick={addPetunjuk}
                                                className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer select-none"
                                            >
                                                <Plus className="w-3.5 h-3.5" /> Tambah
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            {generatorData.petunjuk_pengerjaan.map((item, idx) => (
                                                <div key={idx} className="flex items-start gap-2 bg-gray-50 border border-gray-100 p-2 rounded-xl">
                                                    <div className="flex flex-col gap-1 mt-1 text-gray-400">
                                                        <button
                                                            type="button"
                                                            onClick={() => movePetunjuk(idx, -1)}
                                                            disabled={idx === 0}
                                                            className="hover:text-gray-650 disabled:opacity-30 cursor-pointer"
                                                        >
                                                            <MoveUp className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => movePetunjuk(idx, 1)}
                                                            disabled={idx === generatorData.petunjuk_pengerjaan.length - 1}
                                                            className="hover:text-gray-650 disabled:opacity-30 cursor-pointer"
                                                        >
                                                            <MoveDown className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-400 mt-2">({idx + 1})</span>
                                                    <textarea
                                                        value={item}
                                                        onChange={e => handlePetunjukChange(idx, e.target.value)}
                                                        rows={2}
                                                        className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#801720]/20 resize-none bg-white font-medium"
                                                        placeholder="Masukkan petunjuk pengerjaan..."
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removePetunjuk(idx)}
                                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg mt-1 transition-colors cursor-pointer"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}

                                            {generatorData.petunjuk_pengerjaan.length === 0 && (
                                                <p className="text-xs text-gray-400 text-center py-2">Belum ada petunjuk. Klik tambah di kanan atas.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Box 3: PLO & CLO Structure */}
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                            <h2 className="text-xs font-extrabold text-gray-800 flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-[#801720]" /> Struktur PLO &amp; CLO Mata Kuliah
                                            </h2>
                                            <button
                                                type="button"
                                                onClick={addPlo}
                                                className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer select-none"
                                                title="Tambah PLO dari Kurikulum MK"
                                            >
                                                <Plus className="w-3.5 h-3.5" /> Tambah PLO
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            {generatorData.plo.map((ploItem, ploIdx) => (
                                                <div key={ploIdx} className="border border-slate-100 rounded-2xl p-4 bg-slate-50/20 space-y-4 shadow-sm">
                                                    
                                                    {/* PLO Header Row */}
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex-1 flex gap-3">
                                                            <div className="flex-shrink-0">
                                                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Kode PLO</label>
                                                                <select
                                                                    value={ploItem.kode}
                                                                    onChange={e => handlePloSelect(ploIdx, e.target.value)}
                                                                    className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-350 focus:border-[#801720] rounded-xl text-xs font-extrabold text-slate-800 focus:outline-none min-w-[90px] cursor-pointer shadow-xs"
                                                                >
                                                                    {originalPloList.map(p => (
                                                                        <option key={p.kode} value={p.kode}>{p.kode}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Deskripsi PLO</label>
                                                                    {(() => {
                                                                        const ploWeight = getPloWeight(ploItem);
                                                                        const isPloValid = ploWeight === 100;
                                                                        return (
                                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black border ${
                                                                                isPloValid
                                                                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                                                    : 'bg-amber-50 border-amber-200 text-amber-700'
                                                                            }`}>
                                                                                {isPloValid ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <AlertTriangle className="w-3 h-3 text-amber-600" />}
                                                                                Bobot {ploItem.kode}: {ploWeight}% / 100%
                                                                            </span>
                                                                        );
                                                                    })()}
                                                                </div>
                                                                <div className="w-full bg-slate-50 text-slate-700 p-2.5 rounded-xl border border-slate-100 text-xs font-semibold leading-relaxed whitespace-pre-wrap">
                                                                    {ploItem.deskripsi || <span className="text-gray-400 italic">Tidak ada deskripsi PLO</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removePlo(ploIdx)}
                                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer mt-5 self-start"
                                                            title="Hapus PLO"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>

                                                    {/* Nested CLOs */}
                                                    <div className="pl-6 border-l-2 border-slate-200 space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-bold text-gray-455 uppercase">Course Learning Outcomes ({ploItem.clo.length})</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => addClo(ploIdx)}
                                                                className="inline-flex items-center gap-0.5 text-[9px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 px-2.5 py-0.5 rounded transition-colors cursor-pointer select-none"
                                                                title="Tambah CLO dari Kurikulum MK"
                                                            >
                                                                <Plus className="w-3.5 h-3" /> Tambah CLO
                                                            </button>
                                                        </div>

                                                        {ploItem.clo.map((cloItem, cloIdx) => (
                                                            <div key={cloIdx} className="flex items-start justify-between gap-3 bg-white border border-slate-100/80 p-3.5 rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.015)]">
                                                                <div className="flex-1 flex gap-3">
                                                                    <div className="flex-shrink-0">
                                                                        <label className="text-[8px] font-bold text-gray-455 uppercase tracking-wider block mb-1.5">Kode CLO</label>
                                                                        <select
                                                                            value={cloItem.kode}
                                                                            onChange={e => handleCloSelect(ploIdx, cloIdx, e.target.value)}
                                                                            className="px-2.5 py-1.5 bg-white border border-blue-100 hover:border-blue-300 focus:border-blue-500 rounded-lg text-xs font-extrabold text-blue-800 focus:outline-none min-w-[80px] cursor-pointer shadow-xs"
                                                                        >
                                                                            {(() => {
                                                                                const origPlo = originalPloList.find(p => p.kode === ploItem.kode);
                                                                                const availableClos = origPlo ? origPlo.clo : [];
                                                                                return availableClos.map(c => (
                                                                                    <option key={c.kode} value={c.kode}>{c.kode}</option>
                                                                                ));
                                                                            })()}
                                                                        </select>
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <label className="text-[8px] font-bold text-gray-455 uppercase tracking-wider block mb-1">Deskripsi CLO</label>
                                                                        <div className="w-full bg-slate-50/50 text-slate-700 p-2.5 rounded-xl border border-slate-100 text-xs font-semibold leading-relaxed whitespace-pre-wrap">
                                                                            {cloItem.deskripsi || <span className="text-gray-400 italic">Tidak ada deskripsi CLO</span>}
                                                                        </div>
                                                                    </div>
                                                                    <div className="w-24">
                                                                        <label className="text-[8px] font-bold text-gray-455 uppercase tracking-wider block mb-1">Bobot LO (%)</label>
                                                                        <input
                                                                            type="text"
                                                                            value={cloItem.bobot_lo}
                                                                            onChange={e => handleCloChange(ploIdx, cloIdx, 'bobot_lo', e.target.value)}
                                                                            placeholder="e.g. 20%"
                                                                            className="w-full border border-slate-200 hover:border-slate-350 focus:border-[#801720] rounded-lg px-2.5 py-1.5 text-xs text-right focus:outline-none focus:ring-2 focus:ring-[#801720]/10 font-bold bg-white transition-all shadow-xs"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeClo(ploIdx, cloIdx)}
                                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer mt-4 self-start"
                                                                    title="Hapus CLO"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        ))}

                                                        {ploItem.clo.length === 0 && (
                                                            <p className="text-[10px] text-gray-400 italic py-1">Belum ada CLO di PLO ini.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}

                                            {generatorData.plo.length === 0 && (
                                                <p className="text-xs text-gray-400 text-center py-4">Mata kuliah ini belum memiliki pemetaan PLO di database.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Live A4 Preview (xl:span-7) */}
                                <div className="xl:col-span-7 space-y-4">
                                    
                                    {/* Sticky Export Panel */}
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sticky top-3 z-10">
                                        <div>
                                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cetak Dokumen Lembar Soal</h3>
                                            <p className={`text-[10px] font-semibold ${isWeightValid ? 'text-gray-400' : 'text-amber-600'}`}>
                                                {isWeightValid 
                                                    ? 'Bobot LO per PLO valid (masing-masing 100%). Dokumen siap dicetak.' 
                                                    : (() => {
                                                        const invalidPlos = plosWeightInfo.filter(p => !p.isValid);
                                                        const infoStr = invalidPlos.map(p => `${p.kode}: ${p.weight}%`).join(', ');
                                                        return `Pastikan total bobot LO per PLO adalah 100%. (Perlu penyesuaian: ${infoStr})`;
                                                    })()
                                                }
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleExport('pdf')}
                                                disabled={isExporting || !isWeightValid}
                                                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#801720] hover:bg-[#6a1219] text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50 select-none cursor-pointer disabled:cursor-not-allowed"
                                                title={!isWeightValid ? "Total bobot LO setiap PLO harus 100% untuk mengaktifkan ekspor" : ""}
                                            >
                                                <FileText className="w-3.5 h-3.5" /> {isExporting ? 'Proses Ekspor...' : 'Ekspor PDF'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* A4 Container */}
                                    <div className="bg-slate-200/70 p-6 rounded-2xl border border-slate-300/40 max-h-[75vh] overflow-y-auto flex justify-center items-start shadow-inner">
                                        
                                        {/* A4 Paper Mockup */}
                                        <div className="w-[21cm] bg-white shadow-xl p-[1.5cm] box-border text-black select-none text-[11px] relative leading-relaxed" style={{ fontFamily: 'Arial, sans-serif' }}>
                                            
                                            {/* Form No */}
                                            <div className="text-[9.5px] text-left mb-1.5">
                                                Form No : {generatorData.form_no}
                                            </div>

                                            {/* Header Table */}
                                            <table className="w-full border-collapse border-[1.5px] border-black text-[10px]">
                                                <tbody>
                                                    <tr>
                                                        <td rowSpan={4} className="border-[1.5px] border-black p-2 text-center align-middle w-[22%]">
                                                            <img
                                                                src="/images/logo-telkom.png"
                                                                alt="Logo Telkom"
                                                                className="max-h-[42px] max-w-full mx-auto block"
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                    e.target.insertAdjacentHTML('afterend', '<strong style="font-size:11px;">Telkom<br>University</strong>');
                                                                }}
                                                            />
                                                        </td>
                                                        <td colSpan={4} className="border-[1.5px] border-black p-2 text-center align-middle font-bold text-[13px] uppercase tracking-wide bg-gray-50/50">
                                                            LEMBAR SOAL
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="border-[1.5px] border-black px-2 py-1 w-[16%] font-normal text-gray-700 bg-gray-50/30">Nama Evaluasi</td>
                                                        <td className="border-[1.5px] border-black px-2 py-1 w-[32%]">{generatorData.nama_evaluasi}</td>
                                                        <td className="border-[1.5px] border-black px-2 py-1 w-[14%] font-normal text-gray-700 bg-gray-50/30">Kode dosen</td>
                                                        <td className="border-[1.5px] border-black px-2 py-1 w-[16%]">{generatorData.kode_dosen || '-'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="border-[1.5px] border-black px-2 py-1 font-normal text-gray-700 bg-gray-50/30">Kode/Nama MK</td>
                                                        <td className="border-[1.5px] border-black px-2 py-1">{generatorData.kode_nama_mk}</td>
                                                        <td className="border-[1.5px] border-black px-2 py-1 font-normal text-gray-700 bg-gray-50/30">Tipe Ujian</td>
                                                        <td className="border-[1.5px] border-black px-2 py-1">{generatorData.tipe_ujian}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="border-[1.5px] border-black px-2 py-1 font-normal text-gray-700 bg-gray-50/30">Tanggal Evaluasi</td>
                                                        <td className="border-[1.5px] border-black px-2 py-1">{generatorData.tanggal_evaluasi}</td>
                                                        <td className="border-[1.5px] border-black px-2 py-1 font-normal text-gray-700 bg-gray-50/30">Tipe Soal</td>
                                                        <td className="border-[1.5px] border-black px-2 py-1 font-bold">{generatorData.tipe_soal}</td>
                                                    </tr>
                                                </tbody>
                                            </table>

                                            {/* Petunjuk Box */}
                                            <table className="w-full border-collapse border-[1.5px] border-black mt-2.5 text-[10px]">
                                                <tbody>
                                                    <tr>
                                                        <td className="border-[1.5px] border-black p-2 text-center align-middle font-bold w-[22%] bg-gray-50/50 leading-normal">
                                                            Petunjuk<br />Pengerjaan
                                                        </td>
                                                        <td className="border-[1.5px] border-black p-2 align-middle">
                                                            {generatorData.petunjuk_pengerjaan.map((item, idx) => (
                                                                <div key={idx} className="mb-0.5">
                                                                    ({idx + 1}) {item || '...'}
                                                                </div>
                                                            ))}
                                                            {generatorData.petunjuk_pengerjaan.length === 0 && (
                                                                <div className="text-gray-400 italic">Belum ada petunjuk pengerjaan.</div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>

                                            {/* Reset sequential question tags globally in render */}
                                            {(() => { previewQuestionIndex = 1; return null; })()}

                                            {/* Loop PLOs */}
                                            {generatorData.plo.map((ploItem, ploIdx) => (
                                                <div key={ploIdx} className="mt-2.5 select-none">
                                                    
                                                    {/* PLO Row */}
                                                    <table className="w-full border-collapse border-[1.5px] border-black text-[10px]">
                                                        <tbody>
                                                            <tr>
                                                                <td className="border-[1.5px] border-black p-2 text-center align-middle font-bold w-[22%] bg-gray-50/50 leading-normal">
                                                                    Program<br />Learning<br />Outcomes
                                                                </td>
                                                                <td className="border-[1.5px] border-black p-2 align-middle font-bold">
                                                                    {ploItem.kode} – {ploItem.deskripsi || '...'}
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>

                                                    {/* Loop CLOs inside PLO */}
                                                    {ploItem.clo.map((cloItem, cloIdx) => {
                                                        const currentQuestionNum = previewQuestionIndex;
                                                        previewQuestionIndex++;

                                                        return (
                                                            <div key={cloIdx} className="mt-2.5 select-none">
                                                                
                                                                {/* CLO Header */}
                                                                <table className="w-full border-collapse border-[1.5px] border-black text-[10px]">
                                                                    <thead>
                                                                        <tr className="bg-gray-50/50 font-bold">
                                                                            <th className="border-[1.5px] border-black p-1.5 text-left w-[85%]">Course Learning outcomes</th>
                                                                            <th className="border-[1.5px] border-black p-1.5 text-right w-[15%]">Bobot LO</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        <tr>
                                                                            <td className="border-[1.5px] border-black p-2 align-middle">
                                                                                <span className="font-bold mr-3">{cloItem.kode}</span>
                                                                                <span>{cloItem.deskripsi || '...'}</span>
                                                                            </td>
                                                                            <td className="border-[1.5px] border-black p-2 text-right font-bold align-middle">
                                                                                {cloItem.bobot_lo}
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>

                                                                {/* Question label */}
                                                                <div className="text-center my-2">
                                                                    <span className="bg-yellow-300 border border-black/10 px-2 py-0.5 text-[10px] font-bold">
                                                                        Soal LO{currentQuestionNum}
                                                                    </span>
                                                                </div>

                                                                {/* Bordered Question Area */}
                                                                <div className="border-[1.5px] border-black h-[140px] flex items-center justify-center text-gray-300 font-sans text-[11px] italic bg-gray-50/10">
                                                                    [ AREA SOAL UNTUK {cloItem.kode} ]
                                                                </div>

                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ))}

                                            {generatorData.plo.length === 0 && (
                                                <div className="text-center text-gray-400 italic py-8 border border-dashed border-gray-300 mt-2.5 rounded-lg">
                                                    Belum ada PLO &amp; CLO yang ditambahkan.
                                                </div>
                                            )}

                                            {/* Footer */}
                                            <div className="border-t border-gray-100 mt-8 pt-2 text-[9px] text-gray-400 font-sans select-none">
                                                Fakultas Rekayasa Industri – S1 Sistem Informasi
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-10 text-center max-w-xl mx-auto">
                                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                                <p className="text-sm text-slate-650 font-bold">Gagal memuat data generator.</p>
                                <button
                                    onClick={() => setActiveTab('upload')}
                                    className="mt-4 px-4 py-2 bg-[#801720] text-white rounded-xl text-xs font-semibold"
                                >
                                    Kembali ke Upload
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
