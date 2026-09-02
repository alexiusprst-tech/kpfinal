import React, { useState, useMemo } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { showToast, showAlert, showConfirm } from '@/Utils/sweetalert';
import SearchableSelect from '@/Components/SearchableSelect';

import {
    ArrowLeft, Check, CheckCircle2, Clock, FolderKanban, Info,
    Plus, Search, Shield, Trash2, Users, BookOpen, Calendar,
    AlertCircle, Save, Sparkles, X, PowerOff, Play, Copy, CheckCheck,
    GraduationCap
} from 'lucide-react';

export default function KelompokVerifikasiEdit({ kelompok, periodeAll = [], mkAll = [], dosenAll = [] }) {
    const { errors } = usePage().props;
    const [submitting, setSubmitting] = useState(false);
    const [copyNotification, setCopyNotification] = useState('');

    // Initial state from existing group
    const [namaKelompok, setNamaKelompok] = useState(kelompok.nama || '');
    const [periodeId, setPeriodeId] = useState(kelompok.periode_id || '');
    const [keterangan, setKeterangan] = useState(kelompok.keterangan || '');
    const [status, setStatus] = useState(kelompok.status || 'DRAFT');

    const initialMkIds = (kelompok.mata_kuliah || []).map((kmk) => kmk.mata_kuliah_id);
    
    // Initial Coordinator Map: { [mkId]: [dosenId, ...] }
    const initialCoordinatorMap = {};
    (kelompok.mata_kuliah || []).forEach((kmk) => {
        // Check if kelompok has koordinator relation
        const kForThisMk = (kelompok.koordinator || [])
            .filter((kk) => kk.mata_kuliah_id === kmk.mata_kuliah_id)
            .map((kk) => kk.dosen_id);

        if (kForThisMk.length > 0) {
            initialCoordinatorMap[kmk.mata_kuliah_id] = kForThisMk;
        } else if (kmk.koordinator_id) {
            initialCoordinatorMap[kmk.mata_kuliah_id] = [kmk.koordinator_id];
        } else {
            initialCoordinatorMap[kmk.mata_kuliah_id] = [];
        }
    });

    // Initial Verifikator Map: { [mkId]: [dosenId, ...] }
    const initialVerifikatorMap = {};
    (kelompok.mata_kuliah || []).forEach((kmk) => {
        const vForThisMk = (kelompok.verifikator || [])
            .filter((kv) => kv.mata_kuliah_id === kmk.mata_kuliah_id)
            .map((kv) => kv.dosen_id);
        initialVerifikatorMap[kmk.mata_kuliah_id] = vForThisMk;
    });

    const [selectedMkIds, setSelectedMkIds] = useState(initialMkIds);
    const [mkCoordinatorMap, setMkCoordinatorMap] = useState(initialCoordinatorMap);
    const [mkVerifikatorMap, setMkVerifikatorMap] = useState(initialVerifikatorMap);

    // MK Search & Filter
    const [mkSearch, setMkSearch] = useState('');
    const [mkSemesterFilter, setMkSemesterFilter] = useState('');

    // Filtered MK List
    const filteredMkList = useMemo(() => {
        return mkAll.filter((mk) => {
            const matchSearch = mkSearch === '' ||
                mk.kode_mk.toLowerCase().includes(mkSearch.toLowerCase()) ||
                mk.nama_mk.toLowerCase().includes(mkSearch.toLowerCase());
            const matchSemester = mkSemesterFilter === '' || String(mk.semester) === String(mkSemesterFilter);
            return matchSearch && matchSemester;
        });
    }, [mkAll, mkSearch, mkSemesterFilter]);

    const toggleMkSelection = (mkId) => {
        setSelectedMkIds((prev) => {
            if (prev.includes(mkId)) {
                const next = prev.filter((id) => id !== mkId);
                setMkCoordinatorMap((cMap) => {
                    const copy = { ...cMap };
                    delete copy[mkId];
                    return copy;
                });
                setMkVerifikatorMap((vMap) => {
                    const copy = { ...vMap };
                    delete copy[mkId];
                    return copy;
                });
                return next;
            } else {
                return [...prev, mkId];
            }
        });
    };

    const handleToggleCoordinator = (mkId, dosenId) => {
        if (!dosenId) return;

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

    const handleToggleVerifikator = (mkId, dosenId) => {
        if (!dosenId) return;

        setMkVerifikatorMap((prev) => {
            const currentList = prev[mkId] || [];
            if (currentList.includes(dosenId)) {
                return {
                    ...prev,
                    [mkId]: currentList.filter((id) => id !== dosenId),
                };
            } else {
                if (currentList.length >= 5) {
                    showToast('warning', 'Maksimal 5 dosen verifikator untuk setiap mata kuliah.');
                    return prev;
                }
                return {
                    ...prev,
                    [mkId]: [...currentList, dosenId],
                };
            }

        });
    };

    const handleCopyVerifikatorsToAll = (sourceMkId) => {
        const sourceList = (mkVerifikatorMap[sourceMkId] || []).slice(0, 5);
        if (sourceList.length === 0) return;

        setMkVerifikatorMap((prev) => {
            const updated = { ...prev };
            selectedMkIds.forEach((mkId) => {
                const koorList = mkCoordinatorMap[mkId] || [];
                updated[mkId] = sourceList.filter((id) => !koorList.includes(id));
            });
            return updated;
        });

        setCopyNotification('Verifikator berhasil disalin ke semua MK!');
        setTimeout(() => setCopyNotification(''), 3000);
    };

    const handleCopyCoordinatorsToAll = (sourceMkId) => {
        const sourceList = (mkCoordinatorMap[sourceMkId] || []).slice(0, 3);
        if (sourceList.length === 0) return;

        setMkCoordinatorMap((prev) => {
            const updated = { ...prev };
            selectedMkIds.forEach((mkId) => {
                const verifList = mkVerifikatorMap[mkId] || [];
                updated[mkId] = sourceList.filter((id) => !verifList.includes(id));
            });
            return updated;
        });

        setCopyNotification('Koordinator berhasil disalin ke semua MK!');
        setTimeout(() => setCopyNotification(''), 3000);
    };

    // Dynamic options for Koordinator dropdown
    const getKoordinatorOptionsForMk = (currentMkId) => {
        const thisMkCoors = mkCoordinatorMap[currentMkId] || [];
        const thisMkVerifs = mkVerifikatorMap[currentMkId] || [];

        return dosenAll.map((d) => {
            const isThisMkKoor = thisMkCoors.includes(d.id);
            const isThisMkVerif = thisMkVerifs.includes(d.id);

            const isDisabled = isThisMkKoor || isThisMkVerif;
            let badge = null;
            if (isThisMkKoor) {
                badge = 'Dipilih';
            } else if (isThisMkVerif) {
                badge = 'Verifikator MK ini';
            }

            return {
                value: d.id,
                label: `${d.kode_dosen} – ${d.nama_lengkap}`,
                disabled: isDisabled,
                badge: badge,
            };
        });
    };

    // Dynamic options for Verifikator dropdown
    const getVerifikatorOptionsForMk = (currentMkId) => {
        const thisMkCoors = mkCoordinatorMap[currentMkId] || [];
        const thisMkVerifs = mkVerifikatorMap[currentMkId] || [];

        return dosenAll.map((d) => {
            const isThisMkKoor = thisMkCoors.includes(d.id);
            const isThisMkVerif = thisMkVerifs.includes(d.id);

            const isDisabled = isThisMkVerif || isThisMkKoor;
            let badge = null;
            if (isThisMkVerif) {
                badge = 'Dipilih';
            } else if (isThisMkKoor) {
                badge = 'Koor MK ini';
            }

            return {
                value: d.id,
                label: `${d.kode_dosen} – ${d.nama_lengkap}`,
                disabled: isDisabled,
                badge: badge,
            };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (selectedMkIds.length === 0) {
            showAlert({
                title: 'Mata Kuliah Belum Dipilih',
                text: 'Silakan pilih minimal satu mata kuliah target verifikasi.',
                icon: 'warning',
            });
            return;
        }

        for (const mkId of selectedMkIds) {
            const mk = mkAll.find((m) => m.id === mkId);
            const koors = mkCoordinatorMap[mkId] || [];
            const verifs = mkVerifikatorMap[mkId] || [];

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
            if (verifs.length === 0) {
                showAlert({
                    title: 'Verifikator Belum Ditentukan',
                    text: `Mata kuliah ${mk?.kode_mk} - ${mk?.nama_mk} belum memiliki tim dosen verifikator.`,
                    icon: 'warning',
                });
                return;
            }
            if (verifs.length > 5) {
                showAlert({
                    title: 'Verifikator Melebihi Batas',
                    text: `Mata kuliah ${mk?.kode_mk} - ${mk?.nama_mk} memiliki lebih dari 5 verifikator.`,
                    icon: 'warning',
                });
                return;
            }
        }


        const payload = {
            nama: namaKelompok,
            periode_id: periodeId,
            keterangan: keterangan,
            status: status,
            mata_kuliah: selectedMkIds.map((id) => ({
                mata_kuliah_id: id,
                koordinator_ids: mkCoordinatorMap[id] || [],
                verifikator_ids: mkVerifikatorMap[id] || [],
            })),
        };

        setSubmitting(true);
        router.put(`/superadmin/kelompok-verifikasi/${kelompok.id}`, payload, {
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <AuthenticatedLayout title={`Edit ${kelompok.nama}`}>
            <Head title={`Edit ${kelompok.nama} - Super Admin`} />

            <div className="w-full space-y-6 pb-16">
                
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href={`/superadmin/kelompok-verifikasi/${kelompok.id}`}
                            className="p-2 bg-white hover:bg-gray-100 text-gray-600 rounded-xl border border-gray-200 transition-colors cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-black text-gray-900 tracking-tight">Edit Kelompok Verifikasi</h1>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                                Perbarui informasi, mata kuliah, koordinator (maks 3), dan tim verifikator (maks 5)
                            </p>
                        </div>
                    </div>
                </div>

                {/* Validation Errors Notice */}
                {errors && Object.keys(errors).length > 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 space-y-1">
                        <div className="flex items-center gap-2 font-bold text-red-800">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            Mohon perbaiki data input berikut:
                        </div>
                        <ul className="list-disc pl-5 space-y-0.5 mt-1 font-medium">
                            {Object.values(errors).map((err, idx) => (
                                <li key={idx}>{err}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Toast Notification */}
                {copyNotification && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center gap-2 animate-in fade-in duration-200">
                        <CheckCheck className="w-4 h-4 text-emerald-600" />
                        {copyNotification}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Master Information Card */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
                        <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider pb-2 border-b border-gray-100">
                            Informasi Kelompok
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Nama Kelompok <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={namaKelompok}
                                    onChange={(e) => setNamaKelompok(e.target.value)}
                                    className="w-full p-2.5 text-xs font-bold text-gray-900 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#801720]/15 focus:border-[#801720]"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Periode Verifikasi <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={periodeId}
                                    onChange={(e) => setPeriodeId(e.target.value)}
                                    className="w-full p-2.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#801720]/15 focus:border-[#801720] font-semibold"
                                    required
                                >
                                    {periodeAll.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.nama} — {p.tahun_ajaran?.nama || ''} ({p.status})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Status Kelompok <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full p-2.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#801720]/15 focus:border-[#801720] font-bold"
                                    required
                                >
                                    <option value="DRAFT">DRAFT (Belum diterbitkan ke dosen)</option>
                                    <option value="ACTIVE">ACTIVE (Penugasan aktif & berjalan)</option>
                                    <option value="INACTIVE">INACTIVE (Penugasan dinonaktifkan)</option>
                                    <option value="CLOSED">CLOSED (Penugasan ditutup / selesai)</option>
                                </select>
                            </div>

                            <div className="space-y-1.5 md:col-span-2">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Keterangan / Catatan Tambahan (Opsional)
                                </label>
                                <textarea
                                    rows={2}
                                    value={keterangan}
                                    onChange={(e) => setKeterangan(e.target.value)}
                                    className="w-full p-2.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#801720]/15 focus:border-[#801720] resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Target Courses Selection Card */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                            <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">
                                Pilih Mata Kuliah Target ({selectedMkIds.length} Dipilih)
                            </h2>
                        </div>

                        {/* Search & Filter */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                            <div className="relative sm:col-span-2">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={mkSearch}
                                    onChange={(e) => setMkSearch(e.target.value)}
                                    placeholder="Cari Kode atau Nama Mata Kuliah..."
                                    className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#801720]/15 focus:border-[#801720]"
                                />
                            </div>
                            <div>
                                <select
                                    value={mkSemesterFilter}
                                    onChange={(e) => setMkSemesterFilter(e.target.value)}
                                    className="w-full py-2 px-3 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#801720]/15 focus:border-[#801720]"
                                >
                                    <option value="">Semua Semester</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                                        <option key={sem} value={sem}>Semester {sem}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* MK List Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                            {filteredMkList.map((mk) => {
                                const isSelected = selectedMkIds.includes(mk.id);
                                return (
                                    <div
                                        key={mk.id}
                                        onClick={() => toggleMkSelection(mk.id)}
                                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 select-none ${
                                            isSelected
                                                ? 'bg-[#801720]/5 border-[#801720] ring-1.5 ring-[#801720]/20'
                                                : 'bg-white border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="flex-1 min-w-0 pr-2">
                                            <span className="font-extrabold text-xs text-gray-900">{mk.kode_mk}</span>
                                            <p className="text-xs font-bold text-gray-800 truncate">{mk.nama_mk}</p>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                            isSelected ? 'bg-[#801720] text-white shadow-xs' : 'border-2 border-gray-300 bg-white'
                                        }`}>
                                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Per-MK Koordinator and Verifikator Assignment Card */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                            <div>
                                <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">
                                    Penetapan Koordinator (Maks 3) & Verifikator (Maks 5) per Mata Kuliah
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Gunakan pencarian nama/kode dosen untuk menetapkan koordinator dan verifikator masing-masing MK.
                                </p>
                            </div>
                            <span className="text-xs font-bold text-[#801720] bg-[#801720]/10 px-3 py-1.5 rounded-xl">
                                {selectedMkIds.length} MK Dikonfigurasi
                            </span>
                        </div>

                        <div className="space-y-4">
                            {selectedMkIds.map((mkId, idx) => {
                                const mk = mkAll.find((m) => m.id === mkId);
                                const currentCoordinatorList = mkCoordinatorMap[mkId] || [];
                                const currentVerifikatorList = mkVerifikatorMap[mkId] || [];

                                return (
                                    <div
                                        key={mkId}
                                        className="p-5 rounded-2xl border border-gray-200/80 bg-slate-50/40 space-y-4 shadow-2xs"
                                    >
                                        {/* MK Header */}
                                        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                            <div className="flex items-center gap-2.5">
                                                <span className="w-6 h-6 rounded-xl bg-[#801720] text-white flex items-center justify-center text-xs font-black">
                                                    {idx + 1}
                                                </span>
                                                <span className="font-black text-sm text-gray-900">{mk?.kode_mk}</span>
                                                <span className="text-xs font-bold text-gray-700">— {mk?.nama_mk}</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                                                {mk?.sks} SKS
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                            
                                            {/* 1. Koordinator Searchable (Max 3) */}
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
                                                            className="inline-flex items-center gap-1 text-[10px] font-bold text-[#801720] hover:underline cursor-pointer"
                                                        >
                                                            <Copy className="w-3 h-3" /> Terapkan ke Semua MK
                                                        </button>
                                                    )}
                                                </div>

                                                {currentCoordinatorList.length < 3 ? (
                                                    <SearchableSelect
                                                        options={getKoordinatorOptionsForMk(mkId)}
                                                        value=""
                                                        onChange={(val) => {
                                                            if (val) handleToggleCoordinator(mkId, val);
                                                        }}
                                                        placeholder="+ Tambah Dosen Koordinator..."
                                                        searchPlaceholder="Ketik kode dosen atau nama dosen..."
                                                    />
                                                ) : (
                                                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                        Batas maksimal 3 koordinator telah terpenuhi
                                                    </div>
                                                )}

                                                <div className="min-h-[38px] p-2 bg-white border border-gray-200 rounded-xl flex flex-wrap gap-1.5 items-center">
                                                    {currentCoordinatorList.length > 0 ? (
                                                        currentCoordinatorList.map((kId) => {
                                                            const kObj = dosenAll.find((d) => d.id === kId);
                                                            return (
                                                                <span
                                                                    key={kId}
                                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-[#801720] border border-red-200 rounded-lg text-xs font-bold"
                                                                >
                                                                    <GraduationCap className="w-3 h-3 text-[#801720] shrink-0" />
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

                                            {/* 2. Verifikator per MK (Max 5) */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <label className="block text-[11px] font-extrabold text-gray-700 uppercase tracking-wider">
                                                            Tim Verifikator MK <span className="text-red-500">*</span>
                                                        </label>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                            currentVerifikatorList.length >= 5
                                                                ? 'bg-amber-100 text-amber-800 font-extrabold'
                                                                : currentVerifikatorList.length > 0
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : 'bg-gray-100 text-gray-500'
                                                        }`}>
                                                            {currentVerifikatorList.length}/5 Dosen
                                                        </span>
                                                    </div>
                                                    {selectedMkIds.length > 1 && currentVerifikatorList.length > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopyVerifikatorsToAll(mkId)}
                                                            className="inline-flex items-center gap-1 text-[10px] font-bold text-[#801720] hover:underline cursor-pointer"
                                                        >
                                                            <Copy className="w-3 h-3" /> Terapkan ke Semua MK
                                                        </button>
                                                    )}
                                                </div>

                                                {currentVerifikatorList.length < 5 ? (
                                                    <SearchableSelect
                                                        options={getVerifikatorOptionsForMk(mkId)}
                                                        value=""
                                                        onChange={(val) => {
                                                            if (val) handleToggleVerifikator(mkId, val);
                                                        }}
                                                        placeholder="+ Tambah Dosen Verifikator..."
                                                        searchPlaceholder="Cari dosen untuk ditambahkan..."
                                                    />
                                                ) : (
                                                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                        Batas maksimal 5 verifikator telah terpenuhi
                                                    </div>
                                                )}

                                                <div className="min-h-[38px] p-2 bg-white border border-gray-200 rounded-xl flex flex-wrap gap-1.5 items-center">
                                                    {currentVerifikatorList.length > 0 ? (
                                                        currentVerifikatorList.map((vId) => {
                                                            const vObj = dosenAll.find((d) => d.id === vId);
                                                            return (
                                                                <span
                                                                    key={vId}
                                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-xs font-bold"
                                                                >
                                                                    <Shield className="w-3 h-3 text-blue-600 shrink-0" />
                                                                    <span className="truncate max-w-[200px]">
                                                                        {vObj?.kode_dosen} - {vObj?.nama_lengkap}
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleToggleVerifikator(mkId, vId)}
                                                                        className="text-blue-400 hover:text-red-500 rounded-full transition-colors cursor-pointer"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                </span>
                                                            );
                                                        })
                                                    ) : (
                                                        <span className="text-[11px] text-amber-700 italic flex items-center gap-1">
                                                            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                                            Pilih minimal 1 dosen verifikator untuk MK ini
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Submit Buttons Card */}
                    <div className="flex items-center justify-between bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
                        <Link
                            href={`/superadmin/kelompok-verifikasi/${kelompok.id}`}
                            className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                        >
                            Batal
                        </Link>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#801720] hover:bg-[#681219] text-white text-xs font-extrabold rounded-xl shadow-md shadow-[#801720]/20 transition-all cursor-pointer disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>

                </form>
            </div>
        </AuthenticatedLayout>
    );
}
