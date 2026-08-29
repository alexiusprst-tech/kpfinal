import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ArrowLeft, BookOpen, Calendar, CheckCircle2, Clock, Edit, FileCheck,
    FolderKanban, History, Lock, MoreVertical, Pencil, Play, PowerOff,
    RotateCcw, Shield, Sparkles, Trash2, Users, X, AlertCircle, TrendingUp
} from 'lucide-react';

import FlashAlert from '@/Components/FlashAlert';
import { showToast, showAlert, showConfirm } from '@/Utils/sweetalert';

function Toast({ flash }) {
    return <FlashAlert type="toast" flash={flash} />;
}


const STATUS_CONFIG = {
    DRAFT:    { label: 'Draft',     bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200/60', dot: 'bg-amber-500' },
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

const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const formatDateTime = (d) => d ? new Date(d).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function KelompokVerifikasiShow({ kelompok, mkListStats, verifikatorListStats, progress, recentActivities }) {
    const { flash } = usePage().props;

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


    return (
        <AuthenticatedLayout title={kelompok.nama}>
            <Head title={`${kelompok.nama} - Detail Kelompok`} />
            <Toast flash={flash} />

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
                                    <Pencil className="w-3.5 h-3.5" /> Edit Kelompok
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
                                    <Pencil className="w-3.5 h-3.5" /> Edit Penugasan
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
                                    <Pencil className="w-3.5 h-3.5" /> Edit Kelompok
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
                                    <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">Progress Upload Soal</h3>
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
                                    <p className="text-[11px] text-gray-500">Soal yang telah disetujui (Approved) dari soal yang direview</p>
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
                        <span className="text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                            {mkListStats.length} Mata Kuliah
                        </span>
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
                                    <th className="py-3 px-3 text-center">Draft</th>
                                    <th className="py-3 px-3 text-center">Submitted</th>
                                    <th className="py-3 px-3 text-center">In Review</th>
                                    <th className="py-3 px-3 text-center">Revision</th>
                                    <th className="py-3 px-3 text-center">Approved</th>
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
                                            <span className="font-bold text-gray-800 block">{mk.koordinator?.kode_dosen}</span>
                                            <span className="text-[11px] text-gray-500">{mk.koordinator?.nama_lengkap}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            {mk.verifikator_list && mk.verifikator_list.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {mk.verifikator_list.map((v) => (
                                                        <span
                                                            key={v.id}
                                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200"
                                                        >
                                                            <Shield className="w-2.5 h-2.5" />
                                                            {v.kode_dosen}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 italic text-[11px]">—</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-3 text-center font-extrabold text-gray-900">{mk.soal_count}</td>
                                        <td className="py-3 px-3 text-center">
                                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${mk.draft > 0 ? 'bg-gray-100 text-gray-700' : 'text-gray-300'}`}>
                                                {mk.draft}
                                            </span>
                                        </td>
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
                                    <th className="py-3 px-3 text-center">Diverifikasi (Approved)</th>
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
                                                    <div className="flex flex-wrap gap-1">
                                                        {v.mata_kuliah_list.map((mk) => (
                                                            <span key={mk.id} className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-100" title={mk.nama_mk}>
                                                                {mk.kode_mk}
                                                            </span>
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
        </AuthenticatedLayout>
    );
}
