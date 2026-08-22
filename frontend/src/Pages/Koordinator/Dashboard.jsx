import React, { useMemo, useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    FileText, CheckCircle2, AlertTriangle, Eye, FilePlus2,
    LayoutDashboard, ArrowRight, BookOpen, Upload, Search, ChevronLeft, ChevronRight,
    Users, Target, Activity as ActivityIcon, CalendarClock, Bell, ShieldCheck, Calendar,
} from 'lucide-react';
import NotificationDropdown from '@/Components/NotificationDropdown';

const STATUS_CONFIG = {
    IN_REVIEW:   { label: 'In Review', color: 'bg-purple-100 text-purple-700',   dot: 'bg-purple-500' },
    SUBMITTED:   { label: 'In Review', color: 'bg-purple-100 text-purple-700',   dot: 'bg-purple-500' },
    RESUBMITTED: { label: 'In Review', color: 'bg-purple-100 text-purple-700',   dot: 'bg-purple-500' },
    DRAFT:       { label: 'In Review', color: 'bg-purple-100 text-purple-700',   dot: 'bg-purple-500' },
    REVISION:    { label: 'Revisi',    color: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-400' },
    APPROVED:    { label: 'Disetujui', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
    REJECTED:    { label: 'Ditolak',   color: 'bg-red-100 text-red-600',         dot: 'bg-red-400' },
};

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.IN_REVIEW;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${cfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

function StatCard({ label, value, icon: Icon, color }) {
    return (
        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 flex flex-col gap-3">
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
                <p className="text-2xl font-extrabold text-gray-800 leading-tight">{value}</p>
                <p className="text-xs text-gray-500 font-medium leading-snug">{label}</p>
            </div>
        </div>
    );
}

function ProgressBar({ percent, colorClass = 'bg-emerald-500' }) {
    const p = Math.max(0, Math.min(100, percent));
    return (
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full ${colorClass} rounded-full transition-all`} style={{ width: `${p}%` }} />
        </div>
    );
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
    if (mins < 60) return `${mins} menit lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    return `${days} hari lalu`;
}

const PROGRESS_ROWS = [
    { key: 'approved', label: 'Approved', color: 'bg-emerald-500' },
    { key: 'dalam_review', label: 'In Review', color: 'bg-purple-500' },
    { key: 'revisi', label: 'Revision', color: 'bg-amber-400' },
    { key: 'draft', label: 'Draft', color: 'bg-gray-400' },
    { key: 'menunggu_verifikasi', label: 'Submitted', color: 'bg-blue-500' },
    { key: 'rejected', label: 'Rejected', color: 'bg-red-400' },
];

const PER_PAGE = 5;

export default function KoordinatorDashboard({ activePeriod, deadline, stats, mataKuliahList, attention, verifikators, cloPloOverview, activity }) {
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

    const mkStatus = (mk) => {
        if (mk.total_soal === 0) return 'EMPTY';
        if (mk.progress === 100) return 'DONE';
        return 'ONGOING';
    };

    const filteredMk = useMemo(() => {
        return mataKuliahList.filter(mk => {
            const matchesSearch = !search
                || mk.kode_mk?.toLowerCase().includes(search.toLowerCase())
                || mk.nama_mk?.toLowerCase().includes(search.toLowerCase());
            const matchesSemester = !semesterFilter || String(mk.semester) === String(semesterFilter);
            const matchesStatus = !statusFilter || mkStatus(mk) === statusFilter;
            return matchesSearch && matchesSemester && matchesStatus;
        });
    }, [mataKuliahList, search, semesterFilter, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredMk.length / PER_PAGE));
    const pagedMk = filteredMk.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const approvedPct = stats.total_soal > 0 ? Math.round((stats.approved / stats.total_soal) * 100) : 0;

    return (
        <AuthenticatedLayout title="Dashboard Koordinator">
            <Head title="Dashboard Koordinator" />

            <div className="space-y-6">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Dashboard Overview</h1>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">Sistem penyusunan dan verifikasi soal oleh dosen koordinator</p>
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
                <div className="relative overflow-hidden bg-gradient-to-r from-[#801720] via-[#9B1B26] to-[#B82332] text-white rounded-3xl p-6 lg:p-8 shadow-xl shadow-[#801720]/15">
                    <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 pointer-events-none flex items-center justify-end pr-8">
                        <img src="/images/logo-telkom.png" alt="Telkom University" className="w-48 h-48 object-contain filter brightness-0 invert" />
                    </div>

                    <div className="relative z-10 max-w-3xl space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white/90 text-xs font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                            <span>Dosen Koordinator Mata Kuliah</span>
                        </div>

                        <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white">
                            Selamat Datang, {userName} 👋
                        </h1>

                        <p className="text-white/80 text-sm leading-relaxed font-normal">
                            Kelola penyusunan soal ujian, petakan CPMK (CLO) ke CPL (PLO), serta unggah draf soal untuk diverifikasi oleh Dosen Verifikator guna menjamin mutu soal ujian.
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

                            {deadline && (
                                <div className="flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/5">
                                    <Calendar className="w-4 h-4 text-amber-300" />
                                    <span>Deadline Upload: <strong className="text-white font-bold">{formatDate(deadline.deadline)}</strong> ({deadline.sisa_hari} hari lagi)</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    <StatCard label="Mata Kuliah Saya"      value={stats.total_mk}            icon={BookOpen}      color="bg-slate-600" />
                    <StatCard label="Total Soal"            value={stats.total_soal}          icon={FileText}      color="bg-gray-600" />
                    <StatCard label="Draft"                 value={stats.draft}               icon={FilePlus2}     color="bg-gray-500" />
                    <StatCard label="Menunggu Verifikasi"   value={stats.menunggu_verifikasi} icon={Upload}        color="bg-blue-600" />
                    <StatCard label="Perlu Revisi"          value={stats.revisi}              icon={AlertTriangle} color="bg-amber-500" />
                    <StatCard label="Disetujui"             value={stats.approved}            icon={CheckCircle2}  color="bg-emerald-600" />
                </div>

                {/* Progress Verifikasi */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-bold text-gray-800 flex items-center gap-2">
                            <ActivityIcon className="w-4 h-4 text-[#801720]" /> Progress Verifikasi
                        </h2>
                        <span className="text-sm font-extrabold text-[#801720]">{approvedPct}%</span>
                    </div>
                    <ProgressBar percent={approvedPct} />
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
                        {PROGRESS_ROWS.map(row => (
                            <div key={row.key} className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${row.color} flex-shrink-0`} />
                                <span className="text-xs text-gray-500">{row.label}</span>
                                <span className="text-xs font-bold text-gray-800 ml-auto">{stats[row.key]}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mata Kuliah Saya */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                        <h2 className="font-bold text-gray-800 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-[#801720]" /> Mata Kuliah Saya
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            <div className="relative">
                                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    value={search}
                                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                                    placeholder="Cari kode / nama MK..."
                                    className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#801720]/20 w-48"
                                />
                            </div>
                            <select
                                value={semesterFilter}
                                onChange={e => { setSemesterFilter(e.target.value); setPage(1); }}
                                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#801720]/20"
                            >
                                <option value="">Semua Semester</option>
                                {semesterOptions.map(s => <option key={s} value={s}>Semester {s}</option>)}
                            </select>
                            <select
                                value={statusFilter}
                                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#801720]/20"
                            >
                                <option value="">Semua Status</option>
                                <option value="EMPTY">Belum Ada Soal</option>
                                <option value="ONGOING">Berjalan</option>
                                <option value="DONE">Selesai</option>
                            </select>
                        </div>
                    </div>

                    {mataKuliahList.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-10">Belum ada mata kuliah yang ditugaskan.</p>
                    ) : filteredMk.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-10">Tidak ada mata kuliah yang cocok dengan pencarian/filter.</p>
                    ) : (
                        <>
                            <div className="grid md:grid-cols-2 gap-4">
                                {pagedMk.map(mk => (
                                    <div key={mk.id} className="border border-gray-100 rounded-xl p-4 hover:border-[#801720]/30 transition-colors">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-gray-800 truncate">{mk.nama_mk}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">{mk.kode_mk} · Semester {mk.semester} · {mk.sks} SKS</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 text-xs">
                                            <span className="text-gray-600 font-semibold">{mk.total_soal} Soal</span>
                                            <span className="text-emerald-600 font-semibold">{mk.approved} Approved</span>
                                            {mk.revision > 0 && <span className="text-amber-600 font-semibold">{mk.revision} Revision</span>}
                                            {mk.draft > 0 && <span className="text-gray-500 font-semibold">{mk.draft} Draft</span>}
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-100/60">
                                            <div>
                                                <p className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">Mapping PLO</p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {mk.plo && mk.plo.map((p) => (
                                                        <span key={p.id} className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold text-[9px] border border-purple-100" title={p.deskripsi}>
                                                            {p.kode_plo}
                                                        </span>
                                                    ))}
                                                    {(!mk.plo || mk.plo.length === 0) && <span className="text-gray-400 text-[10px] font-normal">—</span>}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">Mapping CLO</p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {mk.clo && mk.clo.map((c) => (
                                                        <span key={c.id} className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[9px] border border-emerald-100" title={c.deskripsi}>
                                                            {c.kode_clo}
                                                        </span>
                                                    ))}
                                                    {(!mk.clo || mk.clo.length === 0) && <span className="text-gray-400 text-[10px] font-normal">—</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-3">
                                            <ProgressBar percent={mk.progress} />
                                            <span className="text-xs font-bold text-gray-500 w-9 text-right">{mk.progress}%</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-4">
                                            <Link href={`/koordinator/soal/create?mata_kuliah_id=${mk.id}`}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#801720] text-white rounded-lg text-xs font-semibold hover:bg-[#6a1219]">
                                                <FilePlus2 className="w-3.5 h-3.5" /> Upload Soal
                                            </Link>
                                            <Link href={`/koordinator/mata-kuliah/${mk.id}`}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200">
                                                <Eye className="w-3.5 h-3.5" /> Lihat Detail
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
                                    <span>Halaman {page} dari {totalPages} ({filteredMk.length} mata kuliah)</span>
                                    <div className="flex gap-1">
                                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                                            className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                                            <ChevronLeft className="w-3.5 h-3.5" />
                                        </button>
                                        <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                                            className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Soal Membutuhkan Perhatian */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" /> Soal Membutuhkan Perhatian
                    </h2>
                    {attention.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-8">Tidak ada soal yang membutuhkan perhatian saat ini.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase">Kode Soal</th>
                                        <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase">Mata Kuliah</th>
                                        <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase">Dosen</th>
                                        <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase">Status</th>

                                        <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase">Update Terakhir</th>
                                        <th className="text-right px-4 py-3 text-[11px] font-bold text-gray-500 uppercase">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {attention.map(soal => (
                                        <tr key={soal.id} className="hover:bg-gray-50/50">
                                            <td className="px-4 py-3 text-xs font-mono text-gray-600">{soal.kode_soal}</td>
                                            <td className="px-4 py-3 text-xs text-gray-700">{soal.mata_kuliah}</td>
                                            <td className="px-4 py-3 text-xs text-gray-600">{soal.dosen}</td>
                                            <td className="px-4 py-3"><StatusBadge status={soal.status} /></td>

                                            <td className="px-4 py-3 text-xs text-gray-400">{relativeTime(soal.updated_at)}</td>
                                            <td className="px-4 py-3 text-right">
                                                <Link href={`/koordinator/mata-kuliah/${soal.mata_kuliah_id}`}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200">
                                                    Detail
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Progress per Mata Kuliah */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-[#801720]" /> Progress per Mata Kuliah
                        </h2>
                        {mataKuliahList.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-6">Belum ada mata kuliah yang ditugaskan.</p>
                        ) : (
                            <div className="space-y-4">
                                {mataKuliahList.map(mk => (
                                    <div key={mk.id}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-semibold text-gray-700 truncate">{mk.nama_mk}</span>
                                            <span className="text-xs font-bold text-gray-500">{mk.progress}%</span>
                                        </div>
                                        <ProgressBar percent={mk.progress} />
                                        <div className="flex gap-3 mt-1 text-[10px] text-gray-400">
                                            <span>{mk.total_soal} total</span>
                                            <span>{mk.pending} pending</span>
                                            <span>{mk.revision} revisi</span>
                                            <span>{mk.approved} approved</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Aktivitas Terbaru */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <ActivityIcon className="w-4 h-4 text-[#801720]" /> Aktivitas Terbaru
                        </h2>
                        {activity.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-6">Belum ada aktivitas.</p>
                        ) : (
                            <div className="space-y-3">
                                {activity.map(item => (
                                    <div key={item.id} className="flex items-start gap-3">
                                        <div className="w-2 h-2 rounded-full bg-[#801720] mt-1.5 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-xs text-gray-700 leading-snug">{item.description}</p>
                                            <p className="text-[10px] text-gray-400">{relativeTime(item.created_at)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* CLO & PLO Overview */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Target className="w-4 h-4 text-[#801720]" /> CLO &amp; PLO Overview
                    </h2>
                    {cloPloOverview.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-6">Belum ada mata kuliah yang ditugaskan.</p>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                            {cloPloOverview.map(mk => (
                                <div key={mk.mata_kuliah_id} className="border border-gray-100 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-sm font-bold text-gray-800">{mk.nama_mk}</p>
                                        <Link href={`/koordinator/mata-kuliah/${mk.mata_kuliah_id}`}
                                            className="text-[11px] text-[#801720] font-semibold hover:underline flex items-center gap-1">
                                            Lihat Mapping CLO &amp; PLO <ArrowRight className="w-3 h-3" />
                                        </Link>
                                    </div>
                                    {(!mk.clo || mk.clo.length === 0) ? (
                                        <p className="text-xs text-gray-400">Belum ada CLO terpetakan.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {mk.clo.map(clo => (
                                                <div key={clo.id} className="text-xs">
                                                    <p className="font-semibold text-gray-700">{clo.kode_clo} — <span className="font-normal text-gray-500">{clo.deskripsi}</span></p>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {clo.plo.map(plo => (
                                                            <span key={plo.id} className="px-2 py-0.5 rounded-full bg-[#801720]/10 text-[#801720] text-[10px] font-bold">{plo.kode_plo}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>


            </div>
        </AuthenticatedLayout>
    );
}
