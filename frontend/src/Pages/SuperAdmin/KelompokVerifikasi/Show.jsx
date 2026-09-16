import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ArrowLeft, BookOpen, Calendar, CheckCircle2, Clock, Copy, Edit, FileCheck,
    FolderKanban, GraduationCap, History, Lock, MoreVertical, Pencil, Play, PowerOff,
    RotateCcw, Save, Shield, Sparkles, Trash2, Users, X, AlertCircle, TrendingUp
} from 'lucide-react';

import FlashAlert from '@/Components/FlashAlert';
import SearchableSelect from '@/Components/SearchableSelect';
import { showToast, showAlert, showConfirm } from '@/Utils/sweetalert';
import { formatDate, formatDateTime } from '@/Utils/date';

// Dosen dianggap "Dosen Tetap" kecuali kategorinya eksplisit Luar Biasa (LB) —
// hanya Dosen Tetap yang boleh menjadi Verifikator Soal.
function isDosenTetap(dosen) {
    if (!dosen) return false;
    if (typeof dosen.is_dosen_tetap === 'boolean') return dosen.is_dosen_tetap;
    const kat = String(dosen.kategori_dosen || '').trim().toUpperCase();
    return !['LB', 'LUAR_BIASA', 'DOSEN LUAR BIASA'].includes(kat);
}



