import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ArrowLeft, FileText, Download, Pencil, Send, AlertTriangle, CheckCircle2,
    XCircle, Clock, History, X, User,
} from 'lucide-react';

const STATUS_CONFIG = {
    DRAFT:       { label: 'Draft',        color: 'bg-gray-100 text-gray-600',       dot: 'bg-gray-400' },
    SUBMITTED:   { label: 'Disubmit',     color: 'bg-blue-100 text-blue-700',       dot: 'bg-blue-500' },
    IN_REVIEW:   { label: 'Direview',     color: 'bg-purple-100 text-purple-700',   dot: 'bg-purple-500' },
    RESUBMITTED: { label: 'Resubmit',     color: 'bg-indigo-100 text-indigo-700',   dot: 'bg-indigo-500' },
    APPROVED:    { label: 'Disetujui',    color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
    REVISION:    { label: 'Perlu Revisi', color: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-400' },
    REJECTED:    { label: 'Ditolak',      color: 'bg-red-100 text-red-600',         dot: 'bg-red-400' },
};

const ACTION_CONFIG = {
    APPROVED: { label: 'Menyetujui', icon: CheckCircle2, color: 'text-emerald-600' },
    REVISION: { label: 'Meminta Revisi', icon: AlertTriangle, color: 'text-amber-600' },
    REJECTED: { label: 'Menolak', icon: XCircle, color: 'text-red-600' },
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

function Toast({ flash }) {
    const [visible, setVisible] = useState(true);
    if (!visible || (!flash?.success && !flash?.error)) return null;
    return (
        <div className={`fixed top-5 right-5 z-50 flex items-start gap-3 p-4 rounded-xl shadow-xl text-white text-sm max-w-sm ${flash.success ? 'bg-emerald-600' : 'bg-red-600'}`}>
            <span className="flex-1">{flash.success || flash.error}</span>
            <button onClick={() => setVisible(false)}><X className="w-4 h-4" /></button>
        </div>
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
    const [confirmSubmit, setConfirmSubmit] = useState(false);

    const latestRevisionNote = soal.verifikasi?.find(v => v.action === 'REVISION');

    const handleSubmit = () => {
        router.post(`/koordinator/soal/${soal.id}/submit`, {}, { preserveScroll: true, onFinish: () => setConfirmSubmit(false) });
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

                {/* Header */}
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

                    <div className="flex items-center gap-3 mt-5 p-4 bg-gray-50 rounded-xl">
                        <FileText className="w-8 h-8 text-[#801720] flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-800 truncate">{soal.nama_file}</p>
                            <p className="text-xs text-gray-400">{formatSize(soal.file_size)} · Diunggah {formatDateTime(soal.created_at)}</p>
                        </div>
                        <a href={`/koordinator/soal/download/${soal.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100">
                            <Download className="w-3.5 h-3.5" /> Unduh
                        </a>
                    </div>

                    {soal.status === 'DRAFT' && (
                        <div className="flex gap-2 mt-5">
                            <Link href={`/koordinator/soal/${soal.id}/edit`}
                                className="flex-1 text-center inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50">
                                <Pencil className="w-4 h-4" /> Edit
                            </Link>
                            <button onClick={() => setConfirmSubmit(true)}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#801720] text-white text-sm font-semibold hover:bg-[#6a1219]">
                                <Send className="w-4 h-4" /> Submit
                            </button>
                        </div>
                    )}

                    {soal.status === 'REVISION' && (
                        <Link href={`/koordinator/soal/${soal.id}/edit`}
                            className="mt-5 w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#801720] text-white text-sm font-semibold hover:bg-[#6a1219]">
                            <Pencil className="w-4 h-4" /> Edit &amp; Submit Ulang
                        </Link>
                    )}
                </div>

                {/* Revision callout */}
                {soal.status === 'REVISION' && latestRevisionNote && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                        <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
                            <AlertTriangle className="w-4 h-4" /> PERLU REVISI
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-xs text-gray-600">
                            <User className="w-3.5 h-3.5" /> Verifikator: <strong>{latestRevisionNote.verifikator?.name}</strong>
                        </div>
                        <p className="mt-2 text-sm text-gray-700 bg-white rounded-lg p-3 border border-amber-100">
                            "{latestRevisionNote.catatan || 'Tidak ada catatan tambahan.'}"
                        </p>
                    </div>
                )}

                {/* Verifikasi history */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
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
                                return (
                                    <div key={v.id} className="flex items-start gap-3">
                                        <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cfg.color}`} />
                                        <div className="min-w-0">
                                            <p className="text-sm text-gray-700">
                                                <strong>{v.verifikator?.name}</strong> {cfg.label.toLowerCase()}
                                            </p>
                                            {v.catatan && <p className="text-xs text-gray-500 mt-0.5">"{v.catatan}"</p>}
                                            <p className="text-[10px] text-gray-400 mt-0.5">{formatDateTime(v.created_at)}</p>
                                        </div>
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
                                <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                                    <FileText className="w-6 h-6 text-gray-400 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-gray-800">Versi {r.version} — {r.nama_file}</p>
                                        <p className="text-[10px] text-gray-400">
                                            Diunggah oleh {r.uploaded_by?.name} · {formatDateTime(r.uploaded_at)}
                                        </p>
                                        {r.catatan && <p className="text-xs text-gray-500 mt-1">Catatan: {r.catatan}</p>}
                                    </div>
                                    <a href={`/koordinator/revisi/${r.id}/download`}
                                        className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600 flex-shrink-0" title="Unduh">
                                        <Download className="w-3.5 h-3.5" />
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {confirmSubmit && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mb-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                        </div>
                        <h3 className="font-bold text-gray-800">Submit soal ini?</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Soal akan dikirim untuk verifikasi dan tidak dapat diedit lagi sampai ada keputusan dari verifikator.
                        </p>
                        <div className="flex gap-2 mt-5">
                            <button onClick={() => setConfirmSubmit(false)}
                                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">
                                Batal
                            </button>
                            <button onClick={handleSubmit}
                                className="flex-1 px-4 py-2 rounded-xl bg-[#801720] text-white text-sm font-semibold hover:bg-[#6a1219]">
                                Ya, Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
