import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { showConfirm, showAlert, showToast } from '@/Utils/sweetalert';
import {
    FolderKanban, Clock, Play, CheckCircle2, AlertCircle,
    Shield, GraduationCap, BookOpen, ChevronDown, ChevronUp,
    Users, X, Info, Plus, Search, Check, Sparkles, Pencil, Edit3
} from 'lucide-react';

const STATUS_CONFIG = {
    MENUNGGU_VERIFIKATOR: {
        label: 'Menunggu Verifikator',
        bg: 'bg-orange-50', text: 'text-orange-700',
        border: 'border-orange-200/60', dot: 'bg-orange-500',
    },
    DRAFT: {
        label: 'Menunggu Verifikator',
        bg: 'bg-orange-50', text: 'text-orange-700',
        border: 'border-orange-200/60', dot: 'bg-orange-500',
    },
    ACTIVE: {
        label: 'Aktif',
        bg: 'bg-emerald-50', text: 'text-emerald-700',
        border: 'border-emerald-200/60', dot: 'bg-emerald-500',
    },
    INACTIVE: {
        label: 'Nonaktif',
        bg: 'bg-gray-100', text: 'text-gray-600',
        border: 'border-gray-200/60', dot: 'bg-gray-400',
    },
    CLOSED: {
        label: 'Selesai',
        bg: 'bg-slate-100', text: 'text-slate-600',
        border: 'border-slate-300/60', dot: 'bg-slate-500',
    },
};

function StatusBadge({ status }) {
    const c = STATUS_CONFIG[status] || STATUS_CONFIG.MENUNGGU_VERIFIKATOR;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${c.bg} ${c.text} ${c.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            {c.label}
        </span>
    );
}

function StatCard({ icon: Icon, iconBg, iconColor, value, label, sublabel }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
            <div className="min-w-0">
                <p className="text-2xl font-black text-gray-900 leading-none">{value ?? 0}</p>
                <p className="text-xs font-bold text-gray-700 leading-tight mt-1">{label}</p>
                {sublabel && <p className="text-[10px] text-gray-400 mt-0.5">{sublabel}</p>}
            </div>
        </div>
    );
}

/**
 * Modal untuk menentukan atau mengedit verifikator soal per MK.
 * Muncul ketika koordinator klik "Tentukan Verifikator" atau "Edit Verifikator".
 */
