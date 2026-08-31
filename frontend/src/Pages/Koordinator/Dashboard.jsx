import React, { useMemo, useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    FileText, CheckCircle2, AlertTriangle, Eye, FilePlus2,
    LayoutDashboard, ArrowRight, ArrowUpRight, BookOpen, Upload, Search, ChevronLeft, ChevronRight,
    Users, Target, Activity as ActivityIcon, CalendarClock, Bell, ShieldCheck, Calendar,
    Clock, XCircle, Sparkles, Check, FileCheck, Layers, FileSpreadsheet
} from 'lucide-react';
import NotificationDropdown from '@/Components/NotificationDropdown';

const STATUS_CONFIG = {
    BELUM_UPLOAD: { label: 'Belum Upload', color: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
    IN_REVIEW:    { label: 'In Review',    color: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
    SUBMITTED:    { label: 'In Review',    color: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
    RESUBMITTED:  { label: 'In Review',    color: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
    DRAFT:        { label: 'In Review',    color: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
    REVISION:     { label: 'Revisi',       color: 'bg-amber-50 text-amber-700 border-amber-200',   dot: 'bg-amber-500' },
    APPROVED:     { label: 'Disetujui',    color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    REJECTED:     { label: 'Ditolak',      color: 'bg-red-50 text-red-700 border-red-200',         dot: 'bg-red-500' },
};

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.BELUM_UPLOAD;
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

function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

function relativeTime(dateStr) {
    if (!dateStr) return '-';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Baru saja';
    if (mins < 60) return `${mins} mnt lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    return `${days} hari lalu`;
}

const PER_PAGE = 6;

export default function KoordinatorDashboard({ activePeriod, deadline, stats, mataKuliahList = [], attention = [], verifikators = [], cloPloOverview = [], activity = [] }) {
    const { auth, notifications } = usePage().props;
    const notifCount = notifications?.count || 0;
    const userName = auth?.user?.name || 'Koordinator';
    const kodeDosen = auth?.user?.dosen?.kode_dosen;

    const [search, setSearch] = useState('');
    const [semesterFilter, setSemesterFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);

    const semesterOptions = useMemo(
        () => [...new Set(mataKuliahList.map(mk => mk.semester).filter(Boolean))].sort((a, b) => a - b),
        [mataKuliahList]
    );

    const filteredMk = useMemo(() => {
        return mataKuliahList.filter(mk => {
            const matchesSearch = !search
                || mk.kode_mk?.toLowerCase().includes(search.toLowerCase())
                || mk.nama_mk?.toLowerCase().includes(search.toLowerCase());
            const matchesSemester = !semesterFilter || String(mk.semester) === String(semesterFilter);
            const matchesStatus = !statusFilter || mk.status === statusFilter;
            return matchesSearch && matchesSemester && matchesStatus;
        });
    }, [mataKuliahList, search, semesterFilter, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredMk.length / PER_PAGE));
    const pagedMk = filteredMk.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    return (
        <AuthenticatedLayout title="Dashboard Koordinator">
            <Head title="Dashboard Koordinator - Sistem Verifikasi Soal" />

            <div className="space-y-6">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                            Dashboard Koordinator
                        </h1>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">
                            Kelola naskah soal ujian dan pemetaan CPL-CPMK mata kuliah yang Anda ampu
                        </p>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        {/* Dual Role Switcher */}
                        {auth?.user?.has_dual_role && (
                            <div className="flex items-center p-1 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
                                <Link
                                    href="/koordinator/dashboard"
                                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-[#801720] text-white shadow-xs cursor-pointer"
                                >
                                    <BookOpen className="w-3.5 h-3.5" />
                                    <span>Koordinator MK</span>
                                </Link>
                                <Link
                                    href="/verifikator/dashboard"
                                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
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
                <div className="relative overflow-hidden bg-gradient-to-r from-[#801720] via-[#941A25] to-[#6E121A] text-white rounded-3xl p-6 lg:p-8 shadow-xl shadow-[#801720]/15">
                    <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 pointer-events-none flex items-center justify-end pr-8">
                        <img src="/images/logo-telkom.png" alt="Telkom University" className="w-48 h-48 object-contain filter brightness-0 invert" />
                    </div>

                    <div className="relative z-10 max-w-3xl space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white/90 text-xs font-bold">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                            <span>Dosen Koordinator Mata Kuliah</span>
                        </div>

                        <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight">
                            Selamat Datang, {userName} 👋
                        </h2>

                        <p className="text-white/80 text-xs sm:text-sm leading-relaxed font-normal">
                            Kelola penyusunan soal ujian, petakan CPMK (CLO) ke CPL (PLO), serta unggah naskah soal untuk diverifikasi oleh Dosen Verifikator guna menjamin mutu soal ujian.
                        </p>

                        <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-medium text-white/90">
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

                            {deadline && (
                                <div className="flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/5">
                                    <Calendar className="w-4 h-4 text-amber-300" />
                                    <span>Deadline Upload: <strong className="text-white font-bold">{formatDate(deadline.deadline)}</strong> ({deadline.sisa_hari} hari lagi)</span>
                                </div>
                            )}

                            <div className="flex items-center gap-1.5 bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/5 font-semibold text-white/90">
                                <BookOpen className="w-3.5 h-3.5 text-rose-200" />
                                <span>{stats.total_mk || 0} Mata Kuliah Ditugaskan</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Cards (6 Cards Grid - Status & Progress Only) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    <StatCard label="Mata Kuliah Saya" value={stats.total_mk || 0}     icon={BookOpen}      color="bg-slate-700" />
                    <StatCard label="Belum Diupload"   value={stats.belum_upload || 0} icon={FilePlus2}     color="bg-slate-500" />
                    <StatCard label="In Review"        value={stats.in_review || 0}    icon={Clock}         color="bg-purple-600" />
                    <StatCard label="Perlu Revisi"     value={stats.revisi || 0}       icon={AlertTriangle} color="bg-amber-500" />
                    <StatCard label="Disetujui"        value={stats.approved || 0}     icon={CheckCircle2}  color="bg-emerald-600" />
                    <StatCard label="Ditolak"          value={stats.rejected || 0}     icon={XCircle}       color="bg-red-500" />
                </div>

                {/* Mata Kuliah Saya (Primary Card / Workspace) */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-5">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-100">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-[#801720]" /> Mata Kuliah Saya
                            </h2>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                Daftar mata kuliah yang ditugaskan pada periode aktif untuk penyusunan dan pengunggahan naskah soal
                            </p>
                        </div>

                        {/* Search & Filters */}
                        <div className="flex flex-wrap items-center gap-2.5">
                            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    value={search}
                                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                                    placeholder="Cari kode / nama MK..."
                                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#801720]/20 placeholder-slate-400"
                                />
                            </div>
                            <select
                                value={semesterFilter}
                                onChange={e => { setSemesterFilter(e.target.value); setPage(1); }}
                                className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#801720]/20 bg-white text-slate-700 font-medium"
                            >
                                <option value="">Semua Semester</option>
                                {semesterOptions.map(s => <option key={s} value={s}>Semester {s}</option>)}
                            </select>
                            <select
                                value={statusFilter}
                                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                                className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#801720]/20 bg-white text-slate-700 font-medium"
                            >
                                <option value="">Semua Status</option>
                                <option value="BELUM_UPLOAD">Belum Upload</option>
                                <option value="IN_REVIEW">In Review</option>
                                <option value="REVISION">Perlu Revisi</option>
                                <option value="APPROVED">Disetujui</option>
                                <option value="REJECTED">Ditolak</option>
                            </select>
                        </div>
                    </div>

                    {mataKuliahList.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <h3 className="font-bold text-slate-800 text-sm">Belum Ada Mata Kuliah</h3>
                            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                Anda belum memiliki mata kuliah yang ditugaskan pada periode verifikasi yang aktif.
                            </p>
                        </div>
                    ) : filteredMk.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                            <Search className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <h3 className="font-bold text-slate-800 text-sm">Mata Kuliah Tidak Ditemukan</h3>
                            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                Tidak ada mata kuliah yang cocok dengan kata kunci atau filter pencarian Anda.
                            </p>
                            <button
                                type="button"
                                onClick={() => { setSearch(''); setSemesterFilter(''); setStatusFilter(''); setPage(1); }}
                                className="mt-3 text-xs font-bold text-[#801720] hover:underline"
                            >
                                Reset Filter
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
                                {pagedMk.map(mk => (
                                    <div
                                        key={mk.id}
                                        className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs hover:border-[#801720]/40 hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
                                    >
                                        <div className="space-y-3">
                                            {/* Card Top Meta */}
                                            <div className="flex items-start justify-between gap-2.5">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold text-[10px] rounded-md border border-slate-200">
                                                        {mk.kode_mk}
                                                    </span>
                                                    <span className="px-2 py-0.5 bg-slate-50 text-slate-500 font-semibold text-[10px] rounded-md border border-slate-150">
                                                        Sem {mk.semester}
                                                    </span>
                                                    <span className="px-2 py-0.5 bg-slate-50 text-slate-500 font-semibold text-[10px] rounded-md border border-slate-150">
                                                        {mk.sks} SKS
                                                    </span>
                                                </div>
                                                <StatusBadge status={mk.status} />
                                            </div>

                                            {/* MK Title */}
                                            <div>
                                                <h3 className="text-base font-bold text-slate-800 group-hover:text-[#801720] transition-colors leading-snug line-clamp-2" title={mk.nama_mk}>
                                                    {mk.nama_mk}
                                                </h3>
                                            </div>

                                            {/* Soal Stats Count */}
                                            <div className="flex items-center gap-2 py-1.5 px-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                                                <FileText className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                                <span className="text-slate-700 font-bold">{mk.total_soal} Soal Terunggah</span>
                                                {mk.approved > 0 && (
                                                    <span className="ml-auto text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                                        {mk.approved} Disetujui
                                                    </span>
                                                )}
                                                {mk.revision > 0 && (
                                                    <span className="ml-auto text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                                                        {mk.revision} Revisi
                                                    </span>
                                                )}
                                            </div>

                                            {/* Mapping PLO & CLO Chips */}
                                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                                                <div>
                                                    <p className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">CPL (PLO)</p>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {mk.plo && mk.plo.length > 0 ? (
                                                            mk.plo.map((p) => (
                                                                <span key={p.id || p.kode_plo} className="px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-[9px] border border-purple-100" title={p.deskripsi}>
                                                                    {p.kode_plo}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-slate-300 text-xs">-</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">CPMK (CLO)</p>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {mk.clo && mk.clo.length > 0 ? (
                                                            mk.clo.map((c) => (
                                                                <span key={c.id || c.kode_clo} className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[9px] border border-emerald-100" title={c.deskripsi}>
                                                                    {c.kode_clo}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-slate-300 text-xs">-</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                                            <Link
                                                href={`/koordinator/mata-kuliah/${mk.id}`}
                                                className="py-2 px-3 rounded-xl bg-[#801720] text-white text-xs font-bold hover:bg-[#9B1B26] transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                                            >
                                                <Upload className="w-3.5 h-3.5" />
                                                <span>Upload Soal</span>
                                            </Link>
                                            <Link
                                                href={`/koordinator/mata-kuliah/${mk.id}`}
                                                className="py-2 px-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                <span>Detail MK</span>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
                                    <span>Halaman {page} dari {totalPages} ({filteredMk.length} mata kuliah)</span>
                                    <div className="flex gap-1">
                                        <button
                                            disabled={page === 1}
                                            onClick={() => setPage(p => p - 1)}
                                            className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
                                        >
                                            <ChevronLeft className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            disabled={page === totalPages}
                                            onClick={() => setPage(p => p + 1)}
                                            className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
                                        >
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Aktivitas Terbaru (Full Width) */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <ActivityIcon className="w-5 h-5 text-[#801720]" /> Aktivitas Terbaru
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
                                    <div className="w-2 h-2 rounded-full bg-[#801720] mt-1.5 flex-shrink-0" />
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
