import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ArrowLeft, FileText, Download, Pencil, Send, AlertTriangle, CheckCircle2,
    XCircle, Clock, History, User, Eye, Layers, MessageSquare
} from 'lucide-react';
import FlashAlert from '@/Components/FlashAlert';
import { showToast, showAlert, showConfirm } from '@/Utils/sweetalert';

function Toast({ flash }) {
    return <FlashAlert type="toast" flash={flash} />;
}

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
    REVISION: { label: 'Perlu Revisi',  icon: AlertTriangle, color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200',     badge: 'bg-amber-100 text-amber-700' },
    REJECTED: { label: 'Ditolak',       icon: XCircle,      color: 'text-red-600',     bg: 'bg-red-50 border-red-200',         badge: 'bg-red-100 text-red-600' },
};

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${cfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatSize(bytes) {
    if (!bytes) return '-';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

export default function SoalShow({ soal }) {
    const { flash } = usePage().props;
    const ploList = soal.plo_clo_data?.plo || [];
    const latestRevision = soal.verifikasi?.find(v => v.action === 'REVISION');
    const latestCloFeedback = latestRevision?.clo_feedback || {};

    const handleSubmit = async () => {
        const result = await showConfirm({
            title: 'Submit Soal untuk Verifikasi?',
            text: `Submit "${soal.judul}"? Soal akan dikirim ke verifikator untuk diperiksa.`,
            icon: 'question',
            confirmButtonText: 'Ya, Submit Soal',
            confirmButtonColor: '#059669',
        });
        if (result.isConfirmed) {
            router.post(`/koordinator/soal/${soal.id}/submit`, {}, { preserveScroll: true });
        }
    };

    return (
        <AuthenticatedLayout title={soal.judul}>
            <Head title={soal.judul} />
            <Toast flash={flash} />

            <div className="max-w-3xl mx-auto space-y-6">
                <Link href={`/koordinator/mata-kuliah/${soal.mata_kuliah_id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#801720]">
                    <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke {soal.mata_kuliah?.nama_mk}
                </Link>

                {/* Main Card */}
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

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-5 p-4 bg-gray-50 rounded-2xl border border-gray-200/80">
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div className="w-11 h-11 rounded-2xl bg-red-100/80 border border-red-200/60 flex items-center justify-center flex-shrink-0 shadow-xs">
                                <FileText className="w-5 h-5 text-red-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-gray-800 break-all leading-snug">{soal.nama_file}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-red-100 text-red-700">PDF/DOC</span>
                                    <span className="text-xs font-medium text-gray-400">{formatSize(soal.file_size)} · Diunggah {formatDateTime(soal.created_at)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <a
                                href={`/koordinator/soal/${soal.id}/preview`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-xs"
                                title="Buka pratinjau naskah soal di tab baru"
                            >
                                <Eye className="w-3.5 h-3.5 text-gray-500" /> Lihat
                            </a>
                            <a
                                href={`/koordinator/soal/download/${soal.id}`}
                                download={soal.nama_file}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#801720] hover:bg-[#6a1219] text-white rounded-xl text-xs font-bold shadow-sm shadow-[#801720]/25 transition-all hover:scale-[1.02] active:scale-95"
                                title="Unduh berkas naskah soal"
                            >
                                <Download className="w-3.5 h-3.5" /> Download
                            </a>
                        </div>
                    </div>

                    {soal.status === 'DRAFT' && (
                        <div className="flex gap-2 mt-5">
                            <Link href={`/koordinator/soal/${soal.id}/edit`}
                                className="flex-1 text-center inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50">
                                <Pencil className="w-4 h-4" /> Edit
                            </Link>
                            <button onClick={handleSubmit}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#801720] text-white text-sm font-semibold hover:bg-[#6a1219] cursor-pointer">
                                <Send className="w-4 h-4" /> Submit untuk Verifikasi
                            </button>
                        </div>
                    )}

                    {soal.status === 'REVISION' && (
                        <Link href={`/koordinator/soal/${soal.id}/edit`}
                            className="mt-5 w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#801720] text-white text-sm font-semibold hover:bg-[#6a1219]">
                            <Pencil className="w-4 h-4" /> Unggah Berkas Revisi
                        </Link>
                    )}
                </div>

                {/* Revision Callout */}
                {soal.status === 'REVISION' && latestRevision && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
                                <AlertTriangle className="w-4 h-4" /> PERLU REVISI
                            </div>
                            {latestRevision.verifikator?.name && (
                                <span className="text-xs text-amber-800">
                                    Verifikator: <strong>{latestRevision.verifikator.name}</strong>
                                </span>
                            )}
                        </div>

                        {latestRevision.catatan && (
                            <p className="text-xs text-gray-700 bg-white rounded-xl p-3 border border-amber-100">
                                <span className="font-semibold text-gray-800">Catatan Umum:</span> "{latestRevision.catatan}"
                            </p>
                        )}
                    </div>
                )}

                {/* Pemetaan PLO & CLO */}
                {ploList.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                        <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-[#801720]" /> Pemetaan PLO &amp; CLO Soal
                        </h2>

                        <div className="space-y-3">
                            {ploList.map((plo, pIdx) => (
                                <div key={pIdx} className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2.5">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded-md bg-[#801720] text-white text-[10px] font-extrabold">
                                            {plo.kode}
                                        </span>
                                        <span className="text-xs font-bold text-gray-800">{plo.deskripsi}</span>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 pt-1">
                                        {plo.clo?.map((clo, cIdx) => {
                                            const cloNote = latestCloFeedback[clo.kode];
                                            return (
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

                                                    {cloNote && (
                                                        <div className="flex items-start gap-1.5 p-2 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                                                            <MessageSquare className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                                                            <div>
                                                                <span className="font-bold">Catatan Koreksi Verifikator:</span> {cloNote}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Verifikasi History */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#801720]" /> Riwayat Verifikasi
                    </h2>
                    {(!soal.verifikasi || soal.verifikasi.length === 0) ? (
                        <p className="text-sm text-gray-400 text-center py-6">Belum ada riwayat verifikasi.</p>
                    ) : (
                        <div className="space-y-3">
                            {soal.verifikasi.map(v => {
                                const cfg = ACTION_CONFIG[v.action] || ACTION_CONFIG.REVISION;
                                const Icon = cfg.icon;
                                const cloNotes = v.clo_feedback && typeof v.clo_feedback === 'object'
                                    ? Object.entries(v.clo_feedback).filter(([_, note]) => note && String(note).trim().length > 0)
                                    : [];

                                return (
                                    <div key={v.id} className={`p-4 rounded-2xl border ${cfg.bg} space-y-2`}>
                                        <div className="flex items-center justify-between gap-2">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${cfg.badge}`}>
                                                <Icon className="w-3.5 h-3.5" /> {cfg.label}
                                            </span>
                                            <span className="text-[10px] text-gray-400">{formatDateTime(v.created_at)}</span>
                                        </div>

                                        {v.catatan && (
                                            <p className="text-xs text-gray-700 bg-white/90 rounded-xl p-2.5 border border-black/5">
                                                "{v.catatan}"
                                            </p>
                                        )}

                                        {cloNotes.length > 0 && (
                                            <div className="p-2.5 bg-white/90 rounded-xl border border-black/5 text-xs space-y-1">
                                                <p className="font-bold text-gray-800 text-[11px]">Catatan Per-CLO:</p>
                                                <div className="space-y-1">
                                                    {cloNotes.map(([kode, note], idx) => (
                                                        <div key={idx} className="flex items-start gap-1.5 text-gray-700">
                                                            <span className="px-1.5 py-0.5 rounded bg-red-100 text-[#801720] font-bold text-[10px] flex-shrink-0">
                                                                {kode}
                                                            </span>
                                                            <span className="text-xs">{note}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <p className="text-[10px] text-gray-400">
                                            Diverifikasi oleh <span className="font-semibold text-gray-600">{v.verifikator?.name || 'Verifikator'}</span>
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Revision file history */}
                {soal.revisi && soal.revisi.length > 0 && (
                    <div id="revisi" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <History className="w-4 h-4 text-[#801720]" /> Riwayat File Revisi
                        </h2>
                        <div className="space-y-2">
                            {soal.revisi.map(r => (
                                <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="w-8 h-8 rounded-xl bg-amber-200 flex items-center justify-center flex-shrink-0 text-xs font-extrabold text-amber-800 shadow-xs">
                                            v{r.version}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold text-gray-800 break-all">{r.nama_file}</p>
                                            <p className="text-[10px] text-gray-400 font-medium">
                                                Diunggah oleh {r.uploaded_by?.name || 'Koordinator'} · {formatDateTime(r.uploaded_at)}
                                            </p>
                                            {r.catatan && <p className="text-xs text-gray-600 mt-1">Catatan: {r.catatan}</p>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <a
                                            href={`/koordinator/revisi/${r.id}/preview`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-amber-200 hover:bg-amber-100/50 text-amber-800 rounded-lg text-xs font-bold transition-all shadow-xs"
                                            title="Lihat naskah revisi"
                                        >
                                            <Eye className="w-3.5 h-3.5 text-amber-700" /> Lihat
                                        </a>
                                        <a
                                            href={`/koordinator/revisi/${r.id}/download`}
                                            download={r.nama_file}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
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
            </div>
        </AuthenticatedLayout>
    );
}
