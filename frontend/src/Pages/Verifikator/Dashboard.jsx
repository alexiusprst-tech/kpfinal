import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    LayoutDashboard, FileCheck, AlertTriangle, CheckCircle2,
    XCircle, Clock, ArrowRight, ArrowUpRight, BookOpen, ShieldCheck, RefreshCw,
    TrendingUp, FileText, Search, User, Filter, Check, Printer, Bell,
    FilePlus2
} from 'lucide-react';
import NotificationDropdown from '@/Components/NotificationDropdown';

const STATUS_CONFIG = {
    BELUM_UPLOAD: { label: 'Belum Upload', color: 'bg-slate-100 text-slate-700 border border-slate-200', dot: 'bg-slate-400' },
    IN_REVIEW:    { label: 'In Review',    color: 'bg-purple-50 text-purple-700 border border-purple-200', dot: 'bg-purple-500' },
    SUBMITTED:    { label: 'In Review',    color: 'bg-purple-50 text-purple-700 border border-purple-200', dot: 'bg-purple-500' },
    RESUBMITTED:  { label: 'In Review',    color: 'bg-purple-50 text-purple-700 border border-purple-200', dot: 'bg-purple-500' },
    DRAFT:        { label: 'In Review',    color: 'bg-purple-50 text-purple-700 border border-purple-200', dot: 'bg-purple-500' },
    REVISION:     { label: 'Revisi',       color: 'bg-amber-50 text-amber-700 border border-amber-200',   dot: 'bg-amber-500' },
    APPROVED:     { label: 'Disetujui',    color: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500' },
    REJECTED:     { label: 'Ditolak',      color: 'bg-red-50 text-red-700 border border-red-200',         dot: 'bg-red-500' },
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

function StatCard({ label, value, icon: Icon, color, href }) {
    const cardContent = (
        <div className={`bg-white border border-gray-100 shadow-sm rounded-2xl p-4 flex flex-col gap-3 transition-all duration-200 ${
            href ? 'hover:shadow-md hover:border-gray-200 hover:-translate-y-0.5 group cursor-pointer' : ''
        }`}>
            <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center flex-shrink-0 transition-transform duration-200 ${href ? 'group-hover:scale-105' : ''} shadow-xs`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
                {href && (
                    <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#801720]/10 group-hover:text-[#801720] transition-colors">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                )}
            </div>
            <div className="min-w-0">
                <p className="text-2xl font-extrabold text-gray-800 leading-tight tracking-tight">{value}</p>
                <p className={`text-xs text-gray-500 font-medium leading-snug truncate ${href ? 'group-hover:text-gray-900' : ''} transition-colors`}>{label}</p>
            </div>
        </div>
    );

    if (href) {
        return (
            <Link href={href} className="block focus:outline-none focus:ring-2 focus:ring-[#801720]/20 rounded-2xl">
                {cardContent}
            </Link>
        );
    }

    return cardContent;
}

export default function VerifikatorDashboard({ auth, activePeriod, stats, pendingSoal = [], assignments = [], recentVerifikasis = [] }) {
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
        const matchesMk     = selectedMk === 'ALL' || soal.mata_kuliah_id === selectedMk;
        return matchesSearch && matchesMk;
    });

    const formatDate = (d) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <AuthenticatedLayout title="Dashboard Dosen Verifikator">
            <Head title="Dashboard Dosen Verifikator - Sistem Verifikasi Soal" />

            <div className="space-y-6">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Dashboard Overview</h1>
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
                                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-[#801720] text-white shadow-xs cursor-pointer"
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
                <div className="relative overflow-hidden bg-gradient-to-r from-[#801720] via-[#9B1B26] to-[#B82332] text-white rounded-3xl p-6 lg:p-8 shadow-xl shadow-[#801720]/15">
                    <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 pointer-events-none flex items-center justify-end pr-8">
                        <img src="/images/logo-telkom.png" alt="Telkom University" className="w-48 h-48 object-contain filter brightness-0 invert" />
                    </div>

                    <div className="relative z-10 max-w-3xl space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white/90 text-xs font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                            <span>Dosen Verifikator Soal</span>
                        </div>

                        <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white">
                            Selamat Datang, {userName} 👋
                        </h1>

                        <p className="text-white/80 text-sm leading-relaxed font-normal">
                            Pantau antrean verifikasi soal ujian, tinjau kesesuaian dokumen, dan berikan keputusan verifikasi untuk memastikan kualitas soal akademik Telkom University.
                        </p>

                        <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-white/90">
                            {activePeriod ? (
                                <div className="flex items-center gap-2 bg-black/20 px-3.5 py-1.5 rounded-xl border border-white/10">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    <span>Periode Aktif: <strong className="text-white font-bold">{activePeriod.nama}</strong></span>
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    <StatCard label="Mata Kuliah Diawasi" value={assignments.length}   icon={BookOpen}      color="bg-slate-700" />
                    <StatCard label="Belum Diupload"     value={belumUploadCount}    icon={FilePlus2}     color="bg-gray-500" />
                    <StatCard label="In Review"          value={stats?.pending || 0} icon={Clock}         color="bg-purple-600" />
                    <StatCard label="Perlu Revisi"       value={stats?.revision || 0} icon={AlertTriangle} color="bg-amber-500" />
                    <StatCard label="Disetujui"          value={stats?.approved || 0} icon={CheckCircle2}  color="bg-emerald-600" />
                    <StatCard label="Ditolak"            value={stats?.rejected || 0} icon={XCircle}       color="bg-red-500" />
                </div>

                {/* Main Content Grid: Antrean Soal (Left 8) & Mata Kuliah yang Diawasi (Right 4) */}
                <div className="grid lg:grid-cols-12 gap-6 items-start">
                    {/* Antrean Soal Menunggu Verifikasi (Left 8) */}
                    <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-gray-100">
                            <div>
                                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                                    <FileCheck className="w-5 h-5 text-[#801720]" /> Antrean Soal Menunggu Verifikasi
                                </h2>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">
                                    Tinjau dokumen dan berikan persetujuan atau catatan revisi
                                </p>
                            </div>
                            <Link
                                href="/verifikator/soal"
                                className="inline-flex items-center gap-1 text-xs font-bold text-[#801720] hover:text-[#6a1219] hover:underline"
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
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#801720]/20"
                                />
                            </div>
                            {assignments.length > 0 && (
                                <select
                                    value={selectedMk}
                                    onChange={(e) => setSelectedMk(e.target.value)}
                                    className="text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#801720]/20"
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
                            <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-gray-200">
                                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                                <h3 className="font-bold text-gray-800 text-sm">Tidak Ada Antrean Soal</h3>
                                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                                    {searchTerm || selectedMk !== 'ALL'
                                        ? 'Tidak ditemukan soal yang sesuai dengan kata kunci atau filter pencarian Anda.'
                                        : 'Semua soal yang dikirimkan oleh Koordinator MK sudah diverifikasi.'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {filteredPending.map(soal => (
                                    <div
                                        key={soal.id}
                                        className="p-3.5 rounded-2xl border border-gray-100 bg-slate-50/60 hover:bg-white hover:border-[#801720]/30 hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                                    >
                                        <div className="flex items-start gap-3 min-w-0">
                                            <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-bold text-gray-800 text-xs group-hover:text-[#801720] transition-colors truncate">
                                                        {soal.judul}
                                                    </h3>
                                                    <StatusBadge status={soal.status} />
                                                </div>

                                                <p className="text-[10px] text-gray-400 font-medium mt-1 flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold text-gray-600">{soal.mata_kuliah?.nama_mk}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-3 h-3 text-gray-400" />
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
                                                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#801720] text-white rounded-xl text-xs font-bold hover:bg-[#9B1B26] transition-all shadow-xs"
                                            >
                                                <span>Review & Verifikasi</span>
                                                <ArrowRight className="w-3.5 h-3.5" />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Mata Kuliah yang Diawasi (Right 4) */}
                    <div className="lg:col-span-4 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-[#801720]" /> Mata Kuliah Diawasi
                                </h2>
                                <span className="text-xs font-semibold text-slate-500">
                                    {assignments.length} MK
                                </span>
                            </div>

                            {assignments.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-10">Belum ada mata kuliah yang ditugaskan.</p>
                            ) : (
                                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                                    {assignments.map(a => {
                                        const isComplete = a.total > 0 && a.pending === 0;
                                        return (
                                            <div key={a.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/60 transition-colors flex items-center justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-bold text-gray-800 truncate">{a.mata_kuliah?.nama_mk}</p>
                                                    <p className="text-[10px] text-gray-400 mt-0.5">{a.mata_kuliah?.kode_mk} · {a.mata_kuliah?.sks || 3} SKS · <span className="font-semibold text-slate-600">{a.total} Soal</span></p>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    {a.total === 0 ? (
                                                        <StatusBadge status="BELUM_UPLOAD" />
                                                    ) : isComplete ? (
                                                        <a
                                                            href={`/verifikator/mata-kuliah/${a.mata_kuliah_id}/berita-acara`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#801720] text-white rounded-xl text-[10px] font-bold hover:bg-[#6a1219] transition-all shadow-xs"
                                                            title="Cetak Berita Acara"
                                                        >
                                                            <Printer className="w-3 h-3" /> Berita Acara
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
                            <p className="text-[11px] font-semibold text-slate-400">
                                Total {assignments.length} mata kuliah dalam pengawasan verifikator
                            </p>
                        </div>
                    </div>
                </div>

                {/* Timeline Riwayat Keputusan Verifikasi */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
                    <div className="pb-2 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-[#801720]" /> Riwayat Verifikasi Saya
                            </h2>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                                Keputusan verifikasi terbaru yang Anda berikan pada sistem
                            </p>
                        </div>
                        <span className="text-xs font-semibold text-slate-500">
                            {recentVerifikasis.length} Catatan
                        </span>
                    </div>

                    {recentVerifikasis.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                            <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-xs font-semibold">Belum Ada Keputusan</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">Riwayat verifikasi Anda akan muncul di sini.</p>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {recentVerifikasis.map(v => {
                                const actionConfig = {
                                    APPROVED: { label: 'Disetujui', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
                                    REVISION: { label: 'Perlu Revisi', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: RefreshCw },
                                    REJECTED: { label: 'Ditolak', color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
                                }[v.action] || { label: v.action, color: 'bg-slate-100 text-slate-800 border-slate-300', icon: Check };

                                const Icon = actionConfig.icon;

                                return (
                                    <div key={v.id} className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:bg-slate-100/60 transition-all text-xs space-y-2 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between gap-2">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${actionConfig.color} inline-flex items-center gap-1`}>
                                                    <Icon className="w-3 h-3" /> {actionConfig.label}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-semibold">{formatDate(v.created_at)}</span>
                                            </div>

                                            <p className="font-bold text-gray-800 truncate mt-2">
                                                {v.soal?.judul || 'Soal Ujian'}
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-medium">
                                                {v.soal?.mata_kuliah?.nama_mk}
                                            </p>
                                        </div>

                                        {v.catatan && (
                                            <p className="text-[10px] text-gray-600 italic bg-white p-2 rounded-xl border border-gray-200/80 line-clamp-2 mt-1">
                                                "{v.catatan}"
                                            </p>
                                        )}
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
