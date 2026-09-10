import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ArrowLeft, FileText, Download, CheckCircle2, RefreshCw,
    XCircle, Clock, History, User, Calendar, BookOpen, Eye,
    Send, FileCheck, AlertTriangle, Layers, MessageSquare, ClipboardList
} from 'lucide-react';
import FlashAlert from '@/Components/FlashAlert';
import { showToast, showAlert, showConfirm } from '@/Utils/sweetalert';
import DocumentPreviewModal from '@/Components/DocumentPreviewModal';

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

/**
 * Resolve nilai clo_feedback untuk satu kode CLO dari riwayat verifikasi.
 * Mendukung format lama (string) dan baru (object {no_soal, catatan, rekomendasi}).
 */
function resolveCloNote(feedback, kode) {
    if (!feedback || !feedback[kode]) return null;
    const val = feedback[kode];
    if (typeof val === 'string') return { catatan: val, no_soal: '', rekomendasi: '' };
    if (typeof val === 'object') return val;
    return null;
}

export default function VerifikatorSoalShow({ soal }) {
    const { flash } = usePage().props;
    const [action, setAction] = useState('');
    const [catatan, setCatatan] = useState('');
    const [cloFeedback, setCloFeedback] = useState({});
    const [ploFeedback, setPloFeedback] = useState({});
    const [processing, setProcessing] = useState(false);
    const [previewModal, setPreviewModal] = useState({ open: false, fileName: '', previewUrl: '', downloadUrl: '' });

    const openPreview = (fileName, previewUrl, downloadUrl) =>
        setPreviewModal({ open: true, fileName, previewUrl, downloadUrl });
    const closePreview = () => setPreviewModal(m => ({ ...m, open: false }));

    const canVerify = ['SUBMITTED', 'IN_REVIEW', 'RESUBMITTED'].includes(soal.status);
    const ploList = soal.plo_clo_data?.plo || [];

    const allCloItems = [];
    ploList.forEach((plo) => {
        (plo.clo || []).forEach((clo) => {
            const rawKode = clo.kode || '';
            const fullKode = rawKode.startsWith(plo.kode) ? rawKode : `${plo.kode}-${rawKode}`;
            allCloItems.push({
                fullKode,
                ploKode: plo.kode,
                cloKode: rawKode,
                deskripsi: clo.deskripsi,
            });
        });
    });

    const handleCloChange = (kode, field, value) => {
        setCloFeedback((prev) => ({
            ...prev,
            [kode]: {
                ...prev[kode],
                [field]: value,
            },
        }));
    };

    const handlePloChange = (ploKode, value) => {
        setPloFeedback((prev) => ({
            ...prev,
            [ploKode]: value,
        }));
    };

    const handleVerifikasi = async (e) => {
        e.preventDefault();
        if (!action) return;

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
            clo_feedback: cloFeedback,
            plo_feedback: ploFeedback,
        }, {
            onFinish: () => setProcessing(false)
        });
    };

    return (
        <>
        <AuthenticatedLayout title={`Review: ${soal.judul}`}>
            <Head title={`Review: ${soal.judul}`} />
            <FlashAlert flash={flash} />

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
                    {(() => {
                        const isResubmitted = soal.status === 'RESUBMITTED';
                        const latestRevisi = isResubmitted && soal.revisi?.[0];
                        const fileName = latestRevisi ? latestRevisi.nama_file : soal.nama_file;
                        const fileSize = latestRevisi ? latestRevisi.file_size : soal.file_size;
                        const uploadedAt = latestRevisi ? latestRevisi.uploaded_at : soal.created_at;
                        const previewUrl = latestRevisi
                            ? `/verifikator/revisi/${latestRevisi.id}/preview`
                            : `/verifikator/soal/${soal.id}/preview`;
                        const downloadUrl = latestRevisi
                            ? `/verifikator/revisi/${latestRevisi.id}/download`
                            : `/verifikator/soal/${soal.id}/download`;

                        return (
                            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-5 p-4 rounded-2xl border ${
                                latestRevisi
                                    ? 'bg-amber-50/60 border-amber-200'
                                    : 'bg-gray-50 border-gray-200/80'
                            }`}>
                                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                    <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center flex-shrink-0 shadow-xs ${
                                        latestRevisi
                                            ? 'bg-amber-100/80 border-amber-300/60'
                                            : 'bg-red-100/80 border-red-200/60'
                                    }`}>
                                        <FileText className={`w-5 h-5 ${latestRevisi ? 'text-amber-600' : 'text-red-600'}`} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        {latestRevisi && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-800 mb-1">
                                                <RefreshCw className="w-2.5 h-2.5" /> Revisi Terbaru (v{latestRevisi.version})
                                            </span>
                                        )}
                                        <p className="text-sm font-bold text-gray-800 break-all leading-snug">{fileName}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                                                latestRevisi ? 'bg-amber-200 text-amber-800' : 'bg-red-100 text-red-700'
                                            }`}>PDF/DOC</span>
                                            <span className="text-xs font-medium text-gray-400">
                                                {formatSize(fileSize)} · Diunggah {formatDateTime(uploadedAt)}
                                            </span>
                                        </div>
                                        {latestRevisi?.catatan && (
                                            <p className="text-[11px] text-amber-700 italic mt-1 line-clamp-1">"{latestRevisi.catatan}"</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => openPreview(fileName, previewUrl, downloadUrl)}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-xs cursor-pointer"
                                        title="Pratinjau naskah soal"
                                    >
                                        <Eye className="w-3.5 h-3.5 text-gray-500" /> Lihat
                                    </button>
                                    <a
                                        href={downloadUrl}
                                        download={fileName}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#801720] hover:bg-[#6a1219] text-white rounded-xl text-xs font-bold shadow-sm shadow-[#801720]/25 transition-all hover:scale-[1.02] active:scale-95"
                                        title="Unduh berkas naskah soal"
                                    >
                                        <Download className="w-3.5 h-3.5" /> Download
                                    </a>
                                </div>
                            </div>
                        );
                    })()}


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
                                            <span className="px-2 py-0.5 rounded-md bg-[#801720] text-white text-[10px] font-extrabold whitespace-nowrap flex-shrink-0">
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
                                                        <span className="px-2 py-0.5 rounded bg-red-100 text-[#801720] font-extrabold text-[10px] whitespace-nowrap flex-shrink-0">
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
                            Pilih keputusan verifikasi.
                        </p>

                        <form onSubmit={handleVerifikasi} className="space-y-6">
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
                            {/* Section 1: Catatan Evaluasi CLO */}
                            {allCloItems.length > 0 && (
                                <div className="space-y-3 pt-2">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                            <ClipboardList className="w-4 h-4 text-[#801720]" />
                                            Catatan Evaluasi CLO
                                        </h3>
                                        <span className="text-[11px] text-gray-400 font-medium">
                                            Kolom "Catatan Evaluasi" wajib diisi untuk setiap CLO
                                        </span>
                                    </div>

                                    <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="bg-[#801720] text-white text-[11px] font-bold">
                                                        <th className="px-3.5 py-2.5 text-left w-[12%]">Bentuk Asesmen</th>
                                                        <th className="px-3.5 py-2.5 text-left w-[20%]">CLO</th>
                                                        <th className="px-3.5 py-2.5 text-left w-[14%]">No. Soal</th>
                                                        <th className="px-3.5 py-2.5 text-left w-[27%]">Catatan Evaluasi *</th>
                                                        <th className="px-3.5 py-2.5 text-left w-[27%]">Rekomendasi Soal Terhadap PLO (jika ada)</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 bg-white">
                                                    {allCloItems.map((item, idx) => (
                                                        <tr key={idx} className="hover:bg-gray-50/50">
                                                            <td className="px-3.5 py-3 align-top font-bold text-gray-800">
                                                                {soal.kategori?.nama || 'UTS'}
                                                            </td>
                                                            <td className="px-3.5 py-3 align-top">
                                                                <span className="px-2 py-0.5 rounded bg-red-100 text-[#801720] font-extrabold text-[10px] inline-block mb-1">
                                                                    {item.fullKode}
                                                                </span>
                                                                <p className="text-[11px] text-gray-600 leading-snug line-clamp-3">
                                                                    {item.deskripsi}
                                                                </p>
                                                            </td>
                                                            <td className="px-3.5 py-3 align-top">
                                                                <input
                                                                    type="text"
                                                                    placeholder="cth: 1, 3, 5"
                                                                    value={cloFeedback[item.fullKode]?.no_soal || ''}
                                                                    onChange={(e) => handleCloChange(item.fullKode, 'no_soal', e.target.value)}
                                                                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#801720] focus:ring-1 focus:ring-[#801720] transition-all outline-none"
                                                                />
                                                            </td>
                                                            <td className="px-3.5 py-3 align-top">
                                                                <textarea
                                                                    rows={3}
                                                                    placeholder={`Catatan evaluasi untuk ${item.fullKode} — apakah sudah sesuai, perlu perbaikan pada bagian mana, dll.`}
                                                                    value={cloFeedback[item.fullKode]?.catatan || ''}
                                                                    onChange={(e) => handleCloChange(item.fullKode, 'catatan', e.target.value)}
                                                                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#801720] focus:ring-1 focus:ring-[#801720] transition-all outline-none min-h-[82px] resize-none overflow-hidden hover:overflow-y-auto focus:overflow-y-auto"
                                                                />
                                                            </td>
                                                            <td className="px-3.5 py-3 align-top">
                                                                <textarea
                                                                    rows={3}
                                                                    placeholder="Rekomendasi soal terhadap PLO ini (opsional)..."
                                                                    value={cloFeedback[item.fullKode]?.rekomendasi || ''}
                                                                    onChange={(e) => handleCloChange(item.fullKode, 'rekomendasi', e.target.value)}
                                                                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#801720] focus:ring-1 focus:ring-[#801720] transition-all outline-none min-h-[82px] resize-none overflow-hidden hover:overflow-y-auto focus:overflow-y-auto"
                                                                />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}



                            {/* Section 3: Catatan Umum Verifikator */}
                            <div className="space-y-2 pt-2">
                                <h3 className="text-sm font-bold text-gray-800">Catatan Umum Verifikator</h3>
                                <textarea
                                    rows={3}
                                    placeholder="Catatan tambahan atau apresiasi (opsional)..."
                                    value={catatan}
                                    onChange={(e) => setCatatan(e.target.value)}
                                    className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#801720] focus:ring-1 focus:ring-[#801720] transition-all outline-none min-h-[76px] resize-none overflow-hidden hover:overflow-y-auto focus:overflow-y-auto"
                                />
                            </div>

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
                                        <button
                                            type="button"
                                            onClick={() => openPreview(rev.nama_file, `/verifikator/revisi/${rev.id}/preview`, `/verifikator/revisi/${rev.id}/download`)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-200 hover:bg-amber-100/50 text-amber-800 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                                            title="Pratinjau naskah revisi"
                                        >
                                            <Eye className="w-3.5 h-3.5 text-amber-700" /> Lihat
                                        </button>
                                        <a
                                            href={`/verifikator/revisi/${rev.id}/download`}
                                            download={rev.nama_file}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                                            title="Unduh naskah revisi ke perangkat"
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
                        <div className="space-y-4">
                            {soal.verifikasi.map((v) => {
                                const cfg = ACTION_CONFIG[v.action] || {
                                    label: v.action,
                                    icon: FileCheck,
                                    color: 'text-gray-600',
                                    bg: 'bg-gray-50 border-gray-200',
                                    badge: 'bg-gray-100 text-gray-600',
                                };
                                const Icon = cfg.icon;

                                // clo_feedback: support format lama (string) dan baru (object)
                                const cloEntries = v.clo_feedback && typeof v.clo_feedback === 'object'
                                    ? Object.entries(v.clo_feedback).filter(([_, val]) => {
                                        if (!val) return false;
                                        if (typeof val === 'string') return val.trim().length > 0;
                                        if (typeof val === 'object') return val.catatan?.trim().length > 0 || val.no_soal?.trim().length > 0;
                                        return false;
                                    })
                                    : [];



                                return (
                                    <div key={v.id} className={`p-4 rounded-2xl border ${cfg.bg} space-y-3`}>
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

                                        {/* Tabel Catatan Per-CLO di riwayat */}
                                        {cloEntries.length > 0 && (
                                            <div className="space-y-1.5">
                                                <p className="font-bold text-gray-800 text-[11px]">Catatan Evaluasi Per-CLO:</p>
                                                <div className="rounded-xl border border-black/8 overflow-hidden">
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-[11px]">
                                                            <thead>
                                                                <tr className="bg-white/80 text-gray-600 border-b border-black/8">
                                                                    <th className="px-3 py-2 text-left font-bold w-[18%]">CLO</th>
                                                                    <th className="px-3 py-2 text-left font-bold w-[15%]">No. Soal</th>
                                                                    <th className="px-3 py-2 text-left font-bold">Catatan Evaluasi</th>
                                                                    <th className="px-3 py-2 text-left font-bold w-[28%]">Rekomendasi Terhadap PLO</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-black/5">
                                                                {cloEntries.map(([kode, val], nIdx) => {
                                                                    const resolved = resolveCloNote(v.clo_feedback, kode);
                                                                    return (
                                                                        <tr key={nIdx} className="bg-white/60">
                                                                            <td className="px-3 py-2 align-top border-r border-black/5">
                                                                                <span className="px-1.5 py-0.5 rounded bg-red-100 text-[#801720] font-bold text-[10px] whitespace-nowrap flex-shrink-0">
                                                                                    {kode}
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-3 py-2 align-top border-r border-black/5 text-gray-600">
                                                                                {resolved?.no_soal || <span className="text-gray-300">—</span>}
                                                                            </td>
                                                                            <td className="px-3 py-2 align-top border-r border-black/5 text-gray-700 leading-relaxed">
                                                                                {resolved?.catatan || <span className="text-gray-300">—</span>}
                                                                            </td>
                                                                            <td className="px-3 py-2 align-top text-gray-600 leading-relaxed">
                                                                                {resolved?.rekomendasi || <span className="text-gray-300">—</span>}
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
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

        <DocumentPreviewModal
            open={previewModal.open}
            onClose={closePreview}
            fileName={previewModal.fileName}
            previewUrl={previewModal.previewUrl}
            downloadUrl={previewModal.downloadUrl}
        />
        </>
    );
}
