import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ArrowLeft, FileText, Download, CheckCircle2, RefreshCw,
    XCircle, Clock, History, User, Calendar, BookOpen, Eye,
    Send, FileCheck, AlertTriangle, Layers, MessageSquare
} from 'lucide-react';
import FlashAlert from '@/Components/FlashAlert';
import { showToast, showAlert, showConfirm } from '@/Utils/sweetalert';

const STATUS_CONFIG = {
    IN_REVIEW:   { label: 'In Review', color: 'bg-purple-100 text-purple-700',   dot: 'bg-purple-500' },
    SUBMITTED:   { label: 'In Review', color: 'bg-purple-100 text-purple-700',   dot: 'bg-purple-500' },
    RESUBMITTED: { label: 'In Review', color: 'bg-purple-100 text-purple-700',   dot: 'bg-purple-500' },
    DRAFT:       { label: 'In Review', color: 'bg-purple-100 text-purple-700',   dot: 'bg-purple-500' },
    REVISION:    { label: 'Revisi',    color: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-400' },
    APPROVED:    { label: 'Disetujui', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
    REJECTED:    { label: 'Ditolak',   color: 'bg-red-100 text-red-600',         dot: 'bg-red-400' },
};

const ACTION_CONFIG = {
    APPROVED: { label: 'Disetujui',     icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
    REVISION: { label: 'Perlu Revisi',  icon: RefreshCw,    color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200',     badge: 'bg-amber-100 text-amber-700' },
    REJECTED: { label: 'Ditolak',       icon: XCircle,      color: 'text-red-600',     bg: 'bg-red-50 border-red-200',         badge: 'bg-red-100 text-red-600' },
};

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.IN_REVIEW;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${cfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatSize(bytes) {
    if (!bytes) return '-';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

function Toast({ flash }) {
    return <FlashAlert type="toast" flash={flash} />;
}

export default function VerifikatorSoalShow({ soal }) {
    const { flash } = usePage().props;
    const [action, setAction] = useState('');
    const [catatan, setCatatan] = useState('');
    const [cloFeedback, setCloFeedback] = useState({});
    const [processing, setProcessing] = useState(false);
    const [cloErrors, setCloErrors] = useState({});

    const canVerify = ['SUBMITTED', 'IN_REVIEW', 'RESUBMITTED'].includes(soal.status);
    const ploList = soal.plo_clo_data?.plo || [];
    const allCloList = ploList.flatMap(p => p.clo || []);

    const handleCloNoteChange = (cloKode, value) => {
        setCloFeedback(prev => ({ ...prev, [cloKode]: value }));
        if (value.trim().length > 0) {
            setCloErrors(prev => ({ ...prev, [cloKode]: false }));
        }
    };

    const handleVerifikasi = async (e) => {
        e.preventDefault();
        if (!action) return;

        // Validate: all CLO notes are required when there are CLOs
        if (allCloList.length > 0) {
            const newCloErrors = {};
            let hasEmpty = false;
            allCloList.forEach(clo => {
                if (!cloFeedback[clo.kode] || !cloFeedback[clo.kode].trim()) {
                    newCloErrors[clo.kode] = true;
                    hasEmpty = true;
                }
            });
            if (hasEmpty) {
                setCloErrors(newCloErrors);
                showAlert({
                    title: 'Catatan Per-CLO Wajib Diisi',
                    text: 'Harap isi catatan evaluasi untuk setiap butir CLO yang tercantum pada soal ini.',
                    icon: 'warning',
                });
                return;
            }
        }

        const actionLabels = {
            APPROVED: 'menyetujui (Approve)',
            REVISION: 'meminta revisi untuk',
            REJECTED: 'menolak (Reject)',
        };

        const result = await showConfirm({
            title: 'Konfirmasi Verifikasi',
            text: `Apakah Anda yakin ingin ${actionLabels[action] || action} soal "${soal.judul}"?`,
            icon: action === 'APPROVED' ? 'question' : 'warning',
            confirmButtonText: 'Ya, Kirim Keputusan',
            cancelButtonText: 'Batal',
            confirmButtonColor: action === 'APPROVED' ? '#059669' : action === 'REVISION' ? '#d97706' : '#801720',
        });

        if (!result.isConfirmed) return;

        setProcessing(true);
        router.post(`/verifikator/soal/${soal.id}/verifikasi`, {
            action,
            catatan,
            clo_feedback: cloFeedback
        }, {
            onFinish: () => setProcessing(false)
        });
    };

    return (
        <AuthenticatedLayout title={`Review: ${soal.judul}`}>
            <Head title={`Review: ${soal.judul}`} />
            <Toast flash={flash} />

            <div className="w-full space-y-6 pb-12">
                {/* Back Link */}
                <Link
                    href="/verifikator/soal"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#801720] transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Daftar Soal
                </Link>

                {/* Main Card: Header, File, & Detail Soal */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h1 className="text-lg font-extrabold text-gray-800">{soal.judul}</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {soal.mata_kuliah?.nama_mk} · {soal.kategori?.nama} · {soal.periode?.nama}
                            </p>
                        </div>
                        <StatusBadge status={soal.status} />
                    </div>

                    {/* File Box */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-5 p-4 bg-gray-50 rounded-2xl border border-gray-200/80">
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div className="w-11 h-11 rounded-2xl bg-red-100/80 border border-red-200/60 flex items-center justify-center flex-shrink-0 shadow-xs">
                                <FileText className="w-5 h-5 text-red-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-gray-800 break-all leading-snug">{soal.nama_file}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-red-100 text-red-700">PDF/DOC</span>
                                    <span className="text-xs font-medium text-gray-400">
                                        {formatSize(soal.file_size)} · Diunggah {formatDateTime(soal.created_at)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <a
                                href={`/verifikator/soal/${soal.id}/preview`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-xs"
                                title="Buka pratinjau naskah soal di tab baru"
                            >
                                <Eye className="w-3.5 h-3.5 text-gray-500" /> Lihat
                            </a>
                            <a
                                href={`/verifikator/soal/${soal.id}/download`}
                                download={soal.nama_file}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#801720] hover:bg-[#6a1219] text-white rounded-xl text-xs font-bold shadow-sm shadow-[#801720]/25 transition-all hover:scale-[1.02] active:scale-95"
                                title="Unduh berkas naskah soal"
                            >
                                <Download className="w-3.5 h-3.5" /> Download
                            </a>
                        </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-5 pt-5 border-t border-gray-100 text-xs">
                        <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50/60 border border-gray-100">
                            <User className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                            <div className="min-w-0">
                                <p className="text-[11px] font-medium text-gray-400">Diunggah oleh</p>
                                <p className="font-bold text-gray-700 truncate">{soal.uploaded_by?.name || '—'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50/60 border border-gray-100">
                            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                            <div className="min-w-0">
                                <p className="text-[11px] font-medium text-gray-400">Periode</p>
                                <p className="font-bold text-gray-700 truncate">{soal.periode?.nama || '—'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50/60 border border-gray-100 sm:col-span-2 md:col-span-1">
                            <BookOpen className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                            <div className="min-w-0">
                                <p className="text-[11px] font-medium text-gray-400">Mata Kuliah</p>
                                <p className="font-bold text-gray-700 truncate">{soal.mata_kuliah?.nama_mk || '—'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pemetaan PLO & CLO dari Koordinator */}
                {ploList.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-[#801720]" /> Pemetaan PLO &amp; CLO Soal
                            </h2>
                            <span className="text-[11px] text-gray-400 font-medium">
                                Dikonfigurasi oleh Koordinator MK
                            </span>
                        </div>

                        <div className="space-y-3">
                            {ploList.map((plo, pIdx) => (
                                <div key={pIdx} className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 rounded-md bg-[#801720] text-white text-[10px] font-extrabold">
                                                {plo.kode}
                                            </span>
                                            <span className="text-xs font-bold text-gray-800">{plo.deskripsi}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 pt-1">
                                        {plo.clo?.map((clo, cIdx) => (
                                            <div key={cIdx} className="p-2.5 rounded-lg bg-white border border-gray-200/80 text-xs space-y-1.5">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className="px-2 py-0.5 rounded bg-red-100 text-[#801720] font-extrabold text-[10px]">
                                                            {clo.kode}
                                                        </span>
                                                        <span className="text-gray-700 truncate">{clo.deskripsi}</span>
                                                    </div>
                                                    <span className="text-[11px] font-bold text-gray-500 whitespace-nowrap">
                                                        Bobot: {clo.bobot_lo}
                                                    </span>
                                                </div>

                                                {clo.soal && (
                                                    <div className="mt-2 p-2.5 rounded-lg bg-gray-50 border border-gray-100 text-xs text-gray-800 space-y-1">
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                                                            Teks / Pertanyaan Soal:
                                                        </span>
                                                        <p className="whitespace-pre-line leading-relaxed text-gray-700">{clo.soal}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Keputusan Verifikasi Section */}
                {canVerify ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h2 className="font-bold text-gray-800 text-base mb-1 flex items-center gap-2">
                            <FileCheck className="w-5 h-5 text-[#801720]" /> Beri Keputusan Verifikasi
                        </h2>
                        <p className="text-xs text-gray-500 mb-5">
                            Pilih keputusan verifikasi dan berikan catatan evaluasi (baik catatan umum maupun per-CLO).
                        </p>

                        <form onSubmit={handleVerifikasi} className="space-y-5">
                            {/* Decision Radio Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                    {
                                        value: 'APPROVED',
                                        label: 'Setujui (Approve)',
                                        desc: 'Soal memenuhi standar dan siap digunakan',
                                        icon: CheckCircle2,
                                        activeClass: 'border-emerald-500 bg-emerald-50/80 text-emerald-800 ring-2 ring-emerald-500/20',
                                        hoverClass: 'hover:border-emerald-200 hover:bg-emerald-50/30',
                                        iconClass: 'text-emerald-600',
                                    },
                                    {
                                        value: 'REVISION',
                                        label: 'Minta Revisi',
                                        desc: 'Perlu perbaikan oleh Koordinator MK',
                                        icon: RefreshCw,
                                        activeClass: 'border-amber-500 bg-amber-50/80 text-amber-800 ring-2 ring-amber-500/20',
                                        hoverClass: 'hover:border-amber-200 hover:bg-amber-50/30',
                                        iconClass: 'text-amber-600',
                                    },
                                    {
                                        value: 'REJECTED',
                                        label: 'Tolak (Reject)',
                                        desc: 'Soal ditolak dan tidak dapat digunakan',
                                        icon: XCircle,
                                        activeClass: 'border-red-500 bg-red-50/80 text-red-800 ring-2 ring-red-500/20',
                                        hoverClass: 'hover:border-red-200 hover:bg-red-50/30',
                                        iconClass: 'text-red-600',
                                    },
                                ].map((opt) => {
                                    const Icon = opt.icon;
                                    const isSelected = action === opt.value;
                                    return (
                                        <label
                                            key={opt.value}
                                            className={`relative flex flex-col p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                                                isSelected
                                                    ? opt.activeClass
                                                    : `border-gray-200 bg-white text-gray-700 ${opt.hoverClass}`
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="action"
                                                value={opt.value}
                                                checked={isSelected}
                                                onChange={() => setAction(opt.value)}
                                                className="sr-only"
                                            />
                                            <div className="flex items-center justify-between mb-2">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSelected ? 'bg-white shadow-xs' : 'bg-gray-100'}`}>
                                                    <Icon className={`w-4 h-4 ${isSelected ? opt.iconClass : 'text-gray-500'}`} />
                                                </div>
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-current' : 'border-gray-300'}`}>
                                                    {isSelected && <div className="w-2 h-2 rounded-full bg-current" />}
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold">{opt.label}</span>
                                            <span className="text-[11px] text-gray-500 mt-1 leading-snug">{opt.desc}</span>
                                        </label>
                                    );
                                })}
                            </div>

                            {/* Section Catatan Per-CLO — WAJIB */}
                            {ploList.length > 0 && (
                                <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50/60 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                                            <MessageSquare className="w-4 h-4 text-[#801720]" />
                                            Catatan Evaluasi Per-CLO
                                            <span className="text-red-500">*</span>
                                        </label>
                                        <span className="text-[10px] text-gray-500 text-right leading-snug">
                                            Semua CLO wajib diberi catatan evaluasi
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        {ploList.map((plo, pIdx) => (
                                            <div key={pIdx} className="space-y-2">
                                                {/* PLO Header */}
                                                <div className="flex items-center gap-2 px-1">
                                                    <span className="px-2 py-0.5 rounded-md bg-[#801720] text-white text-[10px] font-extrabold">
                                                        {plo.kode}
                                                    </span>
                                                    <span className="text-[11px] font-semibold text-gray-600">{plo.deskripsi}</span>
                                                </div>

                                                {/* CLO Inputs */}
                                                <div className="space-y-2 pl-1">
                                                    {(plo.clo || []).map((clo, cIdx) => {
                                                        const hasError = cloErrors[clo.kode];
                                                        const hasFilled = Boolean(cloFeedback[clo.kode]?.trim());
                                                        return (
                                                            <div
                                                                key={cIdx}
                                                                className={`bg-white rounded-xl border p-3 text-xs space-y-2 transition-colors ${
                                                                    hasError ? 'border-red-400 ring-1 ring-red-300' :
                                                                    hasFilled ? 'border-emerald-300' : 'border-gray-200'
                                                                }`}
                                                            >
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div className="flex items-start gap-2 min-w-0">
                                                                        <span className="px-2 py-0.5 rounded bg-red-100 text-[#801720] font-extrabold text-[10px] flex-shrink-0 mt-0.5">
                                                                            {clo.kode}
                                                                        </span>
                                                                        <span className="text-gray-700 leading-snug">{clo.deskripsi}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                                                        {hasFilled && (
                                                                            <span className="text-[10px] font-bold text-emerald-600">✓ Terisi</span>
                                                                        )}
                                                                        {hasError && (
                                                                            <span className="text-[10px] font-bold text-red-500">Wajib diisi!</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <textarea
                                                                    rows={2}
                                                                    value={cloFeedback[clo.kode] || ''}
                                                                    onChange={(e) => handleCloNoteChange(clo.kode, e.target.value)}
                                                                    placeholder={`Tuliskan catatan evaluasi untuk ${clo.kode} — apakah sudah sesuai, perlu perbaikan pada bagian mana, dll.`}
                                                                    className={`w-full px-3 py-2 border rounded-lg text-xs outline-none resize-none transition-all ${
                                                                        hasError
                                                                            ? 'border-red-300 focus:ring-2 focus:ring-red-300/30 focus:border-red-400'
                                                                            : 'border-gray-300 focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720]'
                                                                    }`}
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Catatan Umum Field */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                                    Catatan Umum Verifikator {action === 'REVISION' && <span className="text-red-500">*</span>}
                                </label>
                                <textarea
                                    rows={3}
                                    value={catatan}
                                    onChange={(e) => setCatatan(e.target.value)}
                                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs resize-none focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] outline-none transition-all"
                                    placeholder={
                                        action === 'REVISION'
                                            ? 'Tuliskan rincian kesimpulan bagian atau perbaikan yang diminta...'
                                            : action === 'REJECTED'
                                            ? 'Tuliskan alasan penolakan naskah soal...'
                                            : 'Catatan tambahan atau apresiasi (opsional)...'
                                    }
                                />
                            </div>

                            {/* Submit Button */}
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={processing || !action}
                                    className={`w-full inline-flex items-center justify-center gap-2 py-3 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed ${
                                        action === 'APPROVED'
                                            ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                                            : action === 'REVISION'
                                            ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25'
                                            : 'bg-[#801720] hover:bg-[#6a1219] shadow-[#801720]/25'
                                    }`}
                                >
                                    <Send className="w-3.5 h-3.5" />
                                    {processing ? 'Menyimpan Keputusan...' : 'Kirim Keputusan Verifikasi'}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                                <FileCheck className="w-5 h-5 text-gray-500" />
                            </div>
                            <div>
                                <h2 className="font-bold text-gray-800 text-sm">Status Keputusan</h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Soal ini telah selesai diverifikasi dan saat ini berstatus <strong className="text-gray-700">{STATUS_CONFIG[soal.status]?.label || soal.status}</strong>.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Riwayat Revisi */}
                {soal.revisi && soal.revisi.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h2 className="font-bold text-gray-800 text-base mb-4 flex items-center gap-2">
                            <History className="w-5 h-5 text-[#801720]" /> Riwayat File Revisi
                        </h2>
                        <div className="space-y-3">
                            {soal.revisi.map((rev) => (
                                <div
                                    key={rev.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl"
                                >
                                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                        <div className="w-9 h-9 rounded-xl bg-amber-200/80 border border-amber-300/60 flex items-center justify-center flex-shrink-0 text-xs font-extrabold text-amber-800 shadow-xs">
                                            v{rev.version}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold text-gray-800 break-all leading-snug">{rev.nama_file}</p>
                                            <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                                                Diunggah oleh {rev.uploaded_by?.name || 'Koordinator'} · {formatDateTime(rev.uploaded_at)}
                                            </p>
                                            {rev.catatan && (
                                                <div className="mt-2 text-xs text-amber-900 bg-white/80 rounded-xl p-2.5 border border-amber-200/60">
                                                    <span className="font-semibold">Catatan Revisi:</span> {rev.catatan}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                                        <a
                                            href={`/verifikator/revisi/${rev.id}/preview`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-200 hover:bg-amber-100/50 text-amber-800 rounded-xl text-xs font-bold transition-all shadow-xs"
                                            title="Lihat naskah revisi"
                                        >
                                            <Eye className="w-3.5 h-3.5 text-amber-700" /> Lihat
                                        </a>
                                        <a
                                            href={`/verifikator/revisi/${rev.id}/download`}
                                            download={rev.nama_file}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                                            title="Unduh naskah revisi"
                                        >
                                            <Download className="w-3.5 h-3.5" /> Unduh
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Riwayat Verifikasi */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="font-bold text-gray-800 text-base mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-[#801720]" /> Riwayat Verifikasi
                    </h2>
                    {(!soal.verifikasi || soal.verifikasi.length === 0) ? (
                        <p className="text-xs text-gray-400 text-center py-6">Belum ada riwayat verifikasi sebelumnya.</p>
                    ) : (
                        <div className="space-y-3">
                            {soal.verifikasi.map((v) => {
                                const cfg = ACTION_CONFIG[v.action] || {
                                    label: v.action,
                                    icon: FileCheck,
                                    color: 'text-gray-600',
                                    bg: 'bg-gray-50 border-gray-200',
                                    badge: 'bg-gray-100 text-gray-600',
                                };
                                const Icon = cfg.icon;
                                const cloNotes = v.clo_feedback && typeof v.clo_feedback === 'object'
                                    ? Object.entries(v.clo_feedback).filter(([_, note]) => note && String(note).trim().length > 0)
                                    : [];

                                return (
                                    <div key={v.id} className={`p-4 rounded-2xl border ${cfg.bg} space-y-2.5`}>
                                        <div className="flex items-center justify-between gap-2">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${cfg.badge}`}>
                                                <Icon className="w-3.5 h-3.5" /> {cfg.label}
                                            </span>
                                            <span className="text-[11px] text-gray-400">{formatDateTime(v.created_at)}</span>
                                        </div>

                                        {v.catatan && (
                                            <p className="text-xs text-gray-700 bg-white/90 rounded-xl p-2.5 border border-black/5">
                                                <span className="font-semibold text-gray-800">Catatan Umum:</span> "{v.catatan}"
                                            </p>
                                        )}

                                        {cloNotes.length > 0 && (
                                            <div className="p-3 bg-white/90 rounded-xl border border-black/5 text-xs space-y-1.5">
                                                <p className="font-bold text-gray-800 text-[11px]">Catatan Per-CLO:</p>
                                                <div className="space-y-1">
                                                    {cloNotes.map(([kode, note], nIdx) => (
                                                        <div key={nIdx} className="flex items-start gap-2 text-gray-700">
                                                            <span className="px-1.5 py-0.5 rounded bg-red-100 text-[#801720] font-bold text-[10px] flex-shrink-0">
                                                                {kode}
                                                            </span>
                                                            <span className="text-xs">{note}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <p className="text-[11px] text-gray-400">
                                            Diverifikasi oleh <span className="font-semibold text-gray-600">{v.verifikator?.name || 'Verifikator'}</span>
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
