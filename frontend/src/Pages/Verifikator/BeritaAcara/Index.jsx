import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    FileText, BookOpen, Printer, Clock, CheckCircle2,
    AlertCircle, Calendar, Download, Award, ShieldCheck, Eye
} from 'lucide-react';

import FlashAlert from '@/Components/FlashAlert';

function Toast({ flash }) {
    return <FlashAlert type="toast" flash={flash} />;
}

export default function BeritaAcaraIndex({ activePeriod, assignments = [], history = [] }) {
    const { flash } = usePage().props;

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: '2-digit', month: 'long', year: 'numeric'
        });
    };

    return (
        <AuthenticatedLayout title="Kelola Berita Acara">
            <Head title="Kelola Berita Acara Verifikasi - Sistem Verifikasi Soal" />
            <Toast flash={flash} />

            <div className="space-y-6">
                {/* Header Title */}
                <div>
                    <h1 className="text-2xl font-extrabold text-[#1E293B] tracking-tight flex items-center gap-2">
                        <FileText className="w-7 h-7 text-[#801720]" />
                        <span>Kelola Berita Acara</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-[#64748B] font-medium mt-1">
                        Cetak Berita Acara Pertanggungjawaban (BAP) verifikasi soal untuk mata kuliah yang telah selesai diverifikasi.
                    </p>
                </div>

                {/* Info Card / Hero */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#801720]/10 text-[#801720] text-xs font-bold border border-[#801720]/25">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Prosedur BAP Verifikasi</span>
                        </div>
                        <h2 className="text-lg font-black text-slate-800">Kapan BAP dapat dicetak?</h2>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Berita Acara dapat dicetak untuk soal yang telah <strong>Disetujui (Approved)</strong> oleh Verifikator. Soal yang masih dalam proses (pending, revisi) tidak akan tercantum. Anda dapat mencetak BAP kapan saja selama terdapat minimal satu soal yang telah disetujui.
                        </p>
                    </div>

                    {/* Active Period Card */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 flex-shrink-0 md:w-80">
                        <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">Periode Verifikasi Aktif</span>
                        {activePeriod ? (
                            <div className="mt-2 space-y-1">
                                <div className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>{activePeriod.nama}</span>
                                </div>
                                <span className="text-[11px] font-semibold text-slate-400 block">
                                    Tahun Ajaran: {activePeriod.tahun_ajaran?.nama || '—'}
                                </span>
                            </div>
                        ) : (
                            <div className="mt-2 flex items-center gap-2 text-amber-600 font-bold text-xs">
                                <AlertCircle className="w-4 h-4" />
                                <span>Tidak ada periode aktif</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Grid Lists */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left: Mata Kuliah & Proges Cetak */}
                    <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                        <div>
                            <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-[#801720]" />
                                <span>Status Progres Penugasan MK</span>
                            </h3>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">
                                Daftar mata kuliah yang ditugaskan kepada Anda pada periode berjalan ini
                            </p>
                        </div>

                        {assignments.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200/80">
                                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                <h4 className="text-sm font-extrabold text-slate-700">Tidak ada penugasan</h4>
                                <p className="text-xs text-slate-400 mt-1">Anda tidak ditugaskan sebagai verifikator pada periode ini.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {assignments.map(a => {
                                    const readyToPrint = a.has_approved;
                                    return (
                                        <div key={a.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="space-y-1">
                                                <h4 className="font-extrabold text-slate-800 text-sm">{a.mata_kuliah?.nama_mk}</h4>
                                                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                                                    <span className="text-[#801720] font-bold">{a.mata_kuliah?.kode_mk}</span>
                                                    <span>•</span>
                                                    <span>{a.mata_kuliah?.sks || 3} SKS</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[10px]">
                                                        {a.total} Soal Total
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {/* Stats badges */}
                                                <div className="flex items-center gap-1.5 text-[11px] font-bold">
                                                    {a.approved > 0 && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            {a.approved} Disetujui
                                                        </span>
                                                    )}
                                                    {a.pending > 0 && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                                            <Clock className="w-3 h-3" />
                                                            {a.pending} Pending
                                                        </span>
                                                    )}
                                                    {a.total === 0 && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 text-slate-400 border border-slate-200">
                                                            Belum ada soal
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Action Button */}
                                                {readyToPrint ? (
                                                    <Link
                                                        href={`/verifikator/mata-kuliah/${a.mata_kuliah_id}/berita-acara`}
                                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#801720] hover:bg-[#6a1219] text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        <span>Lihat BAP</span>
                                                    </Link>
                                                ) : (
                                                    <button
                                                        disabled
                                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 text-slate-400 text-xs font-bold rounded-xl border border-slate-200 cursor-not-allowed"
                                                        title="Belum ada soal yang disetujui untuk mata kuliah ini"
                                                    >
                                                        <Printer className="w-3.5 h-3.5" />
                                                        <span>Cetak BAP</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right: Riwayat BAP yang Dicetak */}
                    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                        <div>
                            <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-[#801720]" />
                                <span>Riwayat Cetak</span>
                            </h3>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">
                                Dokumen Berita Acara yang telah Anda cetak pada periode ini
                            </p>
                        </div>

                        {history.length === 0 ? (
                            <div className="text-center py-10 text-slate-400">
                                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                <p className="text-xs font-semibold">Belum ada riwayat cetak</p>
                            </div>
                        ) : (
                            <div className="space-y-3.5">
                                {history.map(h => (
                                    <div key={h.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 hover:bg-white hover:border-[#801720]/30 transition-all duration-200 flex flex-col justify-between gap-3 group">
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-[10px] font-bold text-slate-400 truncate max-w-[150px]">{h.nomor}</span>
                                                <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-semibold">
                                                    <Calendar className="w-3 h-3 text-slate-400" />
                                                    {formatDate(h.tanggal)}
                                                </span>
                                            </div>
                                            <h4 className="font-extrabold text-slate-800 text-xs group-hover:text-[#801720] transition-colors leading-tight">
                                                {h.mata_kuliah?.nama_mk}
                                            </h4>
                                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium pt-1">
                                                <span>Koord: <strong className="text-slate-700">{h.koordinator?.nama_lengkap || h.koordinator?.nama || '—'}</strong></span>
                                                <span className="text-emerald-600 font-extrabold">{h.jumlah_approved} Approved</span>
                                            </div>
                                        </div>

                                        <Link
                                            href={`/verifikator/mata-kuliah/${h.mata_kuliah_id}/berita-acara`}
                                            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 border border-[#801720] hover:bg-red-50 text-[#801720] rounded-xl text-[11px] font-bold transition-all"
                                        >
                                            <Eye className="w-3 h-3" /> Lihat &amp; Unduh BAP
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