const STATUS_CONFIG = {
    DRAFT:    { label: 'Draf',      bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200/60', dot: 'bg-amber-500' },
    ACTIVE:   { label: 'Aktif',     bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/60', dot: 'bg-emerald-500' },
    INACTIVE: { label: 'Nonaktif',  bg: 'bg-gray-100',   text: 'text-gray-600',    border: 'border-gray-200/60', dot: 'bg-gray-400' },
    CLOSED:   { label: 'Selesai',   bg: 'bg-slate-100',  text: 'text-slate-600',   border: 'border-slate-300/60', dot: 'bg-slate-500' },
};

function StatusBadge({ status }) {
    const c = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${c.bg} ${c.text} ${c.border}`}>
            <span className={`w-2 h-2 rounded-full ${c.dot}`} />
            {c.label}
        </span>
    );
}

function AssignmentModal({ kelompok, dosenAll, onClose }) {
    const mkList = kelompok.mata_kuliah || [];
    const [submitting, setSubmitting] = useState(false);

    const buildInitialCoordinatorMap = () => {
        const map = {};
        mkList.forEach((kmk) => {
            const kForThisMk = (kelompok.koordinator || [])
                .filter((kk) => kk.mata_kuliah_id === kmk.mata_kuliah_id)
                .map((kk) => kk.dosen_id);
            map[kmk.mata_kuliah_id] = kForThisMk.length > 0
                ? kForThisMk
                : (kmk.koordinator_id ? [kmk.koordinator_id] : []);
        });
        return map;
    };

    const buildInitialVerifikatorMap = () => {
        const map = {};
        mkList.forEach((kmk) => {
            map[kmk.mata_kuliah_id] = (kelompok.verifikator || [])
                .filter((kv) => kv.mata_kuliah_id === kmk.mata_kuliah_id)
                .map((kv) => kv.dosen_id);
        });
        return map;
    };

    const [mkCoordinatorMap, setMkCoordinatorMap] = useState(buildInitialCoordinatorMap);
    const [mkVerifikatorMap, setMkVerifikatorMap] = useState(buildInitialVerifikatorMap);

    const handleToggleCoordinator = (mkId, dosenId) => {
        if (!dosenId) return;
        setMkCoordinatorMap((prev) => {
            const currentList = prev[mkId] || [];
            if (currentList.includes(dosenId)) {
                return { ...prev, [mkId]: currentList.filter((id) => id !== dosenId) };
            }
            if (currentList.length >= 3) {
                showToast('warning', 'Maksimal 3 dosen koordinator untuk setiap mata kuliah.');
                return prev;
            }
            return { ...prev, [mkId]: [...currentList, dosenId] };
        });
    };

    const handleToggleVerifikator = (mkId, dosenId) => {
        if (!dosenId) return;
        const dosenObj = dosenAll.find((d) => d.id === dosenId);
        if (dosenObj && !isDosenTetap(dosenObj)) {
            showToast('error', 'Verifikator Soal hanya dapat ditentukan dari Dosen Tetap.');
            return;
        }
        setMkVerifikatorMap((prev) => {
            const currentList = prev[mkId] || [];
            if (currentList.includes(dosenId)) {
                return { ...prev, [mkId]: currentList.filter((id) => id !== dosenId) };
            }
            if (currentList.length >= 5) {
                showToast('warning', 'Maksimal 5 dosen verifikator untuk setiap mata kuliah.');
                return prev;
            }
            return { ...prev, [mkId]: [...currentList, dosenId] };
        });
    };

    const handleCopyCoordinatorsToAll = (sourceMkId) => {
        const sourceList = (mkCoordinatorMap[sourceMkId] || []).slice(0, 3);
        if (sourceList.length === 0) return;
        setMkCoordinatorMap((prev) => {
            const updated = { ...prev };
            mkList.forEach((kmk) => {
                const verifList = mkVerifikatorMap[kmk.mata_kuliah_id] || [];
                updated[kmk.mata_kuliah_id] = sourceList.filter((id) => !verifList.includes(id));
            });
            return updated;
        });
        showToast('success', 'Koordinator berhasil disalin ke semua MK.');
    };

    const handleCopyVerifikatorsToAll = (sourceMkId) => {
        const sourceList = (mkVerifikatorMap[sourceMkId] || [])
            .filter((id) => isDosenTetap(dosenAll.find((d) => d.id === id)))
            .slice(0, 5);
        if (sourceList.length === 0) return;
        setMkVerifikatorMap((prev) => {
            const updated = { ...prev };
            mkList.forEach((kmk) => {
                const koorList = mkCoordinatorMap[kmk.mata_kuliah_id] || [];
                updated[kmk.mata_kuliah_id] = sourceList.filter((id) => !koorList.includes(id));
            });
            return updated;
        });
        showToast('success', 'Verifikator berhasil disalin ke semua MK.');
    };

    const getKoordinatorOptionsForMk = (mkId) => {
        const thisMkCoors = mkCoordinatorMap[mkId] || [];
        const thisMkVerifs = mkVerifikatorMap[mkId] || [];
        return dosenAll.map((d) => {
            const isThisMkKoor = thisMkCoors.includes(d.id);
            const isThisMkVerif = thisMkVerifs.includes(d.id);
            return {
                value: d.id,
                label: `${d.kode_dosen} – ${d.nama_lengkap}`,
                disabled: isThisMkKoor || isThisMkVerif,
                badge: isThisMkKoor ? 'Dipilih' : isThisMkVerif ? 'Verifikator MK ini' : null,
            };
        });
    };

    const getVerifikatorOptionsForMk = (mkId) => {
        const thisMkCoors = mkCoordinatorMap[mkId] || [];
        const thisMkVerifs = mkVerifikatorMap[mkId] || [];
        return dosenAll.filter(isDosenTetap).map((d) => {
            const isThisMkKoor = thisMkCoors.includes(d.id);
            const isThisMkVerif = thisMkVerifs.includes(d.id);
            return {
                value: d.id,
                label: `${d.kode_dosen} – ${d.nama_lengkap}`,
                disabled: isThisMkVerif || isThisMkKoor,
                badge: isThisMkVerif ? 'Dipilih' : isThisMkKoor ? 'Koor MK ini' : null,
            };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        for (const kmk of mkList) {
            const mkId = kmk.mata_kuliah_id;
            const mk = kmk.mata_kuliah;
            const koors = mkCoordinatorMap[mkId] || [];
            const verifs = mkVerifikatorMap[mkId] || [];

            if (koors.length === 0) {
                showAlert({ title: 'Koordinator Belum Ditentukan', text: `Mata kuliah ${mk?.kode_mk} - ${mk?.nama_mk} belum memiliki dosen koordinator.`, icon: 'warning' });
                return;
            }
            if (verifs.length === 0) {
                showAlert({ title: 'Verifikator Belum Ditentukan', text: `Mata kuliah ${mk?.kode_mk} - ${mk?.nama_mk} belum memiliki tim dosen verifikator.`, icon: 'warning' });
                return;
            }
            for (const vId of verifs) {
                const vObj = dosenAll.find((d) => d.id === vId);
                if (vObj && !isDosenTetap(vObj)) {
                    showAlert({ title: 'Verifikator Tidak Valid', text: `Dosen ${vObj?.nama_lengkap || vId} (${vObj?.kode_dosen || '-'}) bukan Dosen Tetap pada mata kuliah ${mk?.nama_mk || mkId}. Verifikator Soal hanya boleh Dosen Tetap.`, icon: 'error' });
                    return;
                }
            }
        }

        const payload = {
            nama: kelompok.nama,
            periode_id: kelompok.periode_id,
            keterangan: kelompok.keterangan,
            status: kelompok.status,
            mata_kuliah: mkList.map((kmk) => ({
                mata_kuliah_id: kmk.mata_kuliah_id,
                koordinator_ids: mkCoordinatorMap[kmk.mata_kuliah_id] || [],
                verifikator_ids: mkVerifikatorMap[kmk.mata_kuliah_id] || [],
            })),
        };

        setSubmitting(true);
        router.put(`/superadmin/kelompok-verifikasi/${kelompok.id}`, payload, {
            preserveScroll: true,
            onSuccess: () => onClose(),
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
            <div
                className="bg-white rounded-3xl w-full max-w-3xl max-h-[88vh] overflow-y-auto p-6 space-y-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div>
                        <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Ubah Koordinator & Verifikator</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Perbarui penetapan dosen koordinator (maks 3) dan tim verifikator (maks 5) per mata kuliah.</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mkList.map((kmk, idx) => {
                        const mkId = kmk.mata_kuliah_id;
                        const mk = kmk.mata_kuliah;
                        const currentCoordinatorList = mkCoordinatorMap[mkId] || [];
                        const currentVerifikatorList = mkVerifikatorMap[mkId] || [];

                        return (
                            <div key={mkId} className="p-4 rounded-2xl border border-gray-200/80 bg-slate-50/40 space-y-3.5">
                                <div className="flex items-center gap-2.5 pb-2.5 border-b border-gray-100">
                                    <span className="w-6 h-6 rounded-xl bg-[#801720] text-white flex items-center justify-center text-xs font-black shrink-0">
                                        {idx + 1}
                                    </span>
                                    <span className="font-black text-sm text-gray-900">{mk?.kode_mk}</span>
                                    <span className="text-xs font-bold text-gray-700 truncate">— {mk?.nama_mk}</span>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {/* Koordinator */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <label className="block text-[11px] font-extrabold text-gray-700 uppercase tracking-wider">
                                                    Koordinator MK <span className="text-red-500">*</span>
                                                </label>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${currentCoordinatorList.length >= 3 ? 'bg-amber-100 text-amber-800' : currentCoordinatorList.length > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>
                                                    {currentCoordinatorList.length}/3
                                                </span>
                                            </div>
                                            {mkList.length > 1 && currentCoordinatorList.length > 0 && (
                                                <button type="button" onClick={() => handleCopyCoordinatorsToAll(mkId)} className="inline-flex items-center gap-1 text-[10px] font-bold text-[#801720] hover:underline cursor-pointer">
                                                    <Copy className="w-3 h-3" /> Salin ke Semua MK
                                                </button>
                                            )}
                                        </div>

                                        {currentCoordinatorList.length < 3 ? (
                                            <SearchableSelect
                                                options={getKoordinatorOptionsForMk(mkId)}
                                                value=""
                                                onChange={(val) => { if (val) handleToggleCoordinator(mkId, val); }}
                                                placeholder="+ Tambah Dosen Koordinator..."
                                                searchPlaceholder="Ketik kode atau nama dosen..."
                                            />
                                        ) : (
                                            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Batas 3 koordinator terpenuhi
                                            </div>
                                        )}

                                        <div className="min-h-[38px] p-2 bg-white border border-gray-200 rounded-xl flex flex-wrap gap-1.5 items-center">
                                            {currentCoordinatorList.length > 0 ? (
                                                currentCoordinatorList.map((kId) => {
                                                    const kObj = dosenAll.find((d) => d.id === kId);
                                                    return (
                                                        <span key={kId} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-[#801720] border border-red-200 rounded-lg text-xs font-bold">
                                                            <GraduationCap className="w-3 h-3 shrink-0" />
                                                            <span className="truncate max-w-[180px]">{kObj?.kode_dosen} - {kObj?.nama_lengkap}</span>
                                                            <button type="button" onClick={() => handleToggleCoordinator(mkId, kId)} className="text-red-400 hover:text-red-700 transition-colors cursor-pointer">
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </span>
                                                    );
                                                })
                                            ) : (
                                                <span className="text-[11px] text-amber-700 italic flex items-center gap-1">
                                                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Pilih minimal 1 koordinator
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Verifikator */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <label className="block text-[11px] font-extrabold text-gray-700 uppercase tracking-wider">
                                                    Verifikator MK <span className="text-red-500">*</span>
                                                </label>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${currentVerifikatorList.length >= 5 ? 'bg-amber-100 text-amber-800' : currentVerifikatorList.length > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>
                                                    {currentVerifikatorList.length}/5
                                                </span>
                                            </div>
                                            {mkList.length > 1 && currentVerifikatorList.length > 0 && (
                                                <button type="button" onClick={() => handleCopyVerifikatorsToAll(mkId)} className="inline-flex items-center gap-1 text-[10px] font-bold text-[#801720] hover:underline cursor-pointer">
                                                    <Copy className="w-3 h-3" /> Salin ke Semua MK
                                                </button>
                                            )}
                                        </div>

                                        {currentVerifikatorList.length < 5 ? (
                                            <SearchableSelect
                                                options={getVerifikatorOptionsForMk(mkId)}
                                                value=""
                                                onChange={(val) => { if (val) handleToggleVerifikator(mkId, val); }}
                                                placeholder="+ Tambah Dosen Verifikator (Dosen Tetap)..."
                                                searchPlaceholder="Cari dosen tetap..."
                                            />
                                        ) : (
                                            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Batas 5 verifikator terpenuhi
                                            </div>
                                        )}

                                        <div className="min-h-[38px] p-2 bg-white border border-gray-200 rounded-xl flex flex-wrap gap-1.5 items-center">
                                            {currentVerifikatorList.length > 0 ? (
                                                currentVerifikatorList.map((vId) => {
                                                    const vObj = dosenAll.find((d) => d.id === vId);
                                                    return (
                                                        <span key={vId} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-xs font-bold">
                                                            <Shield className="w-3 h-3 shrink-0 text-blue-600" />
                                                            <span className="truncate max-w-[180px]">{vObj?.kode_dosen} - {vObj?.nama_lengkap}</span>
                                                            <button type="button" onClick={() => handleToggleVerifikator(mkId, vId)} className="text-blue-400 hover:text-red-500 transition-colors cursor-pointer">
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </span>
                                                    );
                                                })
                                            ) : (
                                                <span className="text-[11px] text-amber-700 italic flex items-center gap-1">
                                                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Pilih minimal 1 verifikator
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 sticky bottom-0 bg-white">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#801720] hover:bg-[#681219] text-white text-xs font-extrabold rounded-xl shadow-md shadow-[#801720]/20 transition-all cursor-pointer disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" /> {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}


export default function KelompokVerifikasiShow({ kelompok, mkListStats, verifikatorListStats, progress, recentActivities, dosenAll = [] }) {
    const { flash } = usePage().props;
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);

    const handleAction = async (type) => {
        if (!type) return;

        if (type === 'activate') {
            const result = await showConfirm({
                title: 'Aktifkan Kelompok Verifikasi?',
                text: `Aktifkan kelompok verifikasi "${kelompok.nama}"? Dosen yang ditugaskan akan dapat mengakses modul verifikasi.`,
                icon: 'question',
                confirmButtonText: 'Ya, Aktifkan',
                confirmButtonColor: '#059669',
            });
            if (result.isConfirmed) {
                router.post(`/superadmin/kelompok-verifikasi/${kelompok.id}/activate`, {}, { preserveScroll: true });
            }
        } else if (type === 'deactivate') {
            const result = await showConfirm({
                title: 'Nonaktifkan Kelompok?',
                text: `Nonaktifkan kelompok "${kelompok.nama}"? Akses verifikasi untuk dosen di kelompok ini akan dinonaktifkan sementara.`,
                icon: 'warning',
                confirmButtonText: 'Ya, Nonaktifkan',
                confirmButtonColor: '#801720',
            });
            if (result.isConfirmed) {
                router.post(`/superadmin/kelompok-verifikasi/${kelompok.id}/deactivate`, {}, { preserveScroll: true });
            }
        } else if (type === 'delete') {
            const result = await showConfirm({
                title: 'Hapus Kelompok Verifikasi?',
                text: `Apakah Anda yakin ingin menghapus kelompok "${kelompok.nama}"?`,
                icon: 'warning',
                confirmButtonText: 'Ya, Hapus Data',
                confirmButtonColor: '#CD202E',
            });
            if (result.isConfirmed) {
                router.delete(`/superadmin/kelompok-verifikasi/${kelompok.id}`);
            }
        }
    };

    const handleRemoveAssignment = async (type, mataKuliahId, dosenId, dosenNama, kodeMk) => {
        const roleText = type === 'koordinator' ? 'Koordinator' : 'Verifikator';
        const result = await showConfirm({
            title: `Cabut Penugasan ${roleText}?`,
            text: `Apakah Anda yakin ingin mencabut penugasan ${dosenNama} sebagai ${roleText} pada mata kuliah ${kodeMk}?`,
            icon: 'warning',
            confirmButtonText: 'Ya, Cabut Penugasan',
            confirmButtonColor: '#CD202E',
        });

        if (result.isConfirmed) {
            const endpoint = type === 'koordinator'
                ? `/superadmin/kelompok-verifikasi/${kelompok.id}/remove-koordinator`
                : `/superadmin/kelompok-verifikasi/${kelompok.id}/remove-verifikator`;

            router.post(endpoint, {
                mata_kuliah_id: mataKuliahId,
                dosen_id: dosenId,
            }, {
                preserveScroll: true,
                onSuccess: () => showToast('success', `Penugasan ${dosenNama} berhasil dicabut.`),
            });
        }
    };


    return (
        <AuthenticatedLayout title={kelompok.nama}>
            <Head title={`${kelompok.nama} - Detail Kelompok`} />
            <FlashAlert flash={flash} />

            <div className="w-full space-y-6 pb-16">
                
                {/* Top Nav & Action Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/superadmin/kelompok-verifikasi"
                            className="p-2 bg-white hover:bg-gray-100 text-gray-600 rounded-xl border border-gray-200 transition-colors cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h1 className="text-xl font-black text-gray-900 tracking-tight">{kelompok.nama}</h1>
                                <StatusBadge status={kelompok.status} />
                            </div>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                                {kelompok.periode?.nama} — {kelompok.periode?.tahun_ajaran?.nama}
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        {kelompok.status === 'DRAFT' && (
                            <>
                                <Link
                                    href={`/superadmin/kelompok-verifikasi/${kelompok.id}/edit`}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold rounded-xl shadow-2xs transition-colors"
                                >
                                    <Pencil className="w-3.5 h-3.5" /> Ubah Kelompok
                                </Link>
                                <button
                                    onClick={() => handleAction('activate')}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                                >
                                    <Play className="w-3.5 h-3.5" /> Aktifkan Kelompok
                                </button>
                                <button
                                    onClick={() => handleAction('delete')}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-red-200 cursor-pointer"
                                    title="Hapus Kelompok"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </>
                        )}

                        {kelompok.status === 'ACTIVE' && (
                            <>
                                <Link
                                    href={`/superadmin/kelompok-verifikasi/${kelompok.id}/edit`}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold rounded-xl shadow-2xs transition-colors"
                                >
                                    <Pencil className="w-3.5 h-3.5" /> Ubah Kelompok
                                </Link>
                                <button
                                    onClick={() => handleAction('deactivate')}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-600/20 transition-all cursor-pointer"
                                >
                                    <PowerOff className="w-3.5 h-3.5" /> Nonaktifkan
                                </button>
                            </>
                        )}

                        {kelompok.status === 'INACTIVE' && (
                            <>
                                <Link
                                    href={`/superadmin/kelompok-verifikasi/${kelompok.id}/edit`}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold rounded-xl shadow-2xs transition-colors"
                                >
                                    <Pencil className="w-3.5 h-3.5" /> Ubah Kelompok
                                </Link>
                                <button
                                    onClick={() => handleAction('activate')}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                                >
                                    <Play className="w-3.5 h-3.5" /> Aktifkan Kembali
                                </button>
                                <button
                                    onClick={() => handleAction('delete')}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-red-200 cursor-pointer"
                                    title="Hapus"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </>
                        )}


                        {kelompok.status === 'CLOSED' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl">
                                <Lock className="w-3.5 h-3.5" /> Penugasan Ditutup (Selesai)
                            </span>
                        )}
                    </div>
                </div>

                {/* Progress Overview Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Upload Soal Progress */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-[#801720]/10 text-[#801720] rounded-xl">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">Progres Unggah Soal</h3>
                                    <p className="text-[11px] text-gray-500">Mata kuliah yang telah memiliki draft/unggah soal</p>
                                </div>
                            </div>
                            <span className="text-xl font-black text-gray-900">{progress.upload}%</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                            <div
                                className="bg-[#801720] h-full rounded-full transition-all duration-500"
                                style={{ width: `${progress.upload}%` }}
                            />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                            <span>{progress.mkWithSoal} dari {progress.totalMk} MK telah memiliki soal</span>
                        </div>
                    </div>

                    {/* Verification Progress */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">Progress Verifikasi</h3>
                                    <p className="text-[11px] text-gray-500">Soal yang telah disetujui dari soal yang direview</p>
                                </div>
                            </div>
                            <span className="text-xl font-black text-gray-900">{progress.verification}%</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                            <div
                                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${progress.verification}%` }}
                            />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                            <span>{progress.approvedSoal} dari {progress.reviewedSoal ?? progress.totalSoal} soal disetujui</span>
                            <span className="font-bold text-emerald-700">{progress.approvedSoal} Selesai</span>
                        </div>
                    </div>
                </div>

                {/* Table Section 1: Mata Kuliah dalam Kelompok */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden space-y-3">
                    <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <BookOpen className="w-5 h-5 text-[#801720]" />
                            <div>
                                <h2 className="text-sm font-extrabold text-gray-900">Mata Kuliah dalam Kelompok</h2>
                                <p className="text-[11px] text-gray-500">Status unggah dan progres verifikasi per mata kuliah</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                                {mkListStats.length} Mata Kuliah
                            </span>
                            {kelompok.status !== 'CLOSED' && (
                                <button
                                    type="button"
                                    onClick={() => setShowAssignmentModal(true)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
                                    title="Ubah dosen koordinator & verifikator per mata kuliah"
                                >
                                    <Pencil className="w-3.5 h-3.5" /> Edit
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-400 font-extrabold uppercase tracking-wider text-[10px]">
                                <tr>
                                    <th className="py-3 px-4 w-12 text-center">No</th>
                                    <th className="py-3 px-4 min-w-[100px]">Kode MK</th>
                                    <th className="py-3 px-4 min-w-[200px]">Nama Mata Kuliah</th>
                                    <th className="py-3 px-4 min-w-[170px]">Koordinator</th>
                                    <th className="py-3 px-4 min-w-[180px]">Verifikator MK</th>
                                    <th className="py-3 px-3 text-center">Total Soal</th>
                                    <th className="py-3 px-3 text-center">Menunggu</th>
                                    <th className="py-3 px-3 text-center">Diverifikasi</th>
                                    <th className="py-3 px-3 text-center">Revisi</th>
                                    <th className="py-3 px-3 text-center">Disetujui</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {mkListStats.map((mk, idx) => (
                                    <tr key={mk.id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="py-3 px-4 text-center font-bold text-gray-400">{idx + 1}</td>
                                        <td className="py-3 px-4 font-black text-gray-900">{mk.kode_mk}</td>
                                        <td className="py-3 px-4">
                                            <span className="font-bold text-gray-800 block">{mk.nama_mk}</span>
                                            <span className="text-[10px] text-gray-400">{mk.sks} SKS • Sem. {mk.semester || '-'}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            {mk.koordinator_list && mk.koordinator_list.length > 0 ? (
                                                <div className="space-y-1">
                                                    {mk.koordinator_list.map((k) => (
                                                        <div key={k.id} className="flex items-center justify-between gap-1 group">
                                                            <div>
                                                                <span className="font-bold text-gray-800 block">{k.kode_dosen}</span>
                                                                <span className="text-[11px] text-gray-500">{k.nama_lengkap}</span>
                                                            </div>
                                                            {kelompok.status !== 'CLOSED' && (
                                                                <button
                                                                    onClick={() => handleRemoveAssignment('koordinator', mk.mata_kuliah_id, k.id, k.nama_lengkap, mk.kode_mk)}
                                                                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all cursor-pointer"
                                                                    title={`Cabut ${k.nama_lengkap}`}
                                                                >
                                                                    <X className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : mk.koordinator ? (
                                                <div className="flex items-center justify-between gap-1 group">
                                                    <div>
                                                        <span className="font-bold text-gray-800 block">{mk.koordinator?.kode_dosen}</span>
                                                        <span className="text-[11px] text-gray-500">{mk.koordinator?.nama_lengkap}</span>
                                                    </div>
                                                    {kelompok.status !== 'CLOSED' && (
                                                        <button
                                                            onClick={() => handleRemoveAssignment('koordinator', mk.mata_kuliah_id, mk.koordinator.id, mk.koordinator.nama_lengkap, mk.kode_mk)}
                                                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all cursor-pointer"
                                                            title={`Cabut ${mk.koordinator.nama_lengkap}`}
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 italic text-[11px]">—</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            {mk.verifikator_list && mk.verifikator_list.length > 0 ? (
                                                <div className="space-y-1">
                                                    {mk.verifikator_list.map((v) => (
                                                        <div key={v.id} className="flex items-center justify-between gap-1 group">
                                                            <div>
                                                                <span className="font-bold text-gray-800 block">{v.kode_dosen}</span>
                                                                <span className="text-[11px] text-gray-500">{v.nama_lengkap}</span>
                                                            </div>
                                                            {kelompok.status !== 'CLOSED' && (
                                                                <button
                                                                    onClick={() => handleRemoveAssignment('verifikator', mk.mata_kuliah_id, v.id, v.nama_lengkap, mk.kode_mk)}
                                                                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all cursor-pointer"
                                                                    title={`Cabut ${v.nama_lengkap}`}
                                                                >
                                                                    <X className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 italic text-[11px]">—</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-3 text-center font-extrabold text-gray-900">{mk.soal_count}</td>
                                        <td className="py-3 px-3 text-center">
                                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${mk.submitted > 0 ? 'bg-blue-50 text-blue-700' : 'text-gray-300'}`}>
                                                {mk.submitted}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 text-center">
                                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${mk.in_review > 0 ? 'bg-amber-50 text-amber-700' : 'text-gray-300'}`}>
                                                {mk.in_review}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 text-center">
                                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${mk.revision > 0 ? 'bg-red-50 text-red-700' : 'text-gray-300'}`}>
                                                {mk.revision}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 text-center">
                                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${mk.approved > 0 ? 'bg-emerald-50 text-emerald-700' : 'text-gray-300'}`}>
                                                {mk.approved}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Table Section 2: Tim Verifikator */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden space-y-3">
                    <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <Shield className="w-5 h-5 text-blue-600" />
                            <div>
                                <h2 className="text-sm font-extrabold text-gray-900">Tim Verifikator</h2>
                                <p className="text-[11px] text-gray-500">Daftar dosen yang bertugas meninjau soal dalam kelompok ini</p>
                            </div>
                        </div>
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                            {verifikatorListStats.length} Verifikator
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-400 font-extrabold uppercase tracking-wider text-[10px]">
                                <tr>
                                    <th className="py-3 px-4 w-12 text-center">No</th>
                                    <th className="py-3 px-4 min-w-[110px]">Kode Dosen</th>
                                    <th className="py-3 px-4 min-w-[200px]">Nama Lengkap</th>
                                    <th className="py-3 px-4 min-w-[180px]">Mata Kuliah Ditugaskan</th>
                                    <th className="py-3 px-3 text-center">Total Soal</th>
                                    <th className="py-3 px-3 text-center">Menunggu</th>
                                    <th className="py-3 px-3 text-center">Diverifikasi</th>
                                    <th className="py-3 px-3 text-center">Minta Revisi</th>
                                    <th className="py-3 px-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {verifikatorListStats.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="text-center py-8 text-gray-400 font-medium">
                                            Belum ada tim verifikator yang ditugaskan dalam kelompok ini.
                                        </td>
                                    </tr>
                                ) : (
                                    verifikatorListStats.map((v, idx) => (
                                        <tr key={v.id || idx} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="py-3 px-4 text-center font-bold text-gray-400">{idx + 1}</td>
                                            <td className="py-3 px-4 font-black text-gray-900">{v.kode_dosen || '-'}</td>
                                            <td className="py-3 px-4">
                                                <span className="font-bold text-gray-800 block">{v.nama_lengkap || '-'}</span>
                                                <span className="text-[10px] text-gray-400">{v.email || '-'}</span>
                                            </td>
                                            <td className="py-3 px-4">
                                                {v.mata_kuliah_list && v.mata_kuliah_list.length > 0 ? (
                                                    <div className="space-y-1">
                                                        {v.mata_kuliah_list.map((mk) => (
                                                            <div key={mk.id}>
                                                                <span className="font-bold text-gray-800 block">{mk.kode_mk}</span>
                                                                <span className="text-[11px] text-gray-500">{mk.nama_mk}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] text-gray-400 italic">Semua MK Kelompok</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-3 text-center font-bold text-gray-700">{v.total_soal ?? 0}</td>
                                            <td className="py-3 px-3 text-center">
                                                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${(v.menunggu || 0) > 0 ? 'bg-amber-50 text-amber-700' : 'text-gray-300'}`}>
                                                    {v.menunggu ?? 0}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3 text-center">
                                                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${(v.diverifikasi || 0) > 0 ? 'bg-emerald-50 text-emerald-700' : 'text-gray-300'}`}>
                                                    {v.diverifikasi ?? 0}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3 text-center">
                                                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${(v.revisi || 0) > 0 ? 'bg-red-50 text-red-700' : 'text-gray-300'}`}>
                                                    {v.revisi ?? 0}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    {v.status || 'ACTIVE'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Section 3: Recent Activity Log */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
                        <History className="w-5 h-5 text-gray-600" />
                        <div>
                            <h2 className="text-sm font-extrabold text-gray-900">Aktivitas Terbaru</h2>
                            <p className="text-[11px] text-gray-500">Rekam jejak pembuatan dan perubahan pada kelompok verifikasi ini</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {recentActivities && recentActivities.length > 0 ? (
                            recentActivities.map((act) => (
                                <div key={act.id} className="flex items-start gap-3 text-xs text-gray-700">
                                    <div className="w-2 h-2 rounded-full bg-[#801720] mt-1.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-800 leading-snug">
                                            {act.description || act.action}
                                        </p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">
                                            {act.user?.name || act.user_name || 'Sistem'}
                                        </p>
                                    </div>
                                    <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                        {act.created_at ? formatDateTime(act.created_at) : '—'}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-gray-400 italic py-2">Belum ada catatan aktivitas tercatat.</p>
                        )}
                    </div>
                </div>
            </div>

            {showAssignmentModal && (
                <AssignmentModal
                    kelompok={kelompok}
                    dosenAll={dosenAll}
                    onClose={() => setShowAssignmentModal(false)}
                />
            )}
        </AuthenticatedLayout>
    );
}
