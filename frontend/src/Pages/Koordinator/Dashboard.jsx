import React, { useMemo, useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    FileText, CheckCircle2, AlertTriangle, Eye, FilePlus2,
    LayoutDashboard, ArrowRight, BookOpen, Upload, Search, ChevronLeft, ChevronRight,
    Users, Target, Activity as ActivityIcon, CalendarClock, Bell, ShieldCheck, Calendar,
    Clock, XCircle, PieChart, BarChart3, TrendingUp,
} from 'lucide-react';
import {
    Chart as ChartJS,
    ArcElement,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip as ChartTooltip,
    Legend as ChartLegend
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import NotificationDropdown from '@/Components/NotificationDropdown';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, ChartTooltip, ChartLegend);

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
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.BELUM_UPLOAD;
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

const PER_PAGE = 6;

export default function KoordinatorDashboard({ activePeriod, deadline, stats, mataKuliahList, attention, verifikators, cloPloOverview, activity }) {
    const { auth, notifications } = usePage().props;
    const notifCount = notifications?.count || 0;
    const userName = auth?.user?.name || 'Koordinator';
    const kodeDosen = auth?.user?.dosen?.kode_dosen;

    const [search, setSearch] = useState('');
    const [semesterFilter, setSemesterFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [chartType, setChartType] = useState('donut'); // 'donut' | 'bar'

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

    const totalChartItems = (stats?.belum_upload || 0) + (stats?.in_review || 0) + (stats?.approved || 0) + (stats?.revisi || 0) + (stats?.rejected || 0);
    const hasData = totalChartItems > 0;

    const donutData = {
        labels: ['Belum Upload', 'In Review', 'Disetujui', 'Revisi', 'Ditolak'],
        datasets: [
            {
                data: hasData
                    ? [stats?.belum_upload || 0, stats?.in_review || 0, stats?.approved || 0, stats?.revisi || 0, stats?.rejected || 0]
                    : [1],
                backgroundColor: hasData
                    ? ['#94A3B8', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444']
                    : ['#F1F5F9'],
                hoverBackgroundColor: hasData
                    ? ['#64748B', '#7C3AED', '#059669', '#D97706', '#DC2626']
                    : ['#F1F5F9'],
                borderWidth: 2,
                borderColor: '#ffffff',
            },
        ],
    };

    const donutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        animation: {
            animateScale: true,
            animateRotate: true,
        },
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                enabled: hasData,
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#FFFFFF',
                bodyColor: '#F8FAFC',
                titleFont: { size: 12, weight: 'bold' },
                bodyFont: { size: 12, weight: '600' },
                padding: { top: 8, bottom: 8, left: 12, right: 12 },
                cornerRadius: 10,
                boxPadding: 6,
                usePointStyle: true,
                callbacks: {
                    label: function (context) {
                        const label = context.label || '';
                        const val = context.raw || 0;
                        const total = totalChartItems || 1;
                        const pct = Math.round((val / total) * 100);
                        return ` ${label}: ${val} (${pct}%)`;
                    },
                },
            },
        },
    };

    const barData = {
        labels: ['Belum Upload', 'In Review', 'Disetujui', 'Revisi', 'Ditolak'],
        datasets: [
            {
                label: 'Jumlah',
                data: [
                    stats?.belum_upload || 0,
                    stats?.in_review || 0,
                    stats?.approved || 0,
                    stats?.revisi || 0,
                    stats?.rejected || 0,
                ],
                backgroundColor: ['#94A3B8', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'],
                hoverBackgroundColor: ['#64748B', '#7C3AED', '#059669', '#D97706', '#DC2626'],
                borderRadius: 8,
                borderSkipped: false,
                maxBarThickness: 36,
            },
        ],
    };

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 400,
        },
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#FFFFFF',
                bodyColor: '#F8FAFC',
                titleFont: { size: 12, weight: 'bold' },
                bodyFont: { size: 12, weight: '600' },
                padding: { top: 8, bottom: 8, left: 12, right: 12 },
                cornerRadius: 10,
                boxPadding: 6,
                callbacks: {
                    label: function (context) {
                        const val = context.raw || 0;
                        const total = totalChartItems || 1;
                        const pct = Math.round((val / total) * 100);
                        return ` ${val} (${pct}%)`;
                    },
                },
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: {
                    font: { size: 11, weight: '600' },
                    color: '#64748B',
                },
            },
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                    precision: 0,
                    font: { size: 11 },
                    color: '#94A3B8',
                },
                grid: {
                    color: '#F1F5F9',
                },
            },
        },
    };

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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    <StatCard label="Mata Kuliah Saya" value={stats.total_mk}     icon={BookOpen}      color="bg-slate-700" />
                    <StatCard label="Belum Diupload"   value={stats.belum_upload} icon={FilePlus2}     color="bg-gray-500" />
                    <StatCard label="In Review"        value={stats.in_review}    icon={Clock}         color="bg-purple-600" />
                    <StatCard label="Perlu Revisi"     value={stats.revisi}       icon={AlertTriangle} color="bg-amber-500" />
                    <StatCard label="Disetujui"        value={stats.approved}     icon={CheckCircle2}  color="bg-emerald-600" />
                    <StatCard label="Ditolak"          value={stats.rejected}     icon={XCircle}       color="bg-red-500" />
                </div>

                {/* 2-Column Section: Diagram Distribusi Status (Left) & Status Mata Kuliah (Right) */}
                <div className="grid lg:grid-cols-12 gap-6 items-stretch">
                    {/* Left: Diagram Distribusi Status */}
                    <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                                    {chartType === 'donut' ? (
                                        <PieChart className="w-5 h-5 text-[#801720]" />
                                    ) : (
                                        <BarChart3 className="w-5 h-5 text-[#801720]" />
                                    )}
                                    Distribusi Status Mata Kuliah &amp; Soal
                                </h2>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                    Proporsi status penyusunan dan verifikasi mata kuliah Anda
                                </p>
                            </div>

                            {/* Chart Type Toggle */}
                            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                                <button
                                    type="button"
                                    onClick={() => setChartType('donut')}
                                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                        chartType === 'donut'
                                            ? 'bg-white text-[#801720] shadow-xs'
                                            : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                    title="Diagram Donut"
                                    aria-label="Diagram Donut"
                                >
                                    <PieChart className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setChartType('bar')}
                                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                        chartType === 'bar'
                                            ? 'bg-white text-[#801720] shadow-xs'
                                            : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                    title="Diagram Batang"
                                    aria-label="Diagram Batang"
                                >
                                    <BarChart3 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Chart Canvas Area */}
                        <div className="relative w-full h-56 mx-auto flex items-center justify-center my-3">
                            {chartType === 'donut' ? (
                                <div className="relative w-52 h-52 sm:w-56 sm:h-56 mx-auto flex items-center justify-center">
                                    <Doughnut data={donutData} options={donutOptions} />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-3xl font-black text-slate-900 leading-tight">{stats?.total_mk || 0}</span>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">Mata Kuliah</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full h-full pt-2">
                                    <Bar data={barData} options={barOptions} />
                                </div>
                            )}
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap items-center justify-center gap-4 pt-2 border-t border-slate-100">
                            {[
                                { label: 'Belum Upload', color: 'bg-slate-400', count: stats?.belum_upload || 0 },
                                { label: 'In Review',    color: 'bg-purple-500', count: stats?.in_review || 0 },
                                { label: 'Disetujui',    color: 'bg-emerald-500', count: stats?.approved || 0 },
                                { label: 'Revisi',       color: 'bg-amber-500', count: stats?.revisi || 0 },
                                { label: 'Ditolak',      color: 'bg-red-500', count: stats?.rejected || 0 },
                            ].map(item => (
                                <div key={item.label} className="flex items-center gap-1.5 text-xs">
                                    <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                                    <span className="text-slate-600 font-medium">{item.label}:</span>
                                    <span className="font-bold text-slate-800">{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Aktivitas Terbaru */}
                    <div className="lg:col-span-5 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                                    <ActivityIcon className="w-5 h-5 text-[#801720]" /> Aktivitas Terbaru
                                </h2>
                                <span className="text-xs font-semibold text-slate-500">
                                    {activity.length} Aktivitas
                                </span>
                            </div>

                            {activity.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-10">Belum ada aktivitas.</p>
                            ) : (
                                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                                    {activity.map(item => (
                                        <div key={item.id} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/60 transition-colors">
                                            <div className="w-2 h-2 rounded-full bg-[#801720] mt-1.5 flex-shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs text-gray-700 leading-snug">{item.description}</p>
                                                <p className="text-[10px] text-gray-400 mt-1">{relativeTime(item.created_at)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="pt-3 border-t border-slate-100 mt-4 text-center">
                            <p className="text-[11px] font-semibold text-slate-400">
                                Riwayat aktivitas terkini sistem verifikasi
                            </p>
                        </div>
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
                                <option value="BELUM_UPLOAD">Belum Upload</option>
                                <option value="IN_REVIEW">In Review</option>
                                <option value="REVISION">Perlu Revisi</option>
                                <option value="APPROVED">Disetujui</option>
                                <option value="REJECTED">Ditolak</option>
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
                                    <div key={mk.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs hover:border-[#801720]/30 hover:shadow-md transition-all flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-base font-bold text-gray-800 truncate" title={mk.nama_mk}>{mk.nama_mk}</p>
                                                    <p className="text-xs text-gray-400 font-medium mt-0.5">{mk.kode_mk} · Semester {mk.semester} · {mk.sks} SKS</p>
                                                </div>
                                                <StatusBadge status={mk.status} />
                                            </div>
                                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 text-xs">
                                                <span className="text-gray-600 font-semibold">{mk.total_soal} Soal Terunggah</span>
                                                {mk.status === 'BELUM_UPLOAD' && (
                                                    <span className="text-slate-400 font-normal italic">(Belum ada draf soal)</span>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-gray-100">
                                                <div>
                                                    <p className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">Mapping PLO</p>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {mk.plo && mk.plo.length > 0 ? (
                                                            mk.plo.map((p) => (
                                                                <span key={p.id || p.kode_plo} className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold text-[9px] border border-purple-100" title={p.deskripsi}>
                                                                    {p.kode_plo}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-gray-300 text-xs">-</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">Mapping CLO</p>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {mk.clo && mk.clo.length > 0 ? (
                                                            mk.clo.map((c) => (
                                                                <span key={c.id || c.kode_clo} className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[9px] border border-emerald-100" title={c.deskripsi}>
                                                                    {c.kode_clo}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-gray-300 text-xs">-</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2.5 mt-5 pt-3 border-t border-gray-100">
                                            <Link
                                                href={`/koordinator/mata-kuliah/${mk.id}`}
                                                className="py-2 px-3 rounded-xl bg-[#801720] text-white text-xs font-bold hover:bg-[#9B1B26] transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                                            >
                                                <Upload className="w-3.5 h-3.5" />
                                                Upload Soal
                                            </Link>
                                            <Link
                                                href={`/koordinator/mata-kuliah/${mk.id}`}
                                                className="py-2 px-3 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                Lihat Detail
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

            </div>
        </AuthenticatedLayout>
    );
}
