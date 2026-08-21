import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    FileCheck, Download, ArrowLeft, CheckCircle2, RefreshCw,
    XCircle, FileText, Clock, User, Calendar, X, Eye
} from 'lucide-react';

const STATUS_CONFIG = {
    DRAFT:       { label: 'Draft',         color: 'bg-gray-100 text-gray-600',      dot: 'bg-gray-400' },
    SUBMITTED:   { label: 'Disubmit',      color: 'bg-blue-100 text-blue-700',      dot: 'bg-blue-500' },
    IN_REVIEW:   { label: 'Sedang Review', color: 'bg-purple-100 text-purple-700',  dot: 'bg-purple-500' },
    RESUBMITTED: { label: 'Revisi Submit', color: 'bg-indigo-100 text-indigo-700',  dot: 'bg-indigo-500' },
    APPROVED:    { label: 'Disetujui',     color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
    REVISION:    { label: 'Perlu Revisi',  color: 'bg-amber-100 text-amber-700',    dot: 'bg-amber-400' },
    REJECTED:    { label: 'Ditolak',       color: 'bg-red-100 text-red-600',        dot: 'bg-red-400' },
};

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${cfg.color}`}>
            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

import FlashAlert from '@/Components/FlashAlert';
import { showToast, showAlert, showConfirm } from '@/Utils/sweetalert';

function Toast({ flash }) {
    return <FlashAlert type="toast" flash={flash} />;
}

export default function VerifikatorSoalShow({ soal }) {
    const { flash } = usePage().props;
    const [action, setAction] = useState('');
    const [catatan, setCatatan] = useState('');
    const [processing, setProcessing] = useState(false);

    const canVerify = ['SUBMITTED', 'IN_REVIEW', 'RESUBMITTED'].includes(soal.status);

    const handleVerifikasi = async (e) => {
        e.preventDefault();
        if (!action) return;

        if (action === 'REVISION' && !catatan.trim()) {
            showAlert({
                title: 'Catatan Wajib Diisi',
                text: 'Harap berikan catatan detail mengenai bagian yang perlu direvisi.',
                icon: 'warning',
            });
            return;
        }

        const actionLabels = {
            APPROVED: 'menyetujui (Approve)',
            REVISION: 'meminta revisi untuk',
            REJECTED: 'menolak (Reject)',
        };

        const result = await showConfirm({
            title: 'Konfirmasi Verifikasi',
            text: `Apakah Anda yakin ingin ${actionLabels[action] || action} soal ini?`,
            icon: action === 'APPROVED' ? 'question' : 'warning',
            confirmButtonText: 'Ya, Kirim Verifikasi',
            cancelButtonText: 'Batal',
            confirmButtonColor: action === 'APPROVED' ? '#059669' : '#801720',
        });

        if (!result.isConfirmed) return;

        setProcessing(true);
        router.post(`/verifikator/soal/${soal.id}/verifikasi`, { action, catatan }, {
            onFinish: () => setProcessing(false)
        });
    };


    const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
    const formatSize = (b) => b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;

    return (
        <AuthenticatedLayout title="Detail Soal">
            <Head title={`Review: ${soal.judul}`} />
            <Toast flash={flash} />

            <div className="space-y-6 max-w-4xl">
                {/* Back + Header */}
                <div>
                    <Link href="/verifikator/soal" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#801720] mb-3">
                        <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Daftar Soal
                    </Link>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-xl font-extrabold text-gray-800">{soal.judul}</h1>
                            <p className="text-sm text-gray-500 mt-0.5">{soal.mata_kuliah?.nama_mk} · {soal.kategori?.nama}</p>
                        </div>
                        <StatusBadge status={soal.status} />
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Soal Info */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* File Card */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-[#801720]" /> File Soal
                            </h2>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-200/80">
                                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                    <div className="w-11 h-11 rounded-2xl bg-red-100/80 border border-red-200/60 flex items-center justify-center flex-shrink-0 shadow-xs">
                                        <FileText className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-gray-800 break-all leading-snug">{soal.nama_file}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-red-100 text-red-700">PDF/DOC</span>
                                            <span className="text-xs font-medium text-gray-400">{formatSize(soal.file_size)}</span>
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
                        </div>

                        {/* Revisi History */}
                        {soal.revisi?.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <RefreshCw className="w-4 h-4 text-[#801720]" /> Riwayat Revisi
                                </h2>
                                <div className="space-y-3">
                                    {soal.revisi.map(rev => (
                                        <div key={rev.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl">
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <div className="w-8 h-8 rounded-xl bg-amber-200 flex items-center justify-center flex-shrink-0 text-xs font-extrabold text-amber-800 shadow-xs">
                                                    v{rev.version}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-bold text-gray-800 break-all">{rev.nama_file}</p>
                                                    {rev.catatan && <p className="text-[11px] text-gray-600 mt-0.5">{rev.catatan}</p>}
                                                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">{formatDate(rev.uploaded_at)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <a
                                                    href={`/verifikator/revisi/${rev.id}/preview`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-amber-200 hover:bg-amber-100/50 text-amber-800 rounded-lg text-xs font-bold transition-all shadow-xs"
                                                    title="Lihat naskah revisi"
                                                >
                                                    <Eye className="w-3.5 h-3.5 text-amber-700" /> Lihat
                                                </a>
                                                <a
                                                    href={`/verifikator/revisi/${rev.id}/download`}
                                                    download={rev.nama_file}
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

                        {/* Verifikasi History */}
                        {soal.verifikasi?.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-[#801720]" /> Riwayat Verifikasi
                                </h2>
                                <div className="space-y-3">
                                    {soal.verifikasi.map(v => {
                                        const actionCfg = {
                                            APPROVED: { color: 'border-emerald-200 bg-emerald-50', badgeColor: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
                                            REVISION: { color: 'border-amber-200 bg-amber-50',    badgeColor: 'bg-amber-100 text-amber-700',    icon: RefreshCw },
                                            REJECTED: { color: 'border-red-200 bg-red-50',        badgeColor: 'bg-red-100 text-red-600',        icon: XCircle },
                                        }[v.action] || { color: 'border-gray-200 bg-gray-50', badgeColor: 'bg-gray-100 text-gray-600', icon: FileCheck };
                                        const Icon = actionCfg.icon;
                                        return (
                                            <div key={v.id} className={`p-3 rounded-xl border ${actionCfg.color}`}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${actionCfg.badgeColor} flex items-center gap-1`}>
                                                        <Icon className="w-3 h-3" /> {v.action}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">{formatDate(v.created_at)}</span>
                                                </div>
                                                {v.catatan && <p className="text-xs text-gray-700 mt-1">{v.catatan}</p>}
                                                <p className="text-[10px] text-gray-400 mt-1">— {v.verifikator?.name}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar: Verifikasi Panel + Metadata */}
                    <div className="space-y-4">
                        {/* Verifikasi Panel */}
                        {canVerify ? (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <FileCheck className="w-4 h-4 text-[#801720]" /> Beri Keputusan
                                </h2>
                                <form onSubmit={handleVerifikasi} className="space-y-4">
                                    <div className="space-y-2">
                                        {[
                                            { value: 'APPROVED', label: 'Setujui (APPROVE)', icon: CheckCircle2, color: 'border-emerald-400 bg-emerald-50 text-emerald-700' },
                                            { value: 'REVISION', label: 'Minta Revisi',       icon: RefreshCw,    color: 'border-amber-400 bg-amber-50 text-amber-700' },
                                            { value: 'REJECTED', label: 'Tolak (REJECT)',      icon: XCircle,      color: 'border-red-400 bg-red-50 text-red-600' },
                                        ].map(opt => {
                                            const Icon = opt.icon;
                                            return (
                                                <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${action === opt.value ? opt.color : 'border-gray-200 hover:border-gray-300'}`}>
                                                    <input type="radio" name="action" value={opt.value} checked={action === opt.value}
                                                        onChange={() => setAction(opt.value)} className="accent-[#801720]" />
                                                    <Icon className="w-4 h-4" />
                                                    <span className="text-xs font-semibold">{opt.label}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                                            Catatan {action === 'REVISION' && <span className="text-red-500">*</span>}
                                        </label>
                                        <textarea rows={3} value={catatan} onChange={e => setCatatan(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs resize-none focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] outline-none"
                                            placeholder={action === 'REVISION' ? 'Jelaskan apa yang perlu direvisi...' : 'Catatan tambahan (opsional)...'} />
                                    </div>
                                    <button type="submit" disabled={processing || !action}
                                        className="w-full py-2.5 bg-[#801720] text-white rounded-xl text-sm font-semibold hover:bg-[#6a1219] disabled:opacity-60 transition-all">
                                        {processing ? 'Memproses...' : 'Kirim Keputusan'}
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 text-center">
                                <StatusBadge status={soal.status} />
                                <p className="text-xs text-gray-500 mt-2">Soal ini sudah mendapat keputusan verifikasi.</p>
                            </div>
                        )}

                        {/* Metadata */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                            <h2 className="font-bold text-gray-800 text-sm">Detail Soal</h2>
                            <div className="space-y-2 text-xs">
                                <div className="flex items-start gap-2">
                                    <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-gray-400">Diunggah oleh</p>
                                        <p className="font-semibold text-gray-700">{soal.uploaded_by?.name}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-gray-400">Periode</p>
                                        <p className="font-semibold text-gray-700">{soal.periode?.nama}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-gray-400">Kategori</p>
                                        <p className="font-semibold text-gray-700">{soal.kategori?.nama}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
