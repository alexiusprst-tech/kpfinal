import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ArrowLeft, FileText, Download, Pencil, Send, AlertTriangle, CheckCircle2,
    XCircle, Clock, History, User, Eye, Layers, MessageSquare
} from 'lucide-react';
import FlashAlert from '@/Components/FlashAlert';
import { showToast, showAlert, showConfirm } from '@/Utils/sweetalert';
import DocumentPreviewModal from '@/Components/DocumentPreviewModal';


const STATUS_CONFIG = {
    IN_REVIEW:   { label: 'In Review',       color: 'bg-purple-100 text-purple-700',   dot: 'bg-purple-500' },
    SUBMITTED:   { label: 'Submitted',       color: 'bg-blue-100 text-blue-700',       dot: 'bg-blue-500' },
    RESUBMITTED: { label: 'Revisi Terkirim', color: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500' },
    DRAFT:       { label: 'Draft',           color: 'bg-gray-100 text-gray-700',       dot: 'bg-gray-400' },
    REVISION:    { label: 'Revisi',          color: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-400' },
    APPROVED:    { label: 'Disetujui',       color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
    REJECTED:    { label: 'Ditolak',         color: 'bg-red-100 text-red-600',         dot: 'bg-red-400' },
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

function resolveCloNote(val) {
    if (!val) return null;
    if (typeof val === 'string') return { catatan: val, no_soal: '', rekomendasi: '' };
    if (typeof val === 'object') {
        return {
            no_soal: val.no_soal || '',
            catatan: val.catatan || '',
            rekomendasi: val.rekomendasi || '',
        };
    }
    return null;
}

export default function SoalShow({ soal }) {
    const { flash } = usePage().props;
    const [submitting, setSubmitting] = useState(false);
    const [previewModal, setPreviewModal] = useState({ open: false, fileName: '', previewUrl: '', downloadUrl: '' });

    const openPreview = (fileName, previewUrl, downloadUrl) =>
        setPreviewModal({ open: true, fileName, previewUrl, downloadUrl });
    const closePreview = () => setPreviewModal(m => ({ ...m, open: false }));

    const handleSubmit = async () => {
        const result = await showConfirm({
            title: 'Submit Soal untuk Verifikasi?',
            text: `Submit "${soal.judul}"? Soal akan dikirim ke verifikator. Setelah disubmit, file tidak dapat diubah sampai mendapat feedback.`,
            icon: 'question',
            confirmButtonText: 'Ya, Submit Soal',
            confirmButtonColor: '#059669',
        });
        if (result.isConfirmed) {
            setSubmitting(true);
            router.post(`/koordinator/soal/${soal.id}/submit`, {}, {
                onFinish: () => setSubmitting(false),
            });
        }
    };

    const latestVerifikasi = soal.latest_verifikasi || (soal.verifikasi && soal.verifikasi.length > 0 ? soal.verifikasi[0] : null);
    const latestRevision = soal.verifikasi?.find(v => v.action === 'REVISION');
    const latestCloFeedback = (latestRevision || latestVerifikasi)?.clo_feedback || {};
    const ploList = Array.isArray(soal.plo_clo_data) ? soal.plo_clo_data : [];

    return (
        <>
        <AuthenticatedLayout title="Detail Soal">
            <Head title={`Detail Soal: ${soal.judul}`} />
            <FlashAlert flash={flash} />

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Back button */}
                <div className="flex items-center justify-between">
                    <Link href="/koordinator/soal"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#801720] transition-colors">
                        <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Kelola Soal
                    </Link>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#801720] bg-red-50 px-2.5 py-0.5 rounded-full">
                                    {soal.mata_kuliah?.nama_mk} ({soal.mata_kuliah?.kode_mk})
                                </span>
                                <span className="text-xs text-gray-400">·</span>
                                <span className="text-xs text-gray-500">{soal.kategori?.nama}</span>
                                <span className="text-xs text-gray-400">·</span>
                                <span className="text-xs text-gray-500">{soal.periode?.nama_periode}</span>
                            </div>
                            <h1 className="text-xl font-extrabold text-gray-800">{soal.judul}</h1>
                        </div>
                        <StatusBadge status={soal.status} />
                    </div>

                    {/* File info box */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                                <FileText className="w-5 h-5 text-[#801720]" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-800">{soal.nama_file}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs font-bold text-gray-700">{soal.uploaded_by?.name || 'Dosen'}</span>
                                    <span className="text-xs text-gray-400">·</span>
                                    <span className="text-xs font-medium text-gray-400">{formatSize(soal.file_size)} · Diunggah {formatDateTime(soal.created_at)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                                type="button"
                                onClick={() => openPreview(soal.nama_file, `/koordinator/soal/${soal.id}/preview`, `/koordinator/soal/download/${soal.id}`)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-xs cursor-pointer"
                                title="Pratinjau naskah soal"
                            >
                                <Eye className="w-3.5 h-3.5 text-gray-500" /> Lihat
                            </button>
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
                            <button onClick={handleSubmit} disabled={submitting}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#801720] text-white text-sm font-semibold hover:bg-[#6a1219] cursor-pointer">
                                <Send className="w-4 h-4" /> {submitting ? 'Submitting...' : 'Submit untuk Verifikasi'}
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

                {/* Resubmitted Callout */}
                {soal.status === 'RESUBMITTED' && (
                    <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-5 space-y-2">
                        <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                            <Clock className="w-4 h-4" /> REVISI TELAH DIUNGGAH (MENUNGGU REVIEW)
                        </div>
                        <p className="text-xs text-indigo-900/80 leading-relaxed">
                            Berkas revisi soal telah berhasil diunggah dan dikirimkan kembali ke verifikator untuk ditinjau ulang. Riwayat berkas revisi dapat dilihat pada bagian bawah halaman ini.
                        </p>
                    </div>
                )}

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
                                        <span className="px-2 py-0.5 rounded-md bg-[#801720] text-white text-[10px] font-extrabold whitespace-nowrap flex-shrink-0">
                                            {plo.kode}
                                        </span>
                                        <span className="text-xs font-bold text-gray-800">{plo.deskripsi}</span>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 pt-1">
                                        {plo.clo?.map((clo, cIdx) => {
                                            const resolvedNote = resolveCloNote(latestCloFeedback[clo.kode]);
                                            const hasNote = resolvedNote && (resolvedNote.catatan || resolvedNote.no_soal || resolvedNote.rekomendasi);
                                            return (
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

                                                    {hasNote && (
                                                        <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                                                            <div className="flex items-center gap-1.5 font-bold">
                                                                <MessageSquare className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                                                                <span>Catatan Koreksi Verifikator:</span>
                                                                {resolvedNote.no_soal && (
                                                                    <span className="font-normal text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">
                                                                        No. Soal: {resolvedNote.no_soal}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {resolvedNote.catatan && (
                                                                <p className="text-amber-900 leading-relaxed font-medium">{resolvedNote.catatan}</p>
                                                            )}
                                                            {resolvedNote.rekomendasi && (
                                                                <p className="text-amber-700 italic text-[10px]">
                                                                    <strong>Rekomendasi PLO:</strong> {resolvedNote.rekomendasi}
                                                                </p>
                                                            )}
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
                                    ? Object.entries(v.clo_feedback).filter(([_, noteVal]) => {
                                        const r = resolveCloNote(noteVal);
                                        return r && (r.catatan?.trim() || r.no_soal?.trim() || r.rekomendasi?.trim());
                                    })
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
                                            <div className="p-2.5 bg-white/90 rounded-xl border border-black/5 text-xs space-y-1.5">
                                                <p className="font-bold text-gray-800 text-[11px]">Catatan Per-CLO:</p>
                                                <div className="space-y-1.5">
                                                    {cloNotes.map(([kode, noteVal], idx) => {
                                                        const resolved = resolveCloNote(noteVal);
                                                        return (
                                                            <div key={idx} className="flex flex-col gap-0.5 text-gray-700 bg-gray-50/70 p-2 rounded-lg border border-gray-100">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="px-1.5 py-0.5 rounded bg-red-100 text-[#801720] font-bold text-[10px] whitespace-nowrap flex-shrink-0">
                                                                        {kode}
                                                                    </span>
                                                                    {resolved.no_soal && (
                                                                        <span className="text-[10px] font-semibold text-gray-500">(No. Soal: {resolved.no_soal})</span>
                                                                    )}
                                                                </div>
                                                                {resolved.catatan && <p className="text-xs text-gray-800 mt-0.5">{resolved.catatan}</p>}
                                                                {resolved.rekomendasi && <p className="text-[11px] text-gray-500 italic">Rekomendasi: {resolved.rekomendasi}</p>}
                                                            </div>
                                                        );
                                                    })}
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
                                        <button
                                            type="button"
                                            onClick={() => openPreview(r.nama_file, `/koordinator/revisi/${r.id}/preview`, `/koordinator/revisi/${r.id}/download`)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-amber-200 hover:bg-amber-100/50 text-amber-800 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                                            title="Pratinjau naskah revisi"
                                        >
                                            <Eye className="w-3.5 h-3.5 text-amber-700" /> Lihat
                                        </button>
                                        <a
                                            href={`/koordinator/revisi/${r.id}/download`}
                                            download={r.nama_file}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
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