function TentukanVerifikatorModal({ kelompok, initialMkId = null, dosenAll, onClose, onSubmit }) {
    // Inisialisasi verifikator per mata kuliah dari data yang sudah ada
    const initialMap = useMemo(() => {
        const map = {};
        kelompok.mk_saya.forEach((mk) => {
            map[mk.mata_kuliah_id] = (mk.verifikator || []).map((v) => v.id);
        });
        return map;
    }, [kelompok]);

    const [verifikatorPerMk, setVerifikatorPerMk] = useState(initialMap);
    const [activeMkId, setActiveMkId] = useState(
        initialMkId || kelompok.mk_saya[0]?.mata_kuliah_id || null
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' || e.key === 'Esc') {
                onClose?.();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Filter hanya Dosen Tetap
    const dosenTetap = useMemo(() => {
        return dosenAll.filter(
            (d) => d.kategori_dosen === 'Dosen Tetap' || d.kategori_dosen === 'TETAP'
        );
    }, [dosenAll]);

    // Mata kuliah yang sedang dipilih/aktif
    const activeMk = kelompok.mk_saya.find((mk) => mk.mata_kuliah_id === activeMkId) || kelompok.mk_saya[0];
    const currentVerifIds = (activeMk && verifikatorPerMk[activeMk.mata_kuliah_id]) || [];

    // Deteksi apakah MK aktif ini sudah memiliki verifikator tersimpan sebelumnya (Mode Edit)
    const isCurrentMkSavedBefore = (activeMk?.verifikator || []).length > 0;

    // Filter daftar dosen berdasarkan kata kunci (nama atau kode dosen)
    const filteredDosen = useMemo(() => {
        if (!searchQuery.trim()) return dosenTetap;
        const q = searchQuery.toLowerCase().trim();
        return dosenTetap.filter((d) => {
            const matchNama = d.nama_lengkap && d.nama_lengkap.toLowerCase().includes(q);
            const matchKode = d.kode_dosen && d.kode_dosen.toLowerCase().includes(q);
            return matchNama || matchKode;
        });
    }, [dosenTetap, searchQuery]);

    // Toggle pilih/batal verifikator
    const handleToggleVerifikator = (mkId, dosenId) => {
        setVerifikatorPerMk((prev) => {
            const current = prev[mkId] || [];
            if (current.includes(dosenId)) {
                return { ...prev, [mkId]: current.filter((id) => id !== dosenId) };
            }
            if (current.length >= 5) {
                showToast('warning', 'Maksimal 5 verifikator per mata kuliah.');
                return prev;
            }
            return { ...prev, [mkId]: [...current, dosenId] };
        });
    };

    // Hapus semua verifikator di MK aktif
    const handleClearAllCurrent = () => {
        if (!activeMk) return;
        setVerifikatorPerMk((prev) => ({
            ...prev,
            [activeMk.mata_kuliah_id]: [],
        }));
    };

    const handleSubmit = () => {
        // Validasi semua MK sudah punya minimal 1 verifikator
        for (const mk of kelompok.mk_saya) {
            const vIds = verifikatorPerMk[mk.mata_kuliah_id] || [];
            if (vIds.length === 0) {
                setActiveMkId(mk.mata_kuliah_id);
                showAlert({
                    title: 'Verifikator Belum Ditentukan',
                    text: `Mata kuliah ${mk.kode_mk} - ${mk.nama_mk} belum memiliki verifikator. Silakan pilih minimal 1 verifikator.`,
                    icon: 'warning',
                });
                return;
            }
        }
        setLoading(true);
        onSubmit(verifikatorPerMk, () => setLoading(false));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-100">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                            isCurrentMkSavedBefore
                                ? 'bg-blue-50 text-blue-700 border-blue-100'
                                : 'bg-red-50 text-[#9E1B28] border-red-100'
                        }`}>
                            {isCurrentMkSavedBefore ? <Pencil className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-base font-black text-gray-900 leading-tight">
                                    {isCurrentMkSavedBefore ? 'Edit Dosen Verifikator Soal' : 'Tentukan Verifikator Soal'}
                                </h2>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                                    isCurrentMkSavedBefore
                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                    {isCurrentMkSavedBefore ? 'Mode Edit' : 'Penugasan Baru'}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Kelompok: <span className="font-bold text-gray-700">{kelompok.nama}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                        title="Tutup"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Info Bar */}
                <div className={`px-6 py-2.5 border-b flex items-center justify-between text-xs ${
                    isCurrentMkSavedBefore
                        ? 'bg-blue-50/80 border-blue-100/80 text-blue-900'
                        : 'bg-amber-50/80 border-amber-100/80 text-amber-900'
                }`}>
                    <div className="flex items-center gap-2">
                        <Info className={`w-4 h-4 shrink-0 ${isCurrentMkSavedBefore ? 'text-blue-600' : 'text-amber-600'}`} />
                        <span>
                            {isCurrentMkSavedBefore
                                ? 'Anda dapat mengubah, menambah, atau mencabut dosen verifikator (wajib 1–5 dosen tetap per MK).'
                                : 'Ketik nama atau pilih langsung dosen di bawah (wajib 1–5 dosen tetap per mata kuliah).'}
                        </span>
                    </div>
                    <span className={`hidden sm:inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        isCurrentMkSavedBefore ? 'text-blue-700 bg-blue-100/80' : 'text-amber-700 bg-amber-100/80'
                    }`}>
                        {dosenTetap.length} Dosen Tetap Tersedia
                    </span>
                </div>

                {/* Tab Switcher jika MK lebih dari 1 */}
                {kelompok.mk_saya.length > 1 && (
                    <div className="flex items-center gap-2 px-6 pt-3 border-b border-gray-100 bg-gray-50/50 overflow-x-auto">
                        {kelompok.mk_saya.map((mk) => {
                            const count = (verifikatorPerMk[mk.mata_kuliah_id] || []).length;
                            const isActive = mk.mata_kuliah_id === activeMkId;
                            return (
                                <button
                                    key={mk.mata_kuliah_id}
                                    type="button"
                                    onClick={() => {
                                        setActiveMkId(mk.mata_kuliah_id);
                                        setSearchQuery('');
                                    }}
                                    className={`px-4 py-2.5 text-xs font-bold rounded-t-2xl border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                                        isActive
                                            ? 'bg-white text-[#9E1B28] border-[#9E1B28] shadow-xs'
                                            : 'text-gray-500 hover:text-gray-900 border-transparent hover:bg-white/60'
                                    }`}
                                >
                                    <span>{mk.kode_mk}</span>
                                    <span className="max-w-[140px] truncate text-[11px] font-medium">
                                        {mk.nama_mk}
                                    </span>
                                    <span
                                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                            count > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                        }`}
                                    >
                                        {count}/5
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[380px]">
                    {activeMk && (
                        <>
                            {/* Active MK Banner */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50/90 border border-gray-200/80 rounded-2xl">
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="px-2.5 py-1 bg-gray-900 text-white rounded-lg text-xs font-black tracking-wider">
                                            {activeMk.kode_mk}
                                        </span>
                                        <h3 className="text-sm font-black text-gray-900">
                                            {activeMk.nama_mk}
                                        </h3>
                                        <span className="text-xs text-gray-500 font-medium">
                                            ({activeMk.sks || 3} SKS • Semester {activeMk.semester || '-'})
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${
                                            currentVerifIds.length > 0
                                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                                : 'bg-amber-50 text-amber-800 border-amber-200'
                                        }`}
                                    >
                                        <Shield className="w-3.5 h-3.5 text-blue-600" />
                                        <span>{currentVerifIds.length}/5 Verifikator</span>
                                    </span>
                                </div>
                            </div>

                            {/* Verifikator Terpilih Chips */}
                            <div className="p-3.5 bg-white border border-gray-200 rounded-2xl space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                        <Users className="w-3.5 h-3.5 text-gray-400" />
                                        Verifikator Terpilih ({currentVerifIds.length}/5):
                                    </span>
                                    {currentVerifIds.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={handleClearAllCurrent}
                                            className="text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                                        >
                                            Hapus Semua
                                        </button>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-1.5 min-h-[34px] items-center">
                                    {currentVerifIds.length > 0 ? (
                                        currentVerifIds.map((vId) => {
                                            const vDosen = dosenAll.find((d) => d.id === vId);
                                            return (
                                                <span
                                                    key={vId}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-900 border border-blue-200/80 rounded-xl text-xs font-bold shadow-xs animate-in fade-in zoom-in-95 duration-100"
                                                >
                                                    <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                                    <span className="font-mono text-[10px] bg-blue-200/60 text-blue-950 px-1 py-0.2 rounded">
                                                        {vDosen?.kode_dosen}
                                                    </span>
                                                    <span className="max-w-[220px] truncate">
                                                        {vDosen?.nama_lengkap}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleVerifikator(activeMk.mata_kuliah_id, vId)}
                                                        className="text-blue-400 hover:text-red-600 transition-colors cursor-pointer p-0.5"
                                                        title="Hapus dosen ini"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </span>
                                            );
                                        })
                                    ) : (
                                        <span className="text-xs text-amber-700 italic flex items-center gap-1.5">
                                            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                                            Belum ada verifikator dipilih. Cari nama dosen pada kolom pencarian di bawah untuk memilih (minimal 1, maksimal 5).
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Kolom Pencarian Dosen Verifikator */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-bold text-gray-700">
                                        Cari & Pilih Dosen Verifikator:
                                    </label>
                                    <span className="text-[11px] text-gray-500 font-medium">
                                        {filteredDosen.length} Dosen Tersedia
                                    </span>
                                </div>
                                <div className="relative">
                                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Ketik nama atau kode dosen (misal: AIK, FRE, Ade, Iskandar)..."
                                        className="w-full pl-10 pr-10 py-2.5 text-xs bg-gray-50/80 hover:bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#9E1B28] focus:ring-2 focus:ring-[#9E1B28]/20 outline-none transition-all placeholder:text-gray-400 text-gray-800"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                                            title="Hapus pencarian"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Daftar Dosen Verifikator Langsung Terlihat (Inline Grid) */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[11px] text-gray-500 px-0.5">
                                    <span className="font-semibold text-gray-700">
                                        {searchQuery ? `Hasil Pencarian: "${searchQuery}"` : 'Daftar Dosen Tetap'}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                        Klik untuk memilih atau membatalkan (Maks. 5 per MK)
                                    </span>
                                </div>

                                <div className="max-h-64 sm:max-h-72 overflow-y-auto pr-1">
                                    {filteredDosen.length === 0 ? (
                                        <div className="py-8 text-center text-xs text-gray-400 italic bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                            Tidak ditemukan dosen tetap dengan kata kunci "{searchQuery}"
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                            {filteredDosen.map((dosen) => {
                                                const isSelected = currentVerifIds.includes(dosen.id);
                                                const isMaxReached = currentVerifIds.length >= 5 && !isSelected;

                                                return (
                                                    <button
                                                        key={dosen.id}
                                                        type="button"
                                                        disabled={isMaxReached}
                                                        onClick={() => {
                                                            if (!isMaxReached) {
                                                                handleToggleVerifikator(activeMk.mata_kuliah_id, dosen.id);
                                                            }
                                                        }}
                                                        className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                                                            isSelected
                                                                ? 'border-blue-500 bg-blue-50/80 ring-2 ring-blue-500/20 shadow-xs'
                                                                : isMaxReached
                                                                ? 'border-gray-100 bg-gray-50/50 opacity-40 cursor-not-allowed'
                                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/80 bg-white'
                                                        }`}
                                                    >
                                                        <div className="flex items-start justify-between gap-1.5">
                                                            <span
                                                                className={`px-1.5 py-0.5 rounded text-[10px] font-black tracking-wider ${
                                                                    isSelected
                                                                        ? 'bg-blue-600 text-white'
                                                                        : 'bg-gray-100 text-gray-700'
                                                                }`}
                                                            >
                                                                {dosen.kode_dosen}
                                                            </span>
                                                            {isSelected ? (
                                                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-600 text-white shadow-xs">
                                                                    <Check className="w-2.5 h-2.5 stroke-[3]" /> Terpilih
                                                                </span>
                                                            ) : isMaxReached ? (
                                                                <span className="text-[9px] text-gray-400 font-medium">Penuh</span>
                                                            ) : null}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold text-gray-900 truncate" title={dosen.nama_lengkap}>
                                                                {dosen.nama_lengkap}
                                                            </p>
                                                            {dosen.email && (
                                                                <p className="text-[10px] text-gray-400 truncate mt-0.5" title={dosen.email}>
                                                                    {dosen.email}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Info Bantuan Tambahan */}
                            <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-[11px] text-gray-500 flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span>
                                    Pilih antara 1 sampai 5 dosen tetap untuk mata kuliah ini. Dosen yang terpilih otomatis masuk ke daftar verifikator.
                                </span>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-white">
                    <div>
                        {kelompok.mk_saya.length > 1 && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <span>MK:</span>
                                {kelompok.mk_saya.map((mk) => {
                                    const count = (verifikatorPerMk[mk.mata_kuliah_id] || []).length;
                                    return (
                                        <button
                                            key={mk.mata_kuliah_id}
                                            type="button"
                                            onClick={() => {
                                                setActiveMkId(mk.mata_kuliah_id);
                                                setSearchQuery('');
                                            }}
                                            className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                                                mk.mata_kuliah_id === activeMkId
                                                    ? 'bg-gray-900 text-white'
                                                    : count > 0
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {mk.kode_mk} ({count}/5)
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-5 py-2 text-xs font-bold text-white bg-[#9E1B28] hover:bg-[#681219] rounded-xl shadow-sm transition-colors cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center gap-2"
                        >
                            {isCurrentMkSavedBefore ? <Pencil className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                            {loading
                                ? 'Menyimpan...'
                                : isCurrentMkSavedBefore
                                ? 'Simpan Perubahan Verifikator'
                                : 'Simpan Verifikator'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function KelompokVerifikasiIndex({
    kelompokList = [],
    stats = { total: 0, menunggu: 0, aktif: 0, selesai: 0 },
    dosenAll = [],
}) {
    const { flash } = usePage().props;
    // Default terbuka (expanded) agar daftar MK dan Dosen Verifikator langsung terlihat tanpa perlu klik dropdown
    const [collapsedIds, setCollapsedIds] = useState([]);
    const [modalKelompok, setModalKelompok] = useState(null);
    const [modalActiveMkId, setModalActiveMkId] = useState(null);

    useEffect(() => {
        if (flash?.success) showToast('success', flash.success);
        if (flash?.error) showToast('error', flash.error);
    }, [flash]);

    const handleOpenModal = (kelompok, mkId = null) => {
        if (!kelompok.can_assign_verifikator) {
            showAlert({
                title: 'Tidak Dapat Mengubah Verifikator',
                text: 'Kelompok ini tidak dalam status yang dapat diubah atau Anda bukan koordinator yang terdaftar.',
                icon: 'info',
            });
            return;
        }
        setModalKelompok(kelompok);
        setModalActiveMkId(mkId || kelompok.mk_saya[0]?.mata_kuliah_id || null);
    };

    const handleSubmitVerifikator = (verifikatorPerMk, onFinish) => {
        const assignments = Object.entries(verifikatorPerMk).map(([mkId, vIds]) => ({
            mata_kuliah_id: mkId,
            verifikator_ids: vIds,
        }));

        router.post(
            `/koordinator/kelompok-verifikasi/${modalKelompok.id}/tentukan-verifikator`,
            { mata_kuliah_assignments: assignments },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setModalKelompok(null);
                    setModalActiveMkId(null);
                    onFinish();
                },
                onError: (errs) => {
                    onFinish();
                    const firstErr = Object.values(errs)[0];
                    if (firstErr) showAlert({ title: 'Gagal', text: firstErr, icon: 'error' });
                },
            }
        );
    };

    return (
        <AuthenticatedLayout title="Kelompok Verifikasi Saya">
            <Head title="Kelompok Verifikasi – Koordinator MK" />

            <div className="space-y-6 w-full pb-12">

                {/* Header Banner */}
                <div className="bg-gradient-to-r from-[#9E1B28] to-[#b52133] rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-red-900/10">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold backdrop-blur-xs text-rose-100 mb-2 border border-white/10">
                            <FolderKanban className="w-3.5 h-3.5" />
                            <span>Koordinator MK</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Kelompok Verifikasi Saya</h1>
                        <p className="text-xs sm:text-sm text-rose-100/90 font-medium max-w-2xl">
                            Daftar kelompok verifikasi di mana Anda terdaftar sebagai Koordinator MK. Tentukan dan kelola verifikator soal untuk mata kuliah yang Anda koordinatori.
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon={FolderKanban} iconBg="bg-slate-100" iconColor="text-slate-700" value={stats.total} label="TOTAL KELOMPOK" sublabel="Semua" />
                    <StatCard icon={Clock} iconBg="bg-orange-50" iconColor="text-orange-500" value={stats.menunggu} label="MENUNGGU VERIFIKATOR" sublabel="Perlu Tindakan" />
                    <StatCard icon={Play} iconBg="bg-emerald-50" iconColor="text-emerald-600" value={stats.aktif} label="AKTIF" sublabel="Verifikasi Berjalan" />
                    <StatCard icon={CheckCircle2} iconBg="bg-slate-100" iconColor="text-slate-600" value={stats.selesai} label="SELESAI" sublabel="Closed" />
                </div>

                {/* List Kelompok */}
                <div className="space-y-4">
                    {kelompokList.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 mx-auto mb-3">
                                <FolderKanban className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-bold text-gray-800">Belum ada kelompok</p>
                            <p className="text-xs text-gray-400 mt-1">
                                Anda belum ditugaskan sebagai koordinator di kelompok verifikasi mana pun.
                            </p>
                        </div>
                    ) : (
                        kelompokList.map((kelompok) => {
                            const isExpanded = !collapsedIds.includes(kelompok.id);
                            const needsAction = kelompok.can_assign_verifikator && kelompok.mk_butuh_verifikator > 0;

                            return (
                                <div
                                    key={kelompok.id}
                                    className={`bg-white rounded-2xl border shadow-sm transition-all ${
                                        needsAction ? 'border-orange-200 ring-1 ring-orange-100' : 'border-gray-100'
                                    }`}
                                >
                                    {/* Card Header */}
                                    <div className="p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-extrabold text-sm text-gray-900 leading-tight">{kelompok.nama}</h3>
                                                    <StatusBadge status={kelompok.status} />
                                                    {needsAction && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[10px] font-extrabold animate-pulse">
                                                            <AlertCircle className="w-3 h-3" />
                                                            Perlu Tindakan
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-gray-500 mt-1 font-medium">
                                                    Periode: {kelompok.periode?.nama ?? '—'}
                                                    {kelompok.periode?.tahun_ajaran && ` • ${kelompok.periode.tahun_ajaran}`}
                                                </p>
                                                <div className="flex items-center gap-3 mt-2 flex-wrap">
                                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-600">
                                                        <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                                                        {kelompok.mk_saya_count} MK Tanggung Jawab Anda
                                                    </span>
                                                    {kelompok.mk_butuh_verifikator > 0 && (
                                                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-orange-700">
                                                            <AlertCircle className="w-3.5 h-3.5" />
                                                            {kelompok.mk_butuh_verifikator} MK belum ada verifikator
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                {kelompok.can_assign_verifikator && (
                                                    <button
                                                        onClick={() => handleOpenModal(kelompok)}
                                                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer ${
                                                            kelompok.mk_butuh_verifikator > 0
                                                                ? 'bg-[#9E1B28] hover:bg-[#681219] text-white shadow-red-900/10'
                                                                : 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 shadow-xs hover:border-gray-300'
                                                        }`}
                                                    >
                                                        {kelompok.mk_butuh_verifikator > 0 ? (
                                                            <>
                                                                <Shield className="w-3.5 h-3.5" />
                                                                <span>Tentukan Verifikator</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Pencil className="w-3.5 h-3.5 text-gray-600" />
                                                                <span>Edit Verifikator</span>
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        setCollapsedIds((prev) =>
                                                            prev.includes(kelompok.id)
                                                                ? prev.filter((id) => id !== kelompok.id)
                                                                : [...prev, kelompok.id]
                                                        );
                                                    }}
                                                    className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                                                    title={isExpanded ? 'Sembunyikan detail' : 'Tampilkan detail'}
                                                >
                                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Detail */}
                                    {isExpanded && (
                                        <div className="border-t border-gray-100 p-5 space-y-3 bg-gray-50/50">
                                            <h4 className="text-[11px] font-extrabold text-gray-700 uppercase tracking-wider">
                                                Mata Kuliah Tanggung Jawab Anda ({kelompok.mk_saya_count})
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {kelompok.mk_saya.map((mk) => (
                                                    <div
                                                        key={mk.mata_kuliah_id}
                                                        className={`p-3.5 rounded-xl border bg-white space-y-2 ${
                                                            mk.sudah_ada_verifikator ? 'border-emerald-200/60' : 'border-orange-200/60'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <span className="font-black text-xs text-gray-900">{mk.kode_mk}</span>
                                                                <span className="text-[11px] text-gray-500 ml-1.5">{mk.nama_mk}</span>
                                                            </div>
                                                            {mk.sudah_ada_verifikator ? (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                                                    <CheckCircle2 className="w-3 h-3" /> Sudah Ada Verifikator
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full">
                                                                    <AlertCircle className="w-3 h-3" /> Belum Ada
                                                                </span>
                                                            )}
                                                        </div>

                                                        {mk.verifikator.length > 0 && (
                                                            <div className="flex flex-wrap gap-1">
                                                                {mk.verifikator.map((v) => (
                                                                    <span
                                                                        key={v.id}
                                                                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-[10px] font-bold"
                                                                    >
                                                                        <Shield className="w-2.5 h-2.5" />
                                                                        {v.kode_dosen} - {v.nama_lengkap}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Modal Tentukan / Edit Verifikator */}
            {modalKelompok && (
                <TentukanVerifikatorModal
                    kelompok={modalKelompok}
                    dosenAll={dosenAll}
                    onClose={() => setModalKelompok(null)}
                    onSubmit={handleSubmitVerifikator}
                />
            )}
        </AuthenticatedLayout>
    );
}
