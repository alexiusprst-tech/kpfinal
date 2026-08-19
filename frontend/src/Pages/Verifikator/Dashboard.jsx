import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    LayoutDashboard, FileCheck, AlertTriangle, CheckCircle2,
    XCircle, Clock, ArrowRight, BookOpen, ShieldCheck, RefreshCw,
    TrendingUp, FileText, Search, User, Filter, Check, Printer, Bell
} from 'lucide-react';

const STATUS_CONFIG = {
    DRAFT:       { label: 'Draft',         color: 'bg-slate-100 text-slate-600 border-slate-200',      dot: 'bg-slate-400' },
    SUBMITTED:   { label: 'Disubmit',      color: 'bg-blue-50 text-blue-700 border-blue-200',        dot: 'bg-blue-500' },
    IN_REVIEW:   { label: 'Sedang Review', color: 'bg-purple-50 text-purple-700 border-purple-200',  dot: 'bg-purple-500' },
    RESUBMITTED: { label: 'Revisi Submit', color: 'bg-indigo-50 text-indigo-700 border-indigo-200',  dot: 'bg-indigo-500' },
    APPROVED:    { label: 'Disetujui',     color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    REVISION:    { label: 'Perlu Revisi',  color: 'bg-amber-50 text-amber-700 border-amber-200',    dot: 'bg-amber-500' },
    REJECTED:    { label: 'Ditolak',       color: 'bg-red-50 text-red-700 border-red-200',          dot: 'bg-red-500' },
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

function StatCard({ label, value, icon: Icon, colorClass, borderClass, subtext }) {
    return (
        <div className={`bg-white rounded-2xl border ${borderClass || 'border-slate-100'} p-5 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between`}>
            <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500 tracking-wide uppercase">{label}</p>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
            </div>
            <div className="mt-3">
                <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
                {subtext && <p className="text-[11px] font-semibold text-slate-400 mt-1">{subtext}</p>}
            </div>
        </div>
    );
}

export default function VerifikatorDashboard({ activePeriod, stats, pendingSoal = [], assignments = [], recentVerifikasis = [] }) {
    const { notifications } = usePage().props;
    const notifCount = notifications?.count || 0;
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMk, setSelectedMk] = useState('ALL');

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
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Dashboard Overview</h1>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">Sistem verifikasi soal oleh dosen verifikator</p>
                    </div>
                    <button 
                        onClick={() => window.dispatchEvent(new CustomEvent('open-notifications'))}
                        className="relative p-2.5 bg-white rounded-xl border border-gray-200 shadow-xs hover:bg-slate-50 transition-colors text-slate-700 cursor-pointer"
                        title="Notifikasi"
                    >
                        <Bell className="w-5 h-5 text-slate-700" />
                        {notifCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white animate-pulse">
                                {notifCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Banner Hero */}
                <div className="relative overflow-hidden bg-gradient-to-r from-[#801720] via-[#9B1B26] to-[#B82332] text-white rounded-3xl p-6 lg:p-8 shadow-xl shadow-[#801720]/15">
                    <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-end pr-8">
                        <ShieldCheck className="w-64 h-64 text-white" />
                    </div>

                    <div className="relative z-10 max-w-3xl space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white/90 text-xs font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                            <span>Dosen Verifikator Soal</span>
                        </div>

                        <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white">
                            Selamat Datang, Bapak/Ibu Verifikator 👋
                        </h1>

                        <p className="text-white/80 text-sm leading-relaxed font-normal">
                            Pantau antrean verifikasi soal ujian, tinjau kesesuaian dokumen, dan berikan keputusan verifikasi untuk memastikan kualitas soal akademik Telkom University.
                        </p>

                        <div className="pt-1 flex flex-wrap gap-2">
                            <Link
                                href="/verifikator/berita-acara"
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-[#801720] hover:bg-slate-50 text-xs font-extrabold rounded-2xl shadow-lg shadow-black/10 transition-all hover:scale-[1.02] cursor-pointer"
                            >
                                <FileText className="w-4 h-4 text-[#801720]" />
                                <span>Kelola Berita Acara</span>
                            </Link>
                        </div>

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

                            {stats?.pending > 0 ? (
                                <div className="flex items-center gap-2 bg-amber-400/20 text-amber-100 px-3.5 py-1.5 rounded-xl border border-amber-300/30 font-bold">
                                    <Clock className="w-4 h-4 text-amber-300" />
                                    <span>Ada {stats.pending} soal menunggu keputusan Anda!</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 bg-emerald-400/20 text-emerald-100 px-3.5 py-1.5 rounded-xl border border-emerald-300/30 font-bold">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                                    <span>Semua soal yang diawasi telah selesai diverifikasi 🎉</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Progress Bar & Stat Cards */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
                        <div>
                            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-[#801720]" /> Status Progres Verifikasi Soal
                            </h2>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                Ringkasan statistik verifikasi soal pada periode verifikasi aktif
                            </p>
                        </div>

                        {/* Completion Rate Indicator */}
                        <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200/80">
                            <div className="text-left sm:text-right">
                                <p className="text-[10px] uppercase font-extrabold text-slate-400">Penyelesaian</p>
                                <p className="text-sm font-black text-[#801720]">{stats?.completionRate || 0}% Selesai</p>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar Visual */}
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex shadow-inner">
                        <div
                            style={{ width: `${stats?.total > 0 ? (stats.approved / stats.total) * 100 : 0}%` }}
                            className="bg-emerald-500 h-full transition-all duration-500"
                            title={`Disetujui: ${stats?.approved || 0}`}
                        />
                        <div
                            style={{ width: `${stats?.total > 0 ? (stats.revision / stats.total) * 100 : 0}%` }}
                            className="bg-amber-400 h-full transition-all duration-500"
                            title={`Perlu Revisi: ${stats?.revision || 0}`}
                        />
                        <div
                            style={{ width: `${stats?.total > 0 ? (stats.rejected / stats.total) * 100 : 0}%` }}
                            className="bg-red-500 h-full transition-all duration-500"
                            title={`Ditolak: ${stats?.rejected || 0}`}
                        />
                        <div
                            style={{ width: `${stats?.total > 0 ? (stats.pending / stats.total) * 100 : 0}%` }}
                            className="bg-blue-400 h-full transition-all duration-500"
                            title={`Menunggu Review: ${stats?.pending || 0}`}
                        />
                    </div>

                    {/* Stat Cards Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 pt-2">
                        <StatCard
                            label="Total Soal"
                            value={stats?.total || 0}
                            icon={FileCheck}
                            colorClass="bg-slate-700"
                            subtext="Soal masuk"
                        />
                        <StatCard
                            label="Perlu Review"
                            value={stats?.pending || 0}
                            icon={Clock}
                            colorClass="bg-blue-600"
                            borderClass="border-blue-200"
                            subtext="Menunggu verifikasi"
                        />
                        <StatCard
                            label="Disetujui"
                            value={stats?.approved || 0}
                            icon={CheckCircle2}
                            colorClass="bg-emerald-600"
                            borderClass="border-emerald-200"
                            subtext="Soal approved"
                        />
                        <StatCard
                            label="Perlu Revisi"
                            value={stats?.revision || 0}
                            icon={RefreshCw}
                            colorClass="bg-amber-500"
                            borderClass="border-amber-200"
                            subtext="Dikembalikan ke dosen"
                        />
                        <StatCard
                            label="Ditolak"
                            value={stats?.rejected || 0}
                            icon={XCircle}
                            colorClass="bg-red-600"
                            borderClass="border-red-200"
                            subtext="Tidak memenuhi kriteria"
                        />
                    </div>
                </div>

                {/* Course Breakdown Cards (MK yang Diawasi) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-[#801720]" /> Mata Kuliah yang Diawasi
                        </h2>
                        <span className="text-xs font-semibold text-slate-500">
                            {assignments.length} Mata Kuliah Ditugaskan
                        </span>
                    </div>

                    {assignments.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center">
                            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm font-bold text-slate-700">Belum Ada Penugasan Mata Kuliah</p>
                            <p className="text-xs text-slate-400 mt-1">Anda belum ditugaskan sebagai Verifikator untuk Mata Kuliah mana pun pada periode ini.</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {assignments.map(a => (
                                <div key={a.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 hover:border-[#801720]/40 transition-all duration-200">
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-[#801720]/10 text-[#801720] flex items-center justify-center font-black text-xs flex-shrink-0 border border-[#801720]/20">
                                                <BookOpen className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-extrabold text-slate-900 text-sm leading-tight">{a.mata_kuliah?.nama_mk}</h3>
                                                <p className="text-xs font-bold text-[#801720] mt-0.5">{a.mata_kuliah?.kode_mk} · {a.mata_kuliah?.sks || 3} SKS</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
                                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Total</p>
                                            <p className="text-sm font-black text-slate-800">{a.total}</p>
                                        </div>
                                        <div className="bg-blue-50/80 p-2 rounded-xl border border-blue-100">
                                            <p className="text-[10px] font-bold text-blue-600 uppercase">Pending</p>
                                            <p className="text-sm font-black text-blue-700">{a.pending}</p>
                                        </div>
                                        <div className="bg-emerald-50/80 p-2 rounded-xl border border-emerald-100">
                                            <p className="text-[10px] font-bold text-emerald-600 uppercase">Disetujui</p>
                                            <p className="text-sm font-black text-emerald-700">{a.approved}</p>
                                        </div>
                                    </div>

                                    {a.total > 0 && a.pending === 0 && (
                                        <a
                                            href={`/verifikator/mata-kuliah/${a.mata_kuliah_id}/berita-acara`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#801720] text-white rounded-xl text-xs font-bold hover:bg-[#6a1219] transition-all"
                                        >
                                            <Printer className="w-3.5 h-3.5" /> Cetak Berita Acara
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Main Content Grid: Pending Queue & Activity Log */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Antrean Soal Menunggu Verifikasi */}
                    <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-5">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                                    <FileCheck className="w-5 h-5 text-[#801720]" /> Antrean Soal Menunggu Verifikasi
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Tinjau dokumen dan berikan persetujuan atau catatan revisi
                                </p>
                            </div>
                            <Link
                                href="/verifikator/soal"
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#801720] hover:text-[#6a1219] hover:underline"
                            >
                                <span>Lihat Seluruh Soal</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        {/* Search & Quick Filter */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-1">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                                <input
                                    type="text"
                                    placeholder="Cari judul soal atau nama dosen..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] transition-all"
                                />
                            </div>
                            {assignments.length > 0 && (
                                <select
                                    value={selectedMk}
                                    onChange={(e) => setSelectedMk(e.target.value)}
                                    className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720]"
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
                            <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                                <h3 className="font-extrabold text-slate-800 text-sm">Tidak Ada Antrean Soal</h3>
                                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                    {searchTerm || selectedMk !== 'ALL'
                                        ? 'Tidak ditemukan soal yang sesuai dengan kata kunci atau filter pencarian Anda.'
                                        : 'Semua soal yang dikirimkan oleh Koordinator MK sudah diverifikasi.'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredPending.map(soal => (
                                    <div
                                        key={soal.id}
                                        className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-[#801720]/30 hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                                    >
                                        <div className="flex items-start gap-3.5 min-w-0">
                                            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-[#801720] transition-colors truncate">
                                                        {soal.judul}
                                                    </h3>
                                                    <StatusBadge status={soal.status} />
                                                </div>

                                                <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold text-slate-700">{soal.mata_kuliah?.nama_mk}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-3.5 h-3.5 text-slate-400" />
                                                        {soal.uploaded_by?.name || 'Dosen Koordinator'}
                                                    </span>
                                                    {soal.kategori?.nama && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-bold">
                                                                {soal.kategori.nama}
                                                            </span>
                                                        </>
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200/60">
                                            <Link
                                                href={`/verifikator/soal/${soal.id}`}
                                                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#801720] text-white rounded-xl text-xs font-bold hover:bg-[#6a1219] transition-all shadow-xs"
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

                    {/* Timeline Riwayat Keputusan Verifikasi */}
                    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-5">
                        <div>
                            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-[#801720]" /> Riwayat Verifikasi Saya
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Keputusan verifikasi terbaru yang Anda berikan
                            </p>
                        </div>

                        {recentVerifikasis.length === 0 ? (
                            <div className="text-center py-10 text-slate-400">
                                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p className="text-xs font-semibold">Belum Ada Keputusan</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">Riwayat verifikasi Anda akan muncul di sini.</p>
                            </div>
                        ) : (
                            <div className="space-y-3 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-100">
                                {recentVerifikasis.map(v => {
                                    const actionConfig = {
                                        APPROVED: { label: 'Disetujui', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle2 },
                                        REVISION: { label: 'Perlu Revisi', color: 'bg-amber-100 text-amber-800 border-amber-300', icon: RefreshCw },
                                        REJECTED: { label: 'Ditolak', color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle },
                                    }[v.action] || { label: v.action, color: 'bg-slate-100 text-slate-800 border-slate-300', icon: Check };

                                    const Icon = actionConfig.icon;

                                    return (
                                        <div key={v.id} className="relative pl-7 group">
                                            <div className="absolute left-1.5 top-1.5 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-[#801720] flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#801720]" />
                                            </div>

                                            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 transition-all text-xs space-y-1.5">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${actionConfig.color} inline-flex items-center gap-1`}>
                                                        <Icon className="w-3 h-3" /> {actionConfig.label}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-semibold">{formatDate(v.created_at)}</span>
                                                </div>

                                                <p className="font-bold text-slate-800 truncate">
                                                    {v.soal?.judul || 'Soal Ujian'}
                                                </p>
                                                <p className="text-[11px] text-slate-500 font-medium">
                                                    {v.soal?.mata_kuliah?.nama_mk}
                                                </p>

                                                {v.catatan && (
                                                    <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded-xl border border-slate-200/60 line-clamp-2 mt-1">
                                                        "{v.catatan}"
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
