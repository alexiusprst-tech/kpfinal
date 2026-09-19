import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    FileCheck,
    AlertTriangle,
    CheckCircle2,
    Clock,
    ArrowRight,
    BookOpen,
    ShieldCheck,
    RefreshCw,
    FileText,
    Search,
    User,
    Filter,
    Check,
    Printer,
    FilePlus2,
    Activity as ActivityIcon
} from 'lucide-react';
import NotificationDropdown from '@/Components/NotificationDropdown';
import StatCard from '@/Components/StatCard';
import { relativeTime } from '@/Utils/date';

const STATUS_CONFIG = {
    BELUM_UPLOAD: { label: 'Belum Diunggah', color: 'bg-slate-100 text-slate-700 border border-slate-200', dot: 'bg-slate-400' },
    IN_REVIEW: { label: 'Ditinjau', color: 'bg-purple-50 text-purple-700 border border-purple-200', dot: 'bg-purple-500' },
    SUBMITTED: { label: 'Ditinjau', color: 'bg-purple-50 text-purple-700 border border-purple-200', dot: 'bg-purple-500' },
    RESUBMITTED: { label: 'Revisi Baru', color: 'bg-amber-50 text-amber-700 border border-amber-200', dot: 'bg-amber-500' },
    DRAFT: { label: 'Ditinjau', color: 'bg-purple-50 text-purple-700 border border-purple-200', dot: 'bg-purple-500' },
    REVISION: { label: 'Revisi', color: 'bg-amber-50 text-amber-700 border border-amber-200', dot: 'bg-amber-500' },
    APPROVED: { label: 'Disetujui', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500' },
};

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${cfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

export default function VerifikatorDashboard({ auth, activePeriod, stats, pendingSoal = [], assignments = [], recentVerifikasis = [], activity = [], noAssignmentMessage }) {
    const { notifications, auth: pageAuth } = usePage().props;
    const currentUser = auth?.user || pageAuth?.user;
    const userName = currentUser?.name || 'Bapak/Ibu Verifikator';
    const notifCount = notifications?.count || 0;
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMk, setSelectedMk] = useState('ALL');

    const belumUploadCount = assignments.filter(a => (a.total || 0) === 0).length;

    const filteredPending = pendingSoal.filter(soal => {
        const matchesSearch = soal.judul?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            soal.uploaded_by?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesMk = selectedMk === 'ALL' || soal.mata_kuliah_id === selectedMk;
        return matchesSearch && matchesMk;
    });

    const formatDate = (d) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('id-ID', {
            day: '2-digit', month: 'long', year: 'numeric'
        });
    };

    return (
        <AuthenticatedLayout title="Beranda Dosen Verifikator">
            <Head title="Beranda Dosen Verifikator - Sistem Verifikasi Soal" />
            <div className="space-y-6">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Ringkasan Beranda</h1>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">Sistem verifikasi soal oleh dosen verifikator</p>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        {/* Dual Role Switcher */}
                        {currentUser?.has_dual_role && (
                            <div className="flex items-center p-1 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
                                <Link
                                    href="/koordinator/dashboard"
                                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    <BookOpen className="w-3.5 h-3.5" />
                                    <span>Koordinator MK</span>
                                </Link>
                                <Link
                                    href="/verifikator/dashboard"
                                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-[#9E1B28] text-white shadow-xs cursor-pointer"
                                >
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    <span>Verifikator Soal</span>
                                </Link>
                            </div>
                        )}
                        <NotificationDropdown align="right" />
                    </div>
                </div>

                {/* Banner Hero */}
                <div className="relative overflow-hidden bg-gradient-to-r from-[#9E1B28] via-[#9B1B26] to-[#B82332] text-white rounded-3xl p-6 lg:p-8 shadow-xl shadow-[#9E1B28]/15">
                    <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 pointer-events-none flex items-center justify-end pr-8">
                        <img src="/images/logo-telkom.png" alt="Telkom University" width="192" height="192" className="w-48 h-48 object-contain filter brightness-0 invert" />
                    </div>

                    <div className="relative z-10 max-w-4xl space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white/90 text-xs font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                            <span>Dosen Verifikator Soal</span>
                        </div>

                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
                            Selamat Datang, {userName}
                        </h1>

                        <p className="text-white/80 text-sm leading-relaxed font-normal">
                            Pantau antrean verifikasi soal ujian, tinjau kesesuaian dokumen, dan berikan keputusan verifikasi untuk memastikan kualitas soal akademik Telkom University.
                        </p>

                        <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-white/90">
                            {activePeriod ? (
                                <div className="flex items-center gap-2 bg-black/20 px-3.5 py-1.5 rounded-xl border border-white/10">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    <span>
                                        Periode Aktif: <strong className="text-white font-bold">{activePeriod.nama}</strong>
                                        {activePeriod.tanggal_mulai && activePeriod.tanggal_selesai && (
                                            <span className="ml-1.5 text-white/80 font-normal">({formatDate(activePeriod.tanggal_mulai)} s.d. {formatDate(activePeriod.tanggal_selesai)})</span>
                                        )}
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 bg-amber-500/30 text-amber-200 px-3.5 py-1.5 rounded-xl border border-amber-300/30">
                                    <AlertTriangle className="w-4 h-4 text-amber-300" />
                                    <span>Tidak ada periode verifikasi yang aktif</span>
                                </div>
                            )}

                            {stats?.pending > 0 && (
                                <div className="flex items-center gap-2 bg-amber-400/20 text-amber-100 px-3.5 py-1.5 rounded-xl border border-amber-300/30 font-bold">
                                    <Clock className="w-4 h-4 text-amber-300" />
                                    <span>Ada {stats.pending} soal menunggu keputusan Anda!</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    <StatCard label="Mata Kuliah Verifikator" value={assignments.length} icon={BookOpen} color="bg-blue-600" />
                    <StatCard label="Belum Diunggah" value={belumUploadCount} icon={FilePlus2} color="bg-slate-500" />
                    <StatCard label="Ditinjau" value={stats?.pending || 0} icon={Clock} color="bg-sky-500" />
                    <StatCard label="Perlu Revisi" value={stats?.revision || 0} icon={AlertTriangle} color="bg-amber-500" />
                    <StatCard label="Disetujui" value={stats?.approved || 0} icon={CheckCircle2} color="bg-emerald-600" />
                </div>

                {/* Main Content Grid: Antrean Soal (50%) & Mata Kuliah Verifikator (50%) with equal sizing */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                    {/* Antrean Soal Menunggu Verifikasi */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4 flex flex-col justify-between h-full">
                        <div className="space-y-4 flex-1 flex flex-col">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-gray-100">
                                <div>
                                    <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                                        <FileCheck className="w-5 h-5 text-[#9E1B28]" /> Antrean Soal Menunggu Verifikasi
                                    </h2>
                                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                                        Tinjau dokumen dan berikan persetujuan atau catatan revisi
                                    </p>
                                </div>
                                <Link
                                    href="/verifikator/soal"
                                    className="inline-flex items-center gap-1 text-xs font-bold text-[#9E1B28] hover:text-[#801720] hover:underline flex-shrink-0"
                                >
                                    <span>Lihat Seluruh Soal</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>

                            {/* Search & Quick Filter */}
                            <div className="flex flex-col sm:flex-row gap-2 pt-1">
                                <div className="relative flex-1">
                                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Cari judul soal atau nama dosen..."
                                        aria-label="Cari judul soal atau nama dosen"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9E1B28]/20"
                                    />
                                </div>
                                {assignments.length > 0 && (
                                    <select
                                        value={selectedMk}
                                        onChange={(e) => setSelectedMk(e.target.value)}
                                        aria-label="Filter berdasarkan mata kuliah"
                                        className="text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#9E1B28]/20"
                                    >
                                        <option value="ALL">Semua MK Ditugaskan</option>
                                        {assignments.map(a => (
                                             <option key={a.id} value={a.mata_kuliah_id}>
                                                 {a.mata_kuliah?.nama_mk} ({a.mata_kuliah?.kode_mk})
                                             </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* List Pending Soal */}
                            {filteredPending.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-gray-200">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                                    <h3 className="font-bold text-gray-800 text-sm">Tidak Ada Antrean Soal</h3>
                                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                                        {searchTerm || selectedMk !== 'ALL'
                                            ? 'Tidak ditemukan soal yang sesuai dengan kata kunci atau filter pencarian Anda.'
                                            : 'Semua soal yang dikirimkan oleh Koordinator MK sudah diverifikasi.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                                    {filteredPending.map(soal => {
                                        const isResubmitted = soal.status === 'RESUBMITTED';
                                        const latestRevisi = soal.revisi?.[0];
                                        return (
                                        <div
                                            key={soal.id}
                                            className={`rounded-2xl border transition-all flex flex-col justify-between gap-3 group ${
                                                isResubmitted
                                                    ? 'border-amber-200 bg-amber-50/40 hover:bg-amber-50 hover:border-amber-300 hover:shadow-md'
                                                    : 'border-gray-100 bg-slate-50/60 hover:bg-white hover:border-[#9E1B28]/30 hover:shadow-md'
                                            }`}
                                        >
                                            <div className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                                <div className="flex items-start gap-3 min-w-0">
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                                        isResubmitted ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        <FileText className="w-4 h-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h3 className="font-bold text-gray-800 text-xs group-hover:text-[#9E1B28] transition-colors truncate">
                                                                {soal.judul}
                                                            </h3>
                                                            <StatusBadge status={soal.status} />
                                                        </div>

                                                        <p className="text-[10px] text-gray-500 font-medium mt-1 flex items-center gap-2 flex-wrap">
                                                            <span className="font-bold text-gray-700">{soal.mata_kuliah?.nama_mk}</span>
                                                            <span>•</span>
                                                            <span className="flex items-center gap-1">
                                                                <User className="w-3 h-3 text-gray-500" />
                                                                {soal.uploaded_by?.name || 'Dosen Koordinator'}
                                                            </span>
                                                            {soal.kategori?.nama && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="bg-slate-200/70 text-slate-700 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                                                        {soal.kategori.nama}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100">
                                                    <Link
                                                        href={`/verifikator/soal/${soal.id}`}
                                                        className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                                                            isResubmitted
                                                                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                                                : 'bg-[#9E1B28] hover:bg-[#9B1B26] text-white'
                                                        }`}
                                                    >
                                                        <span>Tinjau</span>
                                                        <ArrowRight className="w-3.5 h-3.5" />
                                                    </Link>
                                                </div>
                                            </div>

                                            {/* Revision info banner for RESUBMITTED */}
                                            {isResubmitted && latestRevisi && (
                                                <div className="mx-3.5 mb-3.5 px-3 py-2 rounded-xl bg-amber-100/70 border border-amber-200 flex items-start gap-2">
                                                    <RefreshCw className="w-3 h-3 text-amber-600 flex-shrink-0 mt-0.5" />
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-bold text-amber-800">Berkas Revisi Baru Diunggah</p>
                                                        <p className="text-[10px] text-amber-700 truncate">
                                                            {latestRevisi.nama_file}
                                                            {latestRevisi.uploaded_at && (
                                                                <span className="text-amber-600 ml-1">· {formatDate(latestRevisi.uploaded_at)}</span>
                                                            )}
                                                        </p>
                                                        {latestRevisi.catatan && (
                                                            <p className="text-[10px] text-amber-800 italic mt-0.5 line-clamp-1">"{latestRevisi.catatan}"</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mata Kuliah Verifikator */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between h-full">
                        <div>
                            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-[#9E1B28]" /> Mata Kuliah Verifikator
                                </h2>
                                <span className="text-xs font-semibold text-slate-500">
                                    {assignments.length} MK
                                </span>
                            </div>

                            {assignments.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-10">Belum ada mata kuliah yang ditugaskan.</p>
                            ) : (
                                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                                    {assignments.map(a => {
                                        const isCompleted = a.total > 0 && a.pending === 0;
                                        return (
                                            <div key={a.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/60 transition-colors flex items-center justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-bold text-gray-800 truncate">{a.mata_kuliah?.nama_mk}</p>
                                                    <p className="text-[10px] text-gray-500 mt-0.5">{a.mata_kuliah?.kode_mk} · {a.mata_kuliah?.sks || 3} SKS · <span className="font-semibold text-slate-600">{a.total} Soal</span></p>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    {a.total === 0 ? (
                                                        <StatusBadge status="BELUM_UPLOAD" />
                                                    ) : isCompleted ? (
                                                        <a
                                                            href={`/verifikator/mata-kuliah/${a.mata_kuliah_id}/berita-acara`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#9E1B28] text-white rounded-xl text-[10px] font-bold hover:bg-[#801720] transition-all shadow-xs"
                                                            title="Cetak Berita Acara"
                                                        >
                                                            <FileCheck className="w-3 h-3" /> Berita Acara
                                                        </a>
                                                    ) : (
                                                        <StatusBadge status="IN_REVIEW" />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="pt-3 border-t border-gray-100 mt-4 text-center">
                            <p className="text-[11px] font-semibold text-slate-500">
                                Total {assignments.length} mata kuliah dalam pengawasan verifikator
                            </p>
                        </div>
                    </div>
                </div>

                {/* Aktivitas Terbaru (Full Width) */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <ActivityIcon className="w-5 h-5 text-[#9E1B28]" /> Aktivitas Terbaru
                            </h2>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                Riwayat aktivitas sistem verifikasi terkini Anda
                            </p>
                        </div>
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-xl">
                            {activity.length} Aktivitas
                        </span>
                    </div>

                    {activity.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">
                            <ActivityIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-xs font-semibold">Belum Ada Aktivitas</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Log aktivitas Anda akan tercatat secara otomatis di sini.</p>
                        </div>
                    ) : (
                        <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                            {activity.map(item => (
                                <div key={item.id} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-100 hover:bg-slate-100/70 transition-colors">
                                    <div className="w-2 h-2 rounded-full bg-[#9E1B28] mt-1.5 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs text-slate-700 leading-snug">{item.description}</p>
                                        <p className="text-[10px] text-slate-400 mt-1 font-semibold">{relativeTime(item.created_at)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
