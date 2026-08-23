import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ArrowLeft, FileText, CheckCircle2, Clock, Download, BookOpen,
    User, Calendar, Award, AlertCircle, RotateCcw, XCircle, Printer, ShieldCheck
} from 'lucide-react';
import FlashAlert from '@/Components/FlashAlert';

function Toast({ flash }) {
    return <FlashAlert type="toast" flash={flash} />;
}

const STATUS_BADGE = {
    APPROVED:    { label: 'Disetujui',   cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    REVISION:    { label: 'Revisi',      cls: 'bg-amber-100 text-amber-700 border-amber-200',       icon: RotateCcw },
    REJECTED:    { label: 'Ditolak',     cls: 'bg-red-100 text-red-600 border-red-200',             icon: XCircle },
    SUBMITTED:   { label: 'Menunggu',    cls: 'bg-blue-100 text-blue-700 border-blue-200',          icon: Clock },
    IN_REVIEW:   { label: 'In Review',   cls: 'bg-purple-100 text-purple-700 border-purple-200',    icon: Clock },
    RESUBMITTED: { label: 'Menunggu',    cls: 'bg-blue-100 text-blue-700 border-blue-200',          icon: Clock },
    DRAFT:       { label: 'Draft',       cls: 'bg-gray-100 text-gray-600 border-gray-200',          icon: FileText },
};

function StatusBadge({ status }) {
    const cfg = STATUS_BADGE[status] || STATUS_BADGE.DRAFT;
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${cfg.cls}`}>
            <Icon className="w-3 h-3" />
            {cfg.label}
        </span>
    );
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('id-ID', {
        day: '2-digit', month: 'long', year: 'numeric'
    });
}

function formatSize(bytes) {
    if (!bytes) return '—';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

export default function BeritaAcaraShow({ mataKuliah, activePeriod, soalApproved = [], stats, koordinator, existingBA }) {
    const { flash } = usePage().props;

    const downloadUrl = `/verifikator/mata-kuliah/${mataKuliah.id}/berita-acara/download`;

    return (
        <AuthenticatedLayout title={`Berita Acara — ${mataKuliah.nama_mk}`}>
            <Head title={`Berita Acara ${mataKuliah.nama_mk}`} />
            <Toast flash={flash} />

            <div className="space-y-6">
                {/* Back + Title */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/verifikator/berita-acara"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#801720] transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Berita Acara
                    </Link>

                    {/* Download All Button */}
                    {soalApproved.length > 0 && (
                        <a
                            href={downloadUrl}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-sm transition-all duration-200 hover:shadow-md"
                            title="Unduh satu dokumen BAP gabungan untuk semua soal yang disetujui"
                        >
                            <Printer className="w-4 h-4" />
                            Unduh Semua BAP (PDF)
                        </a>
                    )}
                </div>

                {/* Header Card */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-[#801720]/10 text-[#801720] text-xs font-bold border border-[#801720]/25">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Berita Acara Verifikasi</span>
                            </div>
                            <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-[#801720]" />
                                {mataKuliah.nama_mk}
                            </h1>
                            <p className="text-sm text-slate-500 mt-1">
                                {mataKuliah.kode_mk} · Semester {mataKuliah.semester} · {mataKuliah.sks} SKS
                            </p>
                            {koordinator && (
                                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                    Koordinator MK: <strong className="text-slate-700">{koordinator.nama}</strong>
                                    {koordinator.kode_dosen && <span className="text-slate-400">({koordinator.kode_dosen})</span>}
                                </p>
                            )}
                            {activePeriod && (
                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                    Periode: <strong className="text-slate-700">{activePeriod.nama}</strong>
                                    {activePeriod.tahun_ajaran && <span className="text-slate-400">· {activePeriod.tahun_ajaran.nama}</span>}
                                </p>
                            )}
                        </div>

                        {/* Stats - Hanya Total Soal Disetujui */}
                        <div className="flex-shrink-0 self-start md:self-center">
                            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl px-5 py-3.5 text-center min-w-[110px]">
                                <p className="text-2xl font-black text-emerald-600 leading-tight">{stats.approved}</p>
                                <p className="text-[11px] text-emerald-800 font-bold mt-0.5">Soal Disetujui</p>
                            </div>
                        </div>
                    </div>

                    {/* Existing BA info */}
                    {existingBA && (
                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3 text-xs text-slate-500">
                            <FileText className="w-4 h-4 text-[#801720]" />
                            <span>
                                BAP terakhir dicetak:&nbsp;
                                <strong className="text-slate-700">{existingBA.nomor}</strong>
                                &nbsp;pada&nbsp;
                                <strong className="text-slate-700">{formatDate(existingBA.tanggal)}</strong>
                                &nbsp;· Mengunduh ulang akan memperbarui dokumen.
                            </span>
                        </div>
                    )}
                </div>

                {/* Soal Approved List */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                                <Award className="w-5 h-5 text-emerald-500" />
                                Soal yang Disetujui (Siap Unduh BAP)
                            </h2>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">
                                Anda dapat mengunduh Berita Acara untuk masing-masing soal di bawah ini, atau mengunduh sekaligus semua soal.
                            </p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {soalApproved.length} Soal Disetujui
                        </span>
                    </div>

                    {soalApproved.length === 0 ? (
                        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <h3 className="text-sm font-extrabold text-slate-600">Belum ada soal yang disetujui</h3>
                            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                                Berita Acara akan tersedia setelah Anda menyetujui minimal satu soal untuk mata kuliah ini.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {soalApproved.map((soal, index) => (
                                <div
                                    key={soal.id}
                                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/20 transition-all duration-200"
                                >
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        {/* Sequence Number */}
                                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-extrabold flex items-center justify-center mt-0.5">
                                            {index + 1}
                                        </span>
                                        <div className="space-y-1.5 flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-bold text-slate-800 text-sm">{soal.judul}</h3>
                                                <StatusBadge status={soal.status} />
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-medium">
                                                {soal.kategori && (
                                                    <span className="flex items-center gap-1">
                                                        <FileText className="w-3 h-3 text-slate-400" /> {soal.kategori.nama}
                                                    </span>
                                                )}
                                                {soal.uploaded_by && (
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-3 h-3 text-slate-400" /> {soal.uploaded_by?.name || '—'}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3 text-slate-400" />
                                                    {formatDate(soal.latest_verifikasi?.created_at || soal.updated_at)}
                                                </span>
                                                {soal.file_size && (
                                                    <span className="text-slate-400">{formatSize(soal.file_size)}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons for this specific soal */}
                                    <div className="flex flex-wrap items-center gap-2 flex-shrink-0 self-end md:self-center pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/60 w-full md:w-auto justify-end">
                                        {soal.latest_verifikasi?.verifikator && (
                                            <span className="text-[10px] text-slate-500 font-semibold bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                                                Diverif: {soal.latest_verifikasi.verifikator?.name || '—'}
                                            </span>
                                        )}
                                        <a
                                            href={`/verifikator/soal/${soal.id}/berita-acara`}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#801720] hover:bg-[#6a1219] text-white text-xs font-bold rounded-xl shadow-xs transition-all duration-150 hover:shadow-sm"
                                            title={`Unduh BAP untuk ${soal.judul}`}
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                            <span>Unduh BAP Soal</span>
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Bottom Download CTA */}
                {soalApproved.length > 0 && (
                    <div className="bg-gradient-to-r from-[#801720] to-[#a31f2e] rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
                        <div className="text-white">
                            <h3 className="font-extrabold text-base">Unduh Semua Berita Acara Sekaligus?</h3>
                            <p className="text-xs text-red-100 mt-1">
                                Dokumen PDF gabungan akan memuat seluruh {soalApproved.length} soal yang telah disetujui untuk <strong>{mataKuliah.nama_mk}</strong>.
                            </p>
                        </div>
                        <a
                            href={downloadUrl}
                            className="inline-flex items-center gap-2 px-5 py-3 bg-white text-[#801720] text-sm font-extrabold rounded-2xl hover:bg-red-50 transition-all duration-200 shadow-sm whitespace-nowrap flex-shrink-0"
                        >
                            <Download className="w-4 h-4" />
                            Unduh Semua BAP (PDF)
                        </a>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
