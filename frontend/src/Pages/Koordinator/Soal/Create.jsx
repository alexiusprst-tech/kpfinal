import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import axios from 'axios';
import {
    ArrowLeft, Upload, FileText, X, CheckCircle2, AlertTriangle,
    Plus, Trash2, Download, Sparkles, BookOpen, Layers, Clock,
    HelpCircle, ChevronDown, ChevronUp, FileCode
} from 'lucide-react';
import FlashAlert from '@/Components/FlashAlert';
import { showToast, showAlert } from '@/Utils/sweetalert';

const ALLOWED_EXT = ['pdf', 'doc', 'docx'];
const MAX_SIZE_MB = 20;

function formatSize(bytes) {
    if (!bytes) return '0 KB';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

function Toast({ flash }) {
    return <FlashAlert type="toast" flash={flash} />;
}

export default function SoalCreate({ assignments, kategoriAll, defaultKategori, activePeriode, selectedMataKuliahId, uploadOpen }) {
    const { flash } = usePage().props;
    const [clientError, setClientError] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    // Determine default category based on active period
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

    // Main form state
    const { data, setData, post, processing, errors } = useForm({
        mata_kuliah_id: selectedMataKuliahId || (assignments[0]?.id ?? ''),
        periode_id: activePeriode?.id || '',
        kategori_id: fixedCategory?.id || '',
        judul: '',
        file: null,
        submit_now: true,
        plo_clo_data: null,
    });

    const selectedMk = assignments.find(a => a.id === data.mata_kuliah_id);

    // Generator & PLO/CLO States
    const [generatorData, setGeneratorData] = useState(null);
    const [originalPloList, setOriginalPloList] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [showPetunjuk, setShowPetunjuk] = useState(false);

    // Auto-suggest Judul Soal when MK or category changes
    useEffect(() => {
        if (selectedMk && fixedCategory && !data.judul) {
            const kategoriName = fixedCategory.nama || 'Ujian';
            setData('judul', `${kategoriName} - ${selectedMk.nama_mk}`);
        }
    }, [selectedMk?.id, fixedCategory?.id]);

    // Fetch generator course data (PLO/CLO) dynamically when course changes
    useEffect(() => {
        if (data.mata_kuliah_id) {
            setIsLoadingData(true);
            axios.get(`/koordinator/soal-generator/course-data?mata_kuliah_id=${data.mata_kuliah_id}`)
                .then(res => {
                    const allPlos = res.data.plo || [];
                    setOriginalPloList(allPlos);
                    // Display 1 PLO initially by default if available, or all
                    const initialPlos = allPlos.length > 0 ? [JSON.parse(JSON.stringify(allPlos[0]))] : [];
                    const initialGen = {
                        ...res.data,
                        plo: initialPlos
                    };
                    setGeneratorData(initialGen);
                })
                .catch(err => {
                    console.error(err);
                    showToast('error', 'Gagal memuat data PLO/CLO untuk mata kuliah ini.');
                })
                .finally(() => {
                    setIsLoadingData(false);
                });
        }
    }, [data.mata_kuliah_id]);

    // Keep generatorData in sync with form.plo_clo_data
    useEffect(() => {
        if (generatorData) {
            setData('plo_clo_data', generatorData);
        }
    }, [generatorData]);

    // PLO & CLO helper functions
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
        if (!plosWeightInfo || plosWeightInfo.length === 0) return true;
        return plosWeightInfo.every(p => p.isValid);
    }, [plosWeightInfo]);

    // Handle template export
    const handleExport = (type) => {
        if (!generatorData) return;
        setIsExporting(true);
        axios.post(`/koordinator/soal-generator/export-${type}`, generatorData, {
            responseType: 'blob'
        })
        .then(response => {
            const blob = new Blob([response.data], { type: response.headers['content-type'] });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const ext = type === 'pdf' ? 'pdf' : 'doc';
            const cleanMk = (generatorData.kode_nama_mk || 'soal').replace(/[\/\\?%*:|"<>\s]+/g, '_');
            link.setAttribute('download', `Template_Soal_${cleanMk}.${ext}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            showToast('success', `Template ${type.toUpperCase()} berhasil diunduh.`);
        })
        .catch(err => {
            console.error(err);
            showAlert({
                title: 'Gagal Ekspor Template',
                text: 'Pastikan bobot LO pada masing-masing PLO berjumlah tepat 100% sebelum mengunduh template.',
                icon: 'warning'
            });
        })
        .finally(() => {
            setIsExporting(false);
        });
    };

    // File validation & handling
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

    const handleSubmit = (e, submitDirect = true) => {
        e?.preventDefault();
        if (!data.mata_kuliah_id) return setClientError('Pilih mata kuliah terlebih dahulu.');
        if (!data.kategori_id) return setClientError('Pilih kategori soal terlebih dahulu.');
        if (!data.judul.trim()) return setClientError('Judul soal wajib diisi.');
        if (!data.file) return setClientError('File naskah soal wajib diunggah.');

        if (!isWeightValid) {
            return showAlert({
                title: 'Bobot LO Belum Tepat',
                text: 'Total bobot LO untuk setiap PLO yang dipilih harus berjumlah tepat 100%.',
                icon: 'warning',
            });
        }

        // Validate PLO/CLO is configured
        const ploCount = generatorData?.plo?.length || 0;
        const totalClo = generatorData?.plo?.reduce((acc, p) => acc + (p.clo?.length || 0), 0) || 0;
        if (ploCount === 0 || totalClo === 0) {
            return showAlert({
                title: 'Konfigurasi PLO & CLO Wajib',
                text: 'Tambahkan minimal satu PLO dengan satu CLO sebelum mengunggah soal. Verifikator memerlukan data ini untuk memberikan catatan evaluasi.',
                icon: 'warning',
            });
        }

        setClientError('');
        const formData = new FormData();
        formData.append('mata_kuliah_id', data.mata_kuliah_id);
        formData.append('periode_id', data.periode_id);
        formData.append('kategori_id', data.kategori_id);
        formData.append('judul', data.judul);
        formData.append('submit_now', submitDirect ? '1' : '0');
        formData.append('file', data.file);
        if (generatorData) {
            formData.append('plo_clo_data', JSON.stringify(generatorData));
        }

        post('/koordinator/soal', {
            data: formData,
            forceFormData: true
        });
    };

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
        <AuthenticatedLayout title="Buat & Upload Lembar Soal">
            <Head title="Buat & Upload Lembar Soal" />
            <Toast flash={flash} />

            <div className="max-w-4xl mx-auto space-y-6 pb-12">
                {/* Back link */}
                <Link
                    href={selectedMk ? `/koordinator/mata-kuliah/${selectedMk.id}` : '/koordinator/soal'}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#801720] transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Daftar Soal
                </Link>

                {/* Page Title Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-[#801720]" /> Buat & Upload Lembar Soal
                        </h1>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Konfigurasi pemetaan PLO & CLO, unduh template resmi jika diperlukan, dan unggah naskah soal final untuk diverifikasi.
                        </p>
                    </div>
                </div>

                {clientError && (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        {clientError}
                    </div>
                )}

                {/* SECTION 1: Informasi Mata Kuliah & Soal */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                    <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-[#801720]" /> 1. Informasi Mata Kuliah & Ujian
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {/* Mata Kuliah */}
                        <div>
                            <label className="block font-semibold text-gray-700 mb-1.5">
                                Mata Kuliah <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={data.mata_kuliah_id}
                                onChange={(e) => setData('mata_kuliah_id', e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] outline-none transition-all"
                            >
                                {assignments.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.kode_mk} - {a.nama_mk}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Judul Soal */}
                        <div>
                            <label className="block font-semibold text-gray-700 mb-1.5">
                                Judul Naskah Soal <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.judul}
                                onChange={(e) => setData('judul', e.target.value)}
                                placeholder="Contoh: UTS - Pemrograman Web"
                                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] outline-none transition-all"
                            />
                        </div>

                        {/* Periode Info */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                            <div>
                                <span className="text-[11px] text-gray-400 block">Periode Verifikasi</span>
                                <span className="font-bold text-gray-800 text-xs">{activePeriode?.nama || '—'}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[10px] font-bold">
                                Aktif
                            </span>
                        </div>

                        {/* Kategori Soal */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                            <div>
                                <span className="text-[11px] text-gray-400 block">Kategori Evaluasi</span>
                                <span className="font-bold text-gray-800 text-xs">{fixedCategory?.nama || 'UTS'}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                                Otomatis
                            </span>
                        </div>
                    </div>
                </div>

                {/* SECTION 2: Konfigurasi Pemetaan PLO & CLO + Download Template */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-[#801720]" /> 2. Pemetaan PLO &amp; CLO Soal
                            </h2>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                                Tentukan PLO dan CLO yang diuji pada naskah soal ini beserta bobot LO-nya (total 100% per PLO).
                            </p>
                        </div>

                        {/* Quick Export Template Buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                type="button"
                                onClick={() => handleExport('docx')}
                                disabled={isExporting || isLoadingData}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                                title="Unduh template Word dengan PLO/CLO yang telah dipilih"
                            >
                                <Download className="w-3.5 h-3.5" /> Template Word (.docx)
                            </button>
                            <button
                                type="button"
                                onClick={() => handleExport('pdf')}
                                disabled={isExporting || isLoadingData}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                                title="Unduh template PDF dengan PLO/CLO yang telah dipilih"
                            >
                                <Download className="w-3.5 h-3.5" /> Template PDF (.pdf)
                            </button>
                        </div>
                    </div>

                    {isLoadingData ? (
                        <div className="py-8 text-center text-xs text-gray-400">
                            Memuat data PLO & CLO mata kuliah...
                        </div>
                    ) : !generatorData || generatorData.plo?.length === 0 ? (
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
                            Belum ada pemetaan PLO & CLO untuk mata kuliah ini di sistem.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* PLO Cards List */}
                            {generatorData.plo.map((ploItem, ploIdx) => {
                                const ploWeight = getPloWeight(ploItem);
                                const isThisPloValid = ploWeight === 100;
                                const originalPlo = originalPloList.find(p => p.kode === ploItem.kode);
                                const availableClos = originalPlo?.clo || [];

                                return (
                                    <div key={ploIdx} className="rounded-2xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-200">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <span className="w-7 h-7 rounded-lg bg-[#801720] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                    {ploIdx + 1}
                                                </span>
                                                <select
                                                    value={ploItem.kode}
                                                    onChange={(e) => handlePloSelect(ploIdx, e.target.value)}
                                                    className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-xs font-bold text-gray-800 outline-none"
                                                >
                                                    {originalPloList.map(p => (
                                                        <option key={p.kode} value={p.kode}>
                                                            {p.kode}
                                                        </option>
                                                    ))}
                                                </select>
                                                <p className="text-xs text-gray-500 truncate">{ploItem.deskripsi}</p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                                    isThisPloValid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                    Total Bobot: {ploWeight}% {isThisPloValid ? '✓' : '(Harus 100%)'}
                                                </span>
                                                {generatorData.plo.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removePlo(ploIdx)}
                                                        className="p-1 text-gray-400 hover:text-red-500 rounded-lg"
                                                        title="Hapus PLO ini"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* CLO Items inside this PLO */}
                                        <div className="space-y-2.5">
                                            {ploItem.clo.map((cloItem, cloIdx) => (
                                                <div key={cloIdx} className="p-3.5 bg-white rounded-xl border border-gray-200/80 shadow-2xs space-y-2.5">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                            <select
                                                                value={cloItem.kode}
                                                                onChange={(e) => handleCloSelect(ploIdx, cloIdx, e.target.value)}
                                                                className="px-2 py-1 rounded-lg border border-gray-300 bg-gray-50 text-xs font-bold text-[#801720] outline-none"
                                                            >
                                                                {availableClos.map(c => (
                                                                    <option key={c.kode} value={c.kode}>
                                                                        {c.kode}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <p className="text-xs text-gray-700 truncate flex-1">{cloItem.deskripsi}</p>
                                                        </div>

                                                        <div className="flex items-center gap-2 self-end sm:self-center">
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-[11px] text-gray-400 font-medium">Bobot:</span>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    max="100"
                                                                    value={parseInt(cloItem.bobot_lo) || ''}
                                                                    onChange={(e) => handleCloChange(ploIdx, cloIdx, 'bobot_lo', `${e.target.value}%`)}
                                                                    className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-xs font-bold text-center text-gray-800 outline-none focus:border-[#801720]"
                                                                />
                                                                <span className="text-xs font-bold text-gray-500">%</span>
                                                            </div>
                                                            {ploItem.clo.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeClo(ploIdx, cloIdx)}
                                                                    className="p-1 text-gray-400 hover:text-red-500 rounded"
                                                                    title="Hapus CLO ini"
                                                                >
                                                                    <X className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Textarea Isi / Pertanyaan Soal */}
                                                    <div className="pt-2 border-t border-gray-100">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5">
                                                                <FileText className="w-3.5 h-3.5 text-[#801720]" />
                                                                Pertanyaan / Isi Soal ({cloItem.kode})
                                                            </label>
                                                            <span className="text-[10px] text-gray-400">
                                                                Dicantumkan pada Lembar Soal BAP
                                                            </span>
                                                        </div>
                                                        <textarea
                                                            value={cloItem.soal || ''}
                                                            onChange={(e) => handleCloChange(ploIdx, cloIdx, 'soal', e.target.value)}
                                                            rows={3}
                                                            placeholder={`Tuliskan teks pertanyaan / deskripsi soal untuk ${cloItem.kode} di sini...`}
                                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] outline-none transition-all resize-y bg-gray-50/50 hover:bg-white focus:bg-white"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="pt-1">
                                            <button
                                                type="button"
                                                onClick={() => addClo(ploIdx)}
                                                className="inline-flex items-center gap-1 text-xs font-bold text-[#801720] hover:underline"
                                            >
                                                <Plus className="w-3 h-3" /> Tambah CLO ke {ploItem.kode}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="flex items-center justify-between pt-2">
                                <button
                                    type="button"
                                    onClick={addPlo}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all shadow-xs"
                                >
                                    <Plus className="w-3.5 h-3.5 text-[#801720]" /> Tambah PLO Lain
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setShowPetunjuk(!showPetunjuk)}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800"
                                >
                                    <HelpCircle className="w-3.5 h-3.5" />
                                    {showPetunjuk ? 'Sembunyikan Petunjuk Pengerjaan' : 'Atur Petunjuk Pengerjaan'}
                                    {showPetunjuk ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                            </div>

                            {/* Optional Petunjuk Pengerjaan Accordion */}
                            {showPetunjuk && (
                                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-2">
                                    <p className="font-bold text-gray-700">Petunjuk Pengerjaan Ujian (akan dicantumkan di template):</p>
                                    {generatorData.petunjuk_pengerjaan?.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <span className="text-gray-400 font-bold">{idx + 1}.</span>
                                            <input
                                                type="text"
                                                value={item}
                                                onChange={(e) => {
                                                    const list = [...generatorData.petunjuk_pengerjaan];
                                                    list[idx] = e.target.value;
                                                    setGeneratorData(prev => ({ ...prev, petunjuk_pengerjaan: list }));
                                                }}
                                                className="flex-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* SECTION 3: Upload Berkas Soal */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                    <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <Upload className="w-4 h-4 text-[#801720]" /> 3. Unggah Berkas Naskah Soal
                    </h2>
                    <p className="text-[11px] text-gray-500">
                        Unggah naskah soal yang telah selesai disusun (format PDF, DOC, atau DOCX, maksimal 20 MB).
                    </p>

                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
                            dragOver
                                ? 'border-[#801720] bg-red-50/40'
                                : data.file
                                ? 'border-emerald-400 bg-emerald-50/30'
                                : 'border-gray-300 hover:border-[#801720]/50 hover:bg-gray-50/60'
                        }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx"
                            className="hidden"
                            onChange={(e) => handleFile(e.target.files?.[0])}
                        />

                        {data.file ? (
                            <div className="flex items-center justify-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="text-xs font-bold text-gray-800 truncate max-w-sm">{data.file.name}</p>
                                    <p className="text-[11px] text-gray-400">{formatSize(data.file.size)}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setData('file', null);
                                    }}
                                    className="p-1 hover:bg-red-50 text-red-500 rounded-lg transition-colors ml-2"
                                    title="Hapus file terpilih"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="w-10 h-10 rounded-2xl bg-red-100/70 border border-red-200/60 flex items-center justify-center mx-auto text-[#801720]">
                                    <Upload className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-700">
                                        Klik untuk memilih file atau seret file ke area ini
                                    </p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                        Format berkas: PDF, DOC, DOCX (Maksimal 20 MB)
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* SECTION 4: Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={(e) => handleSubmit(e, false)}
                        disabled={processing || !data.file}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 disabled:opacity-50 transition-all cursor-pointer"
                    >
                        Simpan sebagai Draft
                    </button>
                    <button
                        type="button"
                        onClick={(e) => handleSubmit(e, true)}
                        disabled={processing || !data.file}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#801720] hover:bg-[#6a1219] text-white text-xs font-bold shadow-sm shadow-[#801720]/25 disabled:opacity-50 transition-all cursor-pointer"
                    >
                        {processing ? 'Menyimpan & Mengirim...' : 'Submit Soal untuk Verifikasi'}
                    </button>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
