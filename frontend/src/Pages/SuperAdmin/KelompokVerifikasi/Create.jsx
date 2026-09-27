import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { showToast, showAlert } from '@/Utils/sweetalert';
import SearchableSelect from '@/Components/SearchableSelect';
import { formatDate } from '@/Utils/date';

import {
    Layers,
    CheckCircle2,
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Save,
    Play,
    BookOpen,
    Shield,
    Search,
    Check,
    Copy,
    X,
    GraduationCap,
    Info,
    Plus,
    Trash2
} from 'lucide-react';

export default function Create({
    auth,
    periodeList = [],
    existingPeriodeIds = [],
    mataKuliahList = [],
    dosenList = [],
    activeKoordinatorList = [],
    activeVerifikatorList = [],
}) {
    const { errors, flash } = usePage().props;

    // Current Wizard Step: 1 = Periode, 2 = Mata Kuliah, 3 = Koordinator per MK + Review & Simpan
    const [step, setStep] = useState(1);

    // Form States
    const [periodeId, setPeriodeId] = useState('');
    const [selectedMkIds, setSelectedMkIds] = useState([]);

    // Per-MK Coordinator Map: { [mkId]: [dosenId, ...] }
    // Verifikator TIDAK diisi di sini — ditentukan oleh Koordinator MK.
    const [mkCoordinatorMap, setMkCoordinatorMap] = useState({});

    // Group Information
    const [namaKelompok, setNamaKelompok] = useState('');
    const [keterangan, setKeterangan] = useState('');

    // Search and filter helpers for MK list in Step 2
    const [mkSearch, setMkSearch] = useState('');
    const [semesterFilter, setSemesterFilter] = useState('ALL');

    // UI Feedback
    const [loading, setLoading] = useState(false);
    const [copyNotification, setCopyNotification] = useState('');
    const [showAddMkSelector, setShowAddMkSelector] = useState(false);
    const [addMkSearch, setAddMkSearch] = useState('');

    // Active Periode Object
    const selectedPeriode = periodeList.find((p) => p.id === periodeId);
    const allPeriodsHaveGroups = periodeList.length > 0 && periodeList.every((p) => existingPeriodeIds.includes(p.id));
    const mkAll = mataKuliahList;
    const dosenAll = dosenList;

    // Filtered MK list for Step 2
    const filteredMkList = mkAll.filter((mk) => {
        const matchSearch =
            mk.nama_mk.toLowerCase().includes(mkSearch.toLowerCase()) ||
            mk.kode_mk.toLowerCase().includes(mkSearch.toLowerCase());
        const matchSemester = semesterFilter === 'ALL' || String(mk.semester) === String(semesterFilter);
        return matchSearch && matchSemester;
    });

    // Unselected MKs for quick addition in Step 3
    const unselectedMks = mkAll.filter((m) => !selectedMkIds.includes(m.id));
    const filteredUnselectedMks = unselectedMks.filter((mk) => {
        const s = addMkSearch.toLowerCase();
        return mk.nama_mk.toLowerCase().includes(s) || mk.kode_mk.toLowerCase().includes(s);
    });

    const handleAddAdditionalMk = (mk) => {
        setSelectedMkIds((prev) => [...prev, mk.id]);
        showToast('success', `Mata kuliah ${mk.kode_mk} berhasil ditambahkan ke penetapan.`);
        setShowAddMkSelector(false);
        setAddMkSearch('');
    };

    // Toggle MK Selection in Step 2
    const handleToggleMk = (mkId) => {
        setSelectedMkIds((prev) => {
            if (prev.includes(mkId)) {
                const next = prev.filter((id) => id !== mkId);
                // Clean coordinator mappings for this MK
                setMkCoordinatorMap((cMap) => {
                    const copy = { ...cMap };
                    delete copy[mkId];
                    return copy;
                });
                return next;
            } else {
                return [...prev, mkId];
            }
        });
    };

    // Toggle coordinator for a specific MK (Max 3)
    const handleToggleCoordinator = (mkId, dosenId) => {
        if (!dosenId) return;

        const currentKoorList = mkCoordinatorMap[mkId] || [];
        const isRemoving = currentKoorList.includes(dosenId);

        if (!isRemoving) {
            const isDbActiveVerif = activeVerifikatorList.some(
                (item) => item.periode_id === periodeId && item.mata_kuliah_id === mkId && item.dosen_id === dosenId
            );
            if (isDbActiveVerif) {
                const dObj = dosenAll.find((d) => d.id === dosenId);
                showAlert({
                    title: 'Konflik Penugasan Aktif',
                    text: `Dosen ${dObj?.nama_lengkap || 'tersebut'} sudah menjadi Verifikator aktif untuk mata kuliah ini pada periode terpilih.`,
                    icon: 'warning',
                });
                return;
            }
        }

        setMkCoordinatorMap((prev) => {
            const currentList = prev[mkId] || [];
            if (currentList.includes(dosenId)) {
                return {
                    ...prev,
                    [mkId]: currentList.filter((id) => id !== dosenId),
                };
            } else {
                if (currentList.length >= 3) {
                    showToast('warning', 'Maksimal 3 dosen koordinator untuk setiap mata kuliah.');
                    return prev;
                }
                return {
                    ...prev,
                    [mkId]: [...currentList, dosenId],
                };
            }
        });
    };

    // Copy Coordinators from one MK to all other selected MKs
    const handleCopyCoordinatorsToAll = (sourceMkId) => {
        const sourceList = (mkCoordinatorMap[sourceMkId] || []).slice(0, 3);
        if (sourceList.length === 0) return;

        setMkCoordinatorMap((prev) => {
            const updated = { ...prev };
            selectedMkIds.forEach((mkId) => {
                // Exclude active verifikators from other groups on this MK
                updated[mkId] = sourceList.filter((id) => {
                    const isDbActiveVerif = activeVerifikatorList.some(
                        (item) => item.periode_id === periodeId && item.mata_kuliah_id === mkId && item.dosen_id === id
                    );
                    return !isDbActiveVerif;
                });
            });
            return updated;
        });

        setCopyNotification('Koordinator berhasil disalin ke seluruh Mata Kuliah!');
        setTimeout(() => setCopyNotification(''), 3000);
    };

    // Dynamic options for Koordinator dropdown on a specific MK
    const getKoordinatorOptionsForMk = (currentMkId) => {
        const thisMkCoors = mkCoordinatorMap[currentMkId] || [];

        return dosenAll.map((d) => {
            const isThisMkKoor = thisMkCoors.includes(d.id);
            const isDbActiveVerif = activeVerifikatorList.some(
                (item) => item.periode_id === periodeId && item.mata_kuliah_id === currentMkId && item.dosen_id === d.id
            );

            const isDisabled = isThisMkKoor || isDbActiveVerif;

            return {
                value: d.id,
                label: `${d.kode_dosen} – ${d.nama_lengkap}`,
                disabled: isDisabled,
            };
        });
    };

    // Validate current step before advancing
    const canAdvance = () => {
        if (step === 1) return Boolean(periodeId) && !existingPeriodeIds.includes(periodeId);
        if (step === 2) return selectedMkIds.length > 0;
        if (step === 3) {
            // Setiap MK wajib memiliki 1-3 koordinator
            return selectedMkIds.length > 0 && selectedMkIds.every((id) => {
                const koors = mkCoordinatorMap[id] || [];
                return koors.length >= 1 && koors.length <= 3;
            });
        }
        return true;
    };

    // Step Navigation
    const handleNext = () => {
        if (step === 1 && !namaKelompok && selectedPeriode) {
            setNamaKelompok(`Kelompok Verifikasi - ${selectedPeriode.nama}`);
        }
        setStep((s) => Math.min(s + 1, 3));
    };

    const handlePrev = () => {
        setStep((s) => Math.max(s - 1, 1));
    };

    // Submit Group (langsung status MENUNGGU_VERIFIKATOR — verifikator ditentukan koordinator)
    const handleSubmit = async () => {
        if (!namaKelompok.trim()) {
            showAlert({
                title: 'Data Belum Lengkap',
                text: 'Silakan isi nama kelompok verifikasi terlebih dahulu.',
                icon: 'warning',
            });
            return;
        }

        // Validasi setiap MK wajib punya koordinator (verifikator tidak diperlukan di sini)
        for (const mkId of selectedMkIds) {
            const mk = mkAll.find((m) => m.id === mkId);
            const koors = mkCoordinatorMap[mkId] || [];

            if (koors.length === 0) {
                showAlert({
                    title: 'Koordinator Belum Ditentukan',
                    text: `Mata kuliah ${mk?.kode_mk} - ${mk?.nama_mk} belum memiliki dosen koordinator.`,
                    icon: 'warning',
                });
                return;
            }
            if (koors.length > 3) {
                showAlert({
                    title: 'Koordinator Melebihi Batas',
                    text: `Mata kuliah ${mk?.kode_mk} - ${mk?.nama_mk} memiliki lebih dari 3 koordinator.`,
                    icon: 'warning',
                });
                return;
            }
        }

        const payload = {
            nama: namaKelompok,
            periode_id: periodeId,
            keterangan: keterangan,
            // Status tidak perlu dikirim — backend akan otomatis set MENUNGGU_VERIFIKATOR
            mata_kuliah: selectedMkIds.map((id) => ({
                mata_kuliah_id: id,
                koordinator_ids: mkCoordinatorMap[id] || [],
                // verifikator_ids tidak dikirim — akan ditentukan koordinator MK
            })),
        };

        setLoading(true);
        router.post('/superadmin/kelompok-verifikasi', payload, {
            onFinish: () => setLoading(false),
            onError: (errs) => {
                const firstErr = Object.values(errs)[0];
                if (firstErr) {
                    showAlert({
                        title: 'Gagal Menyimpan Kelompok',
                        text: firstErr,
                        icon: 'error',
                    });
                }
            },
        });
    };

    return (
        <AuthenticatedLayout auth={auth}>
            <Head title="Buat Kelompok Verifikasi" />


            <div className="space-y-6 w-full pb-16">
                {errors && Object.keys(errors).length > 0 && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3 animate-in fade-in duration-200">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-sm">Gagal Menyimpan Kelompok Verifikasi:</p>
                            <ul className="text-xs list-disc list-inside mt-1 space-y-0.5 font-medium">
                                {Object.values(errors).map((err, idx) => (
                                    <li key={idx}>{err}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Header Title */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/superadmin/kelompok-verifikasi"
                            className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer shrink-0"
                            title="Kembali ke Daftar Kelompok"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
                                <Layers className="w-6 h-6 text-[#9E1B28]" />
                                Buat Kelompok Verifikasi Baru
                            </h1>
                            <p className="text-xs text-gray-500 mt-1">
                                Buat kelompok penugasan untuk Periode, Mata Kuliah, dan Koordinator MK. Verifikator akan ditentukan oleh Koordinator MK masing-masing.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Wizard Progress Steps Bar */}
                <div className="bg-white py-6 px-4 sm:px-8 rounded-2xl border border-gray-200/80 shadow-sm">
                    <div className="flex items-start justify-between relative max-w-4xl mx-auto">
                        {[
                            { num: 1, title: 'Periode', desc: 'Pilih Periode' },
                            { num: 2, title: 'Mata Kuliah', desc: 'Target MK' },
                            { num: 3, title: 'Koordinator & Simpan', desc: 'Tugaskan Koordinator MK' },
                        ].map((s, idx, arr) => {
                            const isDone = step > s.num;
                            const isCurrent = step === s.num;

                            return (
                                <React.Fragment key={s.num}>
                                    <div
                                        className={`flex flex-col items-center group cursor-pointer transition-all z-10 ${
                                            isCurrent ? 'scale-105' : isDone ? 'opacity-100' : 'opacity-60 hover:opacity-90'
                                        }`}
                                        onClick={() => {
                                            if (s.num < step) setStep(s.num);
                                        }}
                                    >
                                        {/* Circle Number Badge */}
                                        <div
                                            className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-sm transition-all shadow-sm ${
                                                isDone
                                                    ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                                                    : isCurrent
                                                    ? 'bg-[#9E1B28] text-white ring-4 ring-[#9E1B28]/15 shadow-md shadow-[#9E1B28]/30'
                                                    : 'bg-white border-2 border-gray-200 text-gray-400'
                                            }`}
                                        >
                                            {isDone ? <Check className="w-5 h-5 stroke-[2.5]" /> : s.num}
                                        </div>

                                        {/* Title & Subtitle Below */}
                                        <div className="mt-2.5 text-center">
                                            <p
                                                className={`text-xs font-bold transition-colors leading-tight ${
                                                    isCurrent
                                                        ? 'text-[#9E1B28]'
                                                        : isDone
                                                        ? 'text-gray-800'
                                                        : 'text-gray-400'
                                                }`}
                                            >
                                                {s.title}
                                            </p>
                                            <p
                                                className={`text-[10px] font-medium mt-0.5 transition-colors hidden sm:block ${
                                                    isCurrent
                                                        ? 'text-[#9E1B28]/75 font-semibold'
                                                        : isDone
                                                        ? 'text-gray-500'
                                                        : 'text-gray-400'
                                                }`}
                                            >
                                                {s.desc}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Connecting Line Between Circles */}
                                    {idx < arr.length - 1 && (
                                        <div className="flex-1 flex items-center mt-5 px-2">
                                            <div
                                                className={`w-full h-[2px] rounded-full transition-all duration-300 ${
                                                    step > s.num ? 'bg-emerald-500' : 'bg-gray-200'
                                                }`}
                                            />
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                {/* Step Content Container */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-6">

                    {/* ================= STEP 1: PILIH PERIODE ================= */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-base font-extrabold text-gray-900">Langkah 1: Pilih Periode Verifikasi</h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Tentukan periode akademik aktif tempat kelompok verifikasi ini akan beroperasi.
                                </p>
                            </div>

                            {allPeriodsHaveGroups && (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-3">
                                    <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold">Semua Periode Aktif Sudah Memiliki Kelompok Verifikasi</p>
                                        <p className="mt-0.5 text-amber-700">Dalam satu periode aktif hanya dapat dibuat 1 kelompok verifikasi. Anda dapat mengubah data atau penugasan pada kelompok yang sudah ada di halaman daftar kelompok verifikasi.</p>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                                {periodeList.map((periode) => {
                                    const hasGroup = existingPeriodeIds.includes(periode.id);
                                    const isSelected = periode.id === periodeId;
                                    return (
                                        <div
                                            key={periode.id}
                                            onClick={() => !hasGroup && setPeriodeId(periode.id)}
                                            className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                                                hasGroup
                                                    ? 'border-gray-200 bg-gray-50/80 opacity-60 cursor-not-allowed'
                                                    : isSelected
                                                        ? 'border-[#9E1B28] bg-[#9E1B28]/5 ring-2 ring-[#9E1B28]/20 shadow-sm cursor-pointer'
                                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/70 bg-white cursor-pointer'
                                            }`}
                                        >
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-md bg-white border border-gray-200 text-gray-700">
                                                        {periode.jenis}
                                                    </span>
                                                    <div className="flex items-center gap-1.5">
                                                        {hasGroup && (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                                                                Sudah Ada Kelompok
                                                            </span>
                                                        )}
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                            periode.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                        }`}>
                                                            {periode.status}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="font-black text-sm text-gray-900 leading-snug">
                                                    {periode.nama}
                                                </div>
                                                <div className="text-xs text-gray-500 font-medium">
                                                    Tahun Ajaran: <span className="font-semibold text-gray-800">{periode.tahun_ajaran?.nama || (periode.tahun_ajaran?.tahun_mulai ? `${periode.tahun_ajaran.tahun_mulai}/${periode.tahun_ajaran.tahun_selesai}` : '-')}</span>
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs gap-2">
                                                <span className="text-[11px] text-gray-400 truncate">
                                                    {formatDate(periode.tanggal_mulai)} s/d {formatDate(periode.tanggal_selesai)}
                                                </span>
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                                    hasGroup
                                                        ? 'border border-gray-300 bg-gray-100 text-gray-400'
                                                        : isSelected
                                                            ? 'bg-[#9E1B28] text-white shadow-xs'
                                                            : 'border-2 border-gray-300 bg-white'
                                                }`}>
                                                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {periodeList.length === 0 && (
                                <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-xs text-gray-500">
                                    Belum ada periode verifikasi berstatus ACTIVE atau DRAFT.
                                </div>
                            )}
                        </div>
                    )}

                    {/* ================= STEP 2: PILIH MATA KULIAH ================= */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-base font-extrabold text-gray-900">Langkah 2: Pilih Mata Kuliah Target</h2>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Pilih satu atau beberapa mata kuliah yang akan ditugaskan dalam kelompok ini ({selectedMkIds.length} dipilih).
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedMkIds(filteredMkList.map((m) => m.id))}
                                        className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                                    >
                                        Pilih Semua
                                    </button>
                                    {selectedMkIds.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedMkIds([])}
                                            className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors cursor-pointer"
                                        >
                                            Reset Pilihan
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Search and Filters */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-1">
                                <div className="relative flex-1">
                                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={mkSearch}
                                        onChange={(e) => setMkSearch(e.target.value)}
                                        placeholder="Cari kode atau nama mata kuliah..."
                                        className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9E1B28]/15 focus:border-[#9E1B28]"
                                    />
                                </div>
                                <select
                                    value={semesterFilter}
                                    onChange={(e) => setSemesterFilter(e.target.value)}
                                    className="px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#9E1B28]/15 focus:border-[#9E1B28] text-gray-700 font-semibold"
                                >
                                    <option value="ALL">Semua Semester</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                                        <option key={s} value={s}>Semester {s}</option>
                                    ))}
                                </select>
                            </div>

                            {/* MK List Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[480px] overflow-y-auto pr-1">
                                {filteredMkList.map((mk) => {
                                    const isSelected = selectedMkIds.includes(mk.id);
                                    return (
                                        <div
                                            key={mk.id}
                                            onClick={() => handleToggleMk(mk.id)}
                                            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                                                isSelected
                                                    ? 'border-[#9E1B28] bg-[#9E1B28]/5 ring-1.5 ring-[#9E1B28]/20'
                                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/70 bg-white'
                                            }`}
                                        >
                                            <div className="space-y-1 pr-2">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-xs font-black text-gray-900">{mk.kode_mk}</span>
                                                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                                                        {mk.sks} SKS
                                                    </span>
                                                    {mk.semester && (
                                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                                            Sem. {mk.semester}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs font-bold text-gray-800 leading-snug line-clamp-1">
                                                    {mk.nama_mk}
                                                </div>
                                            </div>

                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                                isSelected ? 'bg-[#9E1B28] text-white shadow-xs' : 'border-2 border-gray-300 bg-white'
                                            }`}>
                                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {filteredMkList.length === 0 && (
                                <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-xs text-gray-500">
                                    Tidak ada mata kuliah yang cocok dengan kata kunci pencarian.
                                </div>
                            )}
                        </div>
                    )}

                    {/* ================= STEP 3: PENETAPAN KOORDINATOR PER MK + NAMA KELOMPOK ================= */}
                    {step === 3 && (
                        <div className="space-y-5">
                            {/* Nama & Keterangan di atas */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-gray-200/70">
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Nama Kelompok Verifikasi <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={namaKelompok}
                                        onChange={(e) => setNamaKelompok(e.target.value)}
                                        placeholder="Contoh: Kelompok Sistem Informasi - UTS Ganjil 2026"
                                        className="w-full p-2.5 text-xs font-bold text-gray-900 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#9E1B28]/15 focus:border-[#9E1B28]"
                                    />
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Keterangan (Opsional)
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={keterangan}
                                        onChange={(e) => setKeterangan(e.target.value)}
                                        placeholder="Catatan tambahan untuk kelompok ini..."
                                        className="w-full p-2.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#9E1B28]/15 focus:border-[#9E1B28] resize-none"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-base font-extrabold text-gray-900">Penetapan Koordinator per Mata Kuliah</h2>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Tugaskan Koordinator MK (1-3 Dosen) untuk setiap mata kuliah terpilih. Verifikator akan ditentukan oleh koordinator setelah kelompok disimpan.
                                    </p>
                                </div>

                                {copyNotification && (
                                    <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-1.5 animate-in fade-in duration-200">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        {copyNotification}
                                    </div>
                                )}
                            </div>

                            {/* Cards list per Mata Kuliah */}
                            <div className="space-y-6">
                                {selectedMkIds.map((mkId, idx) => {
                                    const mk = mkAll.find((m) => m.id === mkId);
                                    const currentCoordinatorList = mkCoordinatorMap[mkId] || [];

                                    return (
                                        <div
                                            key={mkId}
                                            className="p-5 rounded-2xl border border-gray-200/90 bg-white shadow-xs space-y-4 hover:border-gray-300 transition-all"
                                        >
                                            {/* Course Header */}
                                            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-6 h-6 rounded-lg bg-[#9E1B28]/10 text-[#9E1B28] font-black text-xs flex items-center justify-center">
                                                        {idx + 1}
                                                    </span>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-black text-sm text-gray-900">{mk?.kode_mk}</span>
                                                            <span className="text-xs font-bold text-gray-700">— {mk?.nama_mk}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                                                        {mk?.sks} SKS
                                                    </span>
                                                    {mk?.semester && (
                                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                                                            Sem. {mk?.semester}
                                                        </span>
                                                    )}
                                                    {selectedMkIds.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleMk(mkId)}
                                                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                            title="Hapus mata kuliah ini dari penetapan"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* KOORDINATOR PICKER (Searchable, Max 3) */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <label className="block text-[11px] font-extrabold text-gray-700 uppercase tracking-wider">
                                                            Dosen Koordinator MK <span className="text-red-500">*</span>
                                                        </label>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                            currentCoordinatorList.length >= 3
                                                                ? 'bg-amber-100 text-amber-800 font-extrabold'
                                                                : currentCoordinatorList.length > 0
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : 'bg-gray-100 text-gray-500'
                                                        }`}>
                                                            {currentCoordinatorList.length}/3 Dosen
                                                        </span>
                                                    </div>
                                                    {selectedMkIds.length > 1 && currentCoordinatorList.length > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopyCoordinatorsToAll(mkId)}
                                                            className="inline-flex items-center gap-1 text-[10px] font-bold text-[#9E1B28] hover:text-[#681219] hover:underline cursor-pointer"
                                                            title="Salin koordinator MK ini ke semua MK lainnya"
                                                        >
                                                            <Copy className="w-3 h-3" /> Terapkan ke Semua MK
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Dropdown to add coordinator if under 3 */}
                                                {currentCoordinatorList.length < 3 ? (
                                                    <SearchableSelect
                                                        options={getKoordinatorOptionsForMk(mkId)}
                                                        value=""
                                                        onChange={(val) => {
                                                            if (val) handleToggleCoordinator(mkId, val);
                                                        }}
                                                        placeholder="+ Tambah Dosen Koordinator..."
                                                        searchPlaceholder="Cari dosen untuk ditambahkan sebagai koordinator..."
                                                    />
                                                ) : (
                                                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                        Batas maksimal 3 koordinator telah terpenuhi
                                                    </div>
                                                )}

                                                {/* Selected Coordinator Chips */}
                                                <div className="min-h-[38px] p-2 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-wrap gap-1.5 items-center">
                                                    {currentCoordinatorList.length > 0 ? (
                                                        currentCoordinatorList.map((kId) => {
                                                            const kObj = dosenAll.find((d) => d.id === kId);
                                                            return (
                                                                <span
                                                                    key={kId}
                                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-[#9E1B28] border border-red-200 rounded-lg text-xs font-bold animate-in fade-in duration-100"
                                                                >
                                                                    <GraduationCap className="w-3 h-3 text-[#9E1B28] shrink-0" />
                                                                    <span className="truncate max-w-[200px]">
                                                                        {kObj?.kode_dosen} - {kObj?.nama_lengkap}
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleToggleCoordinator(mkId, kId)}
                                                                        className="text-red-400 hover:text-red-700 rounded-full transition-colors cursor-pointer"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                </span>
                                                            );
                                                        })
                                                    ) : (
                                                        <span className="text-[11px] text-amber-700 italic flex items-center gap-1">
                                                            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                                            Pilih minimal 1 dosen koordinator (maks 3)
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Add Additional MK Section */}
                            {unselectedMks.length > 0 ? (
                                <div className="pt-2">
                                    {!showAddMkSelector ? (
                                        <button
                                            type="button"
                                            onClick={() => setShowAddMkSelector(true)}
                                            className="w-full py-3.5 border-2 border-dashed border-gray-300 hover:border-[#9E1B28] bg-gray-50/70 hover:bg-[#9E1B28]/5 rounded-2xl flex items-center justify-center gap-2.5 text-xs font-extrabold text-gray-600 hover:text-[#9E1B28] transition-all cursor-pointer group shadow-2xs"
                                        >
                                            <div className="w-7 h-7 rounded-xl bg-white group-hover:bg-[#9E1B28] text-gray-500 group-hover:text-white flex items-center justify-center shadow-xs border border-gray-200 group-hover:border-[#9E1B28] transition-all">
                                                <Plus className="w-4 h-4" />
                                            </div>
                                            <span>Tambah Penetapan Mata Kuliah</span>
                                            <span className="text-[11px] font-normal text-gray-400">({unselectedMks.length} mata kuliah tersedia)</span>
                                        </button>
                                    ) : (
                                        <div className="p-5 bg-slate-50 border-2 border-[#9E1B28]/30 rounded-2xl space-y-3.5 animate-in fade-in duration-150 shadow-xs">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <BookOpen className="w-4 h-4 text-[#9E1B28]" />
                                                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                                                        Pilih Mata Kuliah untuk Ditambahkan
                                                    </h4>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => { setShowAddMkSelector(false); setAddMkSearch(''); }}
                                                    className="text-xs font-bold text-gray-400 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-200/60 transition-colors cursor-pointer"
                                                >
                                                    Batal
                                                </button>
                                            </div>

                                            <div className="relative">
                                                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                                <input
                                                    type="text"
                                                    value={addMkSearch}
                                                    onChange={(e) => setAddMkSearch(e.target.value)}
                                                    placeholder="Ketik kode atau nama mata kuliah yang ingin ditambahkan..."
                                                    className="w-full pl-10 pr-4 py-2 text-xs font-semibold border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#9E1B28]/20 focus:border-[#9E1B28]"
                                                    autoFocus
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                                                {filteredUnselectedMks.length === 0 ? (
                                                    <div className="col-span-2 text-center py-6 text-xs text-gray-400 font-semibold">
                                                        Tidak ada mata kuliah yang cocok dengan kata kunci pencarian.
                                                    </div>
                                                ) : (
                                                    filteredUnselectedMks.map((m) => (
                                                        <div
                                                            key={m.id}
                                                            onClick={() => handleAddAdditionalMk(m)}
                                                            className="p-3 bg-white hover:bg-[#9E1B28]/5 border border-gray-200 hover:border-[#9E1B28] rounded-xl flex items-center justify-between cursor-pointer transition-all group shadow-2xs"
                                                        >
                                                            <div className="min-w-0 pr-2">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="font-extrabold text-xs text-gray-900 group-hover:text-[#9E1B28]">{m.kode_mk}</span>
                                                                    <span className="text-[10px] font-bold px-1.5 py-0.2 bg-gray-100 text-gray-600 rounded">
                                                                        {m.sks} SKS
                                                                    </span>
                                                                    {m.semester && (
                                                                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-blue-50 text-blue-600 rounded">
                                                                            Sem. {m.semester}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-gray-600 font-medium truncate mt-0.5">{m.nama_mk}</p>
                                                            </div>
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#9E1B28] bg-red-50 px-2.5 py-1 rounded-lg border border-red-200/80 group-hover:bg-[#9E1B28] group-hover:text-white transition-all shrink-0">
                                                                <Plus className="w-3.5 h-3.5" /> Tambah
                                                            </span>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-3 text-xs text-gray-400 font-medium">
                                    Semua mata kuliah telah ditambahkan ke dalam penetapan.
                                </div>
                            )}
                        </div>
                    )}


                    {/* STEP NAVIGATION BUTTONS */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        {step > 1 ? (
                            <button
                                type="button"
                                onClick={handlePrev}
                                className="p-2.5 bg-white hover:bg-gray-100 text-gray-600 rounded-xl border border-gray-200 transition-colors cursor-pointer inline-flex items-center gap-1.5 text-xs font-bold shadow-2xs"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>Kembali</span>
                            </button>
                        ) : <div />}

                        <div className="flex items-center gap-3">
                            {step < 3 ? (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    disabled={!canAdvance()}
                                    className={`inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white rounded-xl transition-all ${
                                        canAdvance()
                                            ? 'bg-[#9E1B28] hover:bg-[#681219] shadow-md shadow-[#9E1B28]/20 cursor-pointer'
                                            : 'bg-gray-300 cursor-not-allowed'
                                    }`}
                                >
                                    Lanjut <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    disabled={loading || !namaKelompok.trim() || !canAdvance()}
                                    onClick={() => handleSubmit()}
                                    className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-[#9E1B28] hover:bg-[#681219] rounded-xl shadow-md shadow-[#9E1B28]/20 transition-all cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    <Save className="w-3.5 h-3.5" /> Simpan Kelompok
                                </button>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
