import React, { useState, useRef } from 'react';
import AuthenticatedLayout from '../../Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Users,
    BookOpen,
    Target,
    Activity,
    FileText,
    CheckCircle2,
    Clock,
    AlertCircle,
    AlertTriangle,
    XCircle,
    FileDown,
    ArrowUpRight,
    TrendingUp,
    X,
    Calendar,
    Check,
    Layers,
    Download,
    ShieldCheck,
    BarChart3
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip as ChartTooltip,
    Legend as ChartLegend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import NotificationDropdown from '@/Components/NotificationDropdown';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, ChartLegend);

function StatCard({ label, value, icon: Icon, color, href }) {
    const cardContent = (
        <div className={`bg-white border border-gray-100 shadow-sm rounded-2xl p-4 flex flex-col gap-3 transition-all duration-200 ${href ? 'hover:shadow-md hover:border-gray-200 hover:-translate-y-0.5 group cursor-pointer' : ''
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

export default function Dashboard({
    activePeriod,
    activePeriodSummary,
    allPeriods = [],
    totalDosen = 0,
    totalMataKuliah = 0,
    totalPlo = 0,
    totalClo = 0,
    totalBankSoal = 0,
    progressPct = 0,
    statusCounts = { SUBMITTED: 0, REVISION: 0, APPROVED: 0, REJECTED: 0 },
    recentActivities = [],
    urgentMataKuliah = [],
    urgentSoal = [],
    trendData = { labels: [], menunggu: [], disetujui: [], ditolak: [] }
}) {
    const { auth } = usePage().props;
    const userName = auth?.user?.name || 'Super Admin';

    const attentionList = (urgentMataKuliah && urgentMataKuliah.length > 0) ? urgentMataKuliah : (urgentSoal || []);

    // Chart ref and download handler
    const chartRef = useRef(null);
    const downloadChart = () => {
        if (chartRef.current) {
            const chartInstance = chartRef.current;
            const url = chartInstance.toBase64Image ? chartInstance.toBase64Image() : chartInstance.canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = 'tren-verifikasi-soal.png';
            link.href = url;
            link.click();
        }
    };

    // Relative time helper
    const relativeTime = (dateStr) => {
        if (!dateStr) return '-';
        const diffMs = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diffMs / 60000);
        if (mins < 1) return 'Baru saja';
        if (mins < 60) return `${mins} menit lalu`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} jam lalu`;
        const days = Math.floor(hours / 24);
        return `${days} hari lalu`;
    };

    // Badge styling helper
    const getUrgentBadge = (item) => {
        const status = item?.status;
        switch (status) {
            case 'REVISION':
                return { label: 'Perlu Revisi', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
            case 'REJECTED':
                return { label: 'Ditolak', bg: 'bg-red-50 text-red-700 border-red-200' };
            case 'IN_REVIEW':
            case 'SUBMITTED':
            case 'RESUBMITTED':
                return { label: 'Menunggu Verifikasi', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
            case 'BELUM_UPLOAD':
                return { label: 'Belum Upload', bg: 'bg-slate-100 text-slate-600 border-slate-200' };
            case 'DRAFT':
                return { label: 'Draf', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
            default:
                return { label: item?.status_label || 'Belum Disetujui', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
        }
    };

    // Fallback activity text formatter
    const formatActivityFallback = (action) => {
        if (!action) return 'Aktivitas sistem';
        const dict = {
            'BERITA_ACARA_SOAL_DOWNLOADED': 'Berita acara soal telah diunduh',
            'BERITA_ACARA_CREATED': 'Berita acara verifikasi telah dibuat',
            'BERITA_ACARA_ALL_DOWNLOADED': 'Semua berita acara telah diunduh',
            'VERIFIKASI_APPROVED': 'Soal verifikasi telah disetujui',
            'VERIFIKASI_REVISION': 'Soal verifikasi diminta revisi',
            'VERIFIKASI_REJECTED': 'Soal verifikasi ditolak',
            'UPLOAD_SOAL': 'Mengunggah berkas soal baru',
            'SUBMIT_SOAL': 'Mengajukan soal untuk verifikasi',
            'UPLOAD_REVISI': 'Mengunggah revisi berkas soal',
            'UPDATE_SOAL': 'Memperbarui data berkas soal',
            'DELETE_SOAL': 'Menghapus berkas soal',
            'CHANGE_PASSWORD': 'Mengubah kata sandi akun',
        };
        if (dict[action]) return dict[action];
        return action.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    };

    // Modal state for Generate Laporan
    const [showReportModal, setShowReportModal] = useState(false);
    const [periodFilter, setPeriodFilter] = useState('ACTIVE_ONLY'); // 'ACTIVE_ONLY' | 'ALL'
    const [selectedPeriodeId, setSelectedPeriodeId] = useState(activePeriod?.id || 'ALL');
    const [isExporting, setIsExporting] = useState(false);

    const activePeriods = (allPeriods || []).filter(p => p.status === 'ACTIVE');
    const displayedPeriods = periodFilter === 'ACTIVE_ONLY' ? activePeriods : allPeriods;

    const handleDownloadReport = () => {
        setIsExporting(true);
        const params = new URLSearchParams({
            periode_id: selectedPeriodeId,
            format: 'pdf',
        });

        // Trigger download
        window.open(`/superadmin/dashboard/export-laporan?${params.toString()}`, '_blank');

        setTimeout(() => {
            setIsExporting(false);
            setShowReportModal(false);
        }, 1200);
    };

    // Chart data for "Tren Verifikasi Soal"
    const chartData = {
        labels: trendData?.labels || [],
        datasets: [
            {
                label: 'Menunggu',
                data: trendData?.menunggu || [],
                backgroundColor: '#8B5CF6',
                hoverBackgroundColor: '#7C3AED',
                borderRadius: 8,
                borderSkipped: false,
                maxBarThickness: 28,
            },
            {
                label: 'Disetujui',
                data: trendData?.disetujui || [],
                backgroundColor: '#10B981',
                hoverBackgroundColor: '#059669',
                borderRadius: 8,
                borderSkipped: false,
                maxBarThickness: 28,
            },
            {
                label: 'Ditolak',
                data: trendData?.ditolak || [],
                backgroundColor: '#EF4444',
                hoverBackgroundColor: '#DC2626',
                borderRadius: 8,
                borderSkipped: false,
                maxBarThickness: 28,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 400,
        },
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    font: { size: 11, weight: '600' },
                    usePointStyle: true,
                    boxWidth: 8,
                    color: '#475569',
                },
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
        <AuthenticatedLayout title="Dashboard Super Admin">
            <Head title="Dashboard Super Admin" />

            <div className="space-y-6">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Dashboard Overview</h1>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">Sistem tata kelola dan pemantauan verifikasi soal akademik Telkom University</p>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <NotificationDropdown align="right" />
                        <button
                            type="button"
                            onClick={() => setShowReportModal(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-[#801720] hover:bg-[#9B1B26] text-white rounded-xl text-xs font-bold shadow-md shadow-red-900/10 hover:shadow-lg transition-all cursor-pointer group"
                        >
                            <FileDown className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
                            <span>Generate Laporan</span>
                        </button>
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
                            <span>Administrator Utama Sistem</span>
                        </div>

                        <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white">
                            Selamat Datang, {userName} 👋
                        </h1>

                        <p className="text-white/80 text-sm leading-relaxed font-normal">
                            Pantau kelancaran siklus verifikasi soal ujian akademik, kelola master data dosen dan mata kuliah, serta terbitkan laporan rekapitulasi capaian pembelajaran.
                        </p>

                        <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-white/90">
                            {activePeriod ? (
                                <div className="flex items-center gap-2 bg-black/20 px-3.5 py-1.5 rounded-xl border border-white/10">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    <span>Periode Aktif: <strong className="text-white font-bold">{activePeriod.nama}</strong></span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 bg-amber-500/30 text-amber-200 px-3.5 py-1.5 rounded-xl border border-amber-300/30">
                                    <AlertCircle className="w-4 h-4 text-amber-300" />
                                    <span>Tidak ada periode verifikasi yang aktif</span>
                                </div>
                            )}

                            <div className="flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/5">
                                <FileText className="w-4 h-4 text-amber-300" />
                                <span>Bank Soal (Disetujui): <strong className="text-white font-bold">{totalBankSoal.toLocaleString()}</strong></span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* StatCards Grid (Master Data & Bank Soal Overview) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard label="Total Dosen" value={totalDosen} icon={Users} color="bg-slate-700" href="/superadmin/dosen" />
                    <StatCard label="Total Mata Kuliah" value={totalMataKuliah} icon={BookOpen} color="bg-blue-600" href="/superadmin/mata-kuliah" />
                    <StatCard label="Bank Soal (Disetujui)" value={totalBankSoal.toLocaleString()} icon={FileText} color="bg-emerald-600" />
                </div>

                {/* 4 Status Verification Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatCard label="Menunggu Verifikasi" value={statusCounts.SUBMITTED} icon={Clock} color="bg-purple-600" />
                    <StatCard label="Perlu Revisi" value={statusCounts.REVISION} icon={AlertTriangle} color="bg-amber-500" />
                    <StatCard label="Disetujui" value={statusCounts.APPROVED} icon={CheckCircle2} color="bg-emerald-600" />
                    <StatCard label="Ditolak" value={statusCounts.REJECTED} icon={XCircle} color="bg-red-500" />
                </div>

                {/* 2-Column Section: Left (Ringkasan Periode Aktif - col-span-7) & Right (Perhatian & Aktivitas - col-span-5) */}
                <div className="grid lg:grid-cols-12 gap-6 items-stretch">
                    {/* Left: Ringkasan Periode Aktif */}
                    <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
                        <div>
                            {/* Card Header */}
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="font-bold text-gray-800 flex items-center gap-2.5 text-base">
                                    <div className="w-8 h-8 rounded-xl bg-[#801720]/10 flex items-center justify-center text-[#801720]">
                                        <Calendar className="w-4.5 h-4.5" />
                                    </div>
                                    <span>Periode Aktif</span>
                                </h2>
                                {activePeriodSummary && (
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        {activePeriodSummary.status_label || 'Aktif'}
                                    </span>
                                )}
                            </div>

                            {activePeriodSummary ? (
                                <div className="space-y-6">
                                    {/* Title & Dates */}
                                    <div>
                                        <h3 className="text-xl font-black text-slate-800 tracking-tight">
                                            {activePeriodSummary.nama}
                                        </h3>
                                        <p className="text-xs font-semibold text-slate-500 mt-1">
                                            {activePeriodSummary.tanggal_mulai} - {activePeriodSummary.tanggal_selesai}
                                        </p>
                                    </div>

                                    {/* Progress Section */}
                                    <div className="space-y-2 pt-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-700">Progress Keseluruhan</span>
                                            <span className="text-lg font-black text-emerald-600">
                                                {activePeriodSummary.progress_pct}%
                                            </span>
                                        </div>
                                        <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden p-0.5 border border-slate-200/60">
                                            <div
                                                className="h-full rounded-full bg-emerald-500 transition-all duration-700 shadow-xs"
                                                style={{ width: `${Math.min(100, Math.max(0, activePeriodSummary.progress_pct))}%` }}
                                            />
                                        </div>
                                        <p className="text-xs font-medium text-slate-500 pt-0.5">
                                            <strong className="text-slate-800 font-bold">{activePeriodSummary.completed_mk}</strong> / {activePeriodSummary.total_mk} Mata Kuliah selesai
                                        </p>
                                    </div>

                                    {/* Metadata Items List */}
                                    <div className="space-y-3.5 pt-4 border-t border-gray-100">
                                        {activePeriodSummary.tahun_ajaran && (
                                            <div className="flex items-center justify-between text-xs py-0.5">
                                                <span className="flex items-center gap-2.5 text-slate-500 font-medium">
                                                    <BookOpen className="w-4 h-4 text-slate-400" />
                                                    <span>Tahun Ajaran</span>
                                                </span>
                                                <span className="font-bold text-slate-800">
                                                    {activePeriodSummary.tahun_ajaran}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between text-xs py-0.5">
                                            <span className="flex items-center gap-2.5 text-slate-500 font-medium">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                <span>Deadline Upload</span>
                                            </span>
                                            <span className="font-bold text-slate-800">
                                                {activePeriodSummary.deadline_upload}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between text-xs py-0.5">
                                            <span className="flex items-center gap-2.5 text-slate-500 font-medium">
                                                <Clock className="w-4 h-4 text-slate-400" />
                                                <span>Sisa Waktu</span>
                                            </span>
                                            <span className="font-bold text-slate-800">
                                                {activePeriodSummary.sisa_waktu}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between text-xs py-0.5">
                                            <span className="flex items-center gap-2.5 text-slate-500 font-medium">
                                                <ShieldCheck className="w-4 h-4 text-slate-400" />
                                                <span>Status Periode</span>
                                            </span>
                                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                {activePeriodSummary.status_label}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-12 text-center text-slate-400 space-y-3">
                                    <Calendar className="w-12 h-12 mx-auto text-slate-300 stroke-[1.5]" />
                                    <div>
                                        <p className="text-sm font-bold text-slate-700">Belum Ada Periode Aktif</p>
                                        <p className="text-xs font-medium text-slate-400 mt-0.5">Aktifkan periode verifikasi soal untuk melihat ringkasan real-time</p>
                                    </div>
                                    <Link
                                        href="/superadmin/tahun-ajaran"
                                        className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-[#801720] hover:bg-[#9B1B26] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                                    >
                                        <span>Kelola Periode Verifikasi</span>
                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Perhatian & Aktivitas Terkini (col-span-5) */}
                    <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
                        {/* Perhatian */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between flex-1">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="font-bold text-gray-800 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-amber-500" /> Perhatian
                                    </h2>
                                    <span className="text-xs font-semibold text-slate-500">
                                        {attentionList.length} Mata Kuliah
                                    </span>
                                </div>

                                <div className="space-y-2.5 max-h-[170px] overflow-y-auto pr-1">
                                    {attentionList.length > 0 ? (
                                        attentionList.map((item) => {
                                            const badge = getUrgentBadge(item);
                                            const namaMk = item.nama_mk || item.mata_kuliah?.nama_mk || 'Mata Kuliah';
                                            const kodeMk = item.kode_mk || item.mata_kuliah?.kode_mk || '';
                                            const koordinator = item.koordinator ? `Koord: ${item.koordinator}` : 'Koordinator belum ada';
                                            const keterangan = item.keterangan || (item.kategori?.nama ? `${item.kategori.nama} • ${relativeTime(item.created_at)}` : 'Belum disetujui');

                                            return (
                                                <div key={item.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between hover:bg-slate-100/60 transition-colors">
                                                    <div className="min-w-0 flex-1 pr-2">
                                                        <p className="text-xs font-bold text-gray-800 truncate">
                                                            {namaMk} {kodeMk && <span className="text-gray-400 font-normal">({kodeMk})</span>}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 font-medium mt-0.5 truncate">
                                                            {koordinator} • {keterangan}
                                                        </p>
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${badge.bg}`}>
                                                        {badge.label}
                                                    </span>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-xs text-gray-400 text-center py-6">Semua aman. Seluruh mata kuliah telah memiliki soal yang disetujui.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Aktivitas Terkini */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between flex-1">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="font-bold text-gray-800 flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-[#801720]" /> Aktivitas Terkini
                                    </h2>
                                    <span className="text-xs font-semibold text-slate-500">
                                        {recentActivities.length} Aktivitas
                                    </span>
                                </div>

                                <div className="space-y-2.5 max-h-[170px] overflow-y-auto pr-1">
                                    {recentActivities.length > 0 ? (
                                        recentActivities.map((act) => (
                                            <div key={act.id} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/60 transition-colors">
                                                <div className="w-2 h-2 rounded-full bg-[#801720] mt-1.5 flex-shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs text-gray-700 leading-snug font-medium">
                                                        {act.description || formatActivityFallback(act.action)}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 mt-1">
                                                        {act.user?.name || act.user_name || 'Sistem'} • {relativeTime(act.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-gray-400 text-center py-6">Belum ada aktivitas tercatat.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL GENERATE LAPORAN (POP-UP) */}
            {showReportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                        onClick={() => !isExporting && setShowReportModal(false)}
                    />

                    {/* Modal Content */}
                    <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-xl overflow-hidden z-10">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4.5 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#801720]/10 text-[#801720] flex items-center justify-center flex-shrink-0">
                                    <FileDown className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-800">Generate Laporan Verifikasi</h3>
                                    <p className="text-xs text-gray-500 font-medium">Ekspor data ringkasan & berkas soal akademik</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowReportModal(false)}
                                disabled={isExporting}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body Form */}
                        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                            {/* Filter Status Periode */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-[#801720]" />
                                        <span>Filter Periode Verifikasi</span>
                                    </span>
                                </label>

                                {/* Tabs Filter Periode */}
                                <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl mb-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPeriodFilter('ACTIVE_ONLY');
                                            if (activePeriod) setSelectedPeriodeId(activePeriod.id);
                                        }}
                                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${periodFilter === 'ACTIVE_ONLY'
                                                ? 'bg-white text-[#801720] shadow-xs'
                                                : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                    >
                                        Hanya Periode Aktif
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPeriodFilter('ALL')}
                                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${periodFilter === 'ALL'
                                                ? 'bg-white text-[#801720] shadow-xs'
                                                : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                    >
                                        Semua Riwayat Periode
                                    </button>
                                </div>

                                {/* Select Dropdown */}
                                <div className="relative">
                                    <select
                                        value={selectedPeriodeId}
                                        onChange={(e) => setSelectedPeriodeId(e.target.value)}
                                        className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] transition-all cursor-pointer"
                                    >
                                        {periodFilter === 'ALL' && (
                                            <option value="ALL">Semua Periode (Keseluruhan Riwayat)</option>
                                        )}
                                        {displayedPeriods.length > 0 ? (
                                            displayedPeriods.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.nama} {p.tahun_ajaran?.nama ? `(${p.tahun_ajaran.nama})` : ''} {p.status === 'ACTIVE' ? '— [AKTIF]' : '— [SELESAI]'}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="" disabled>
                                                Tidak ada periode {periodFilter === 'ACTIVE_ONLY' ? 'aktif' : ''} ditemukan
                                            </option>
                                        )}
                                    </select>
                                </div>
                            </div>

                            {/* Format Dokumen (PDF) */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <FileDown className="w-3.5 h-3.5 text-[#801720]" />
                                    <span>Format Dokumen</span>
                                </label>
                                <div className="p-4 rounded-xl border border-red-500 bg-red-50/50 ring-2 ring-red-500/20 shadow-xs flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center flex-shrink-0">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-xs font-extrabold text-gray-800 flex items-center gap-1.5">
                                                <span>PDF Document</span>
                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-200/70 text-red-800">.pdf</span>
                                            </div>
                                            <p className="text-[11px] text-gray-500 font-medium mt-0.5">Format PDF resmi cetak & arsip laporan verifikasi soal</p>
                                        </div>
                                    </div>
                                    <span className="w-5 h-5 rounded-full bg-[#801720] text-white flex items-center justify-center text-[10px] flex-shrink-0 shadow-xs">
                                        <Check className="w-3 h-3 stroke-[3]" />
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="px-6 py-4 border-t border-gray-100 bg-slate-50 flex items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={() => setShowReportModal(false)}
                                disabled={isExporting}
                                className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:text-gray-800 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                            >
                                Batal
                            </button>

                            <button
                                type="button"
                                onClick={handleDownloadReport}
                                disabled={isExporting}
                                className="flex items-center gap-2 px-5 py-2.5 bg-[#801720] hover:bg-[#9B1B26] text-white rounded-xl text-xs font-bold shadow-md shadow-red-900/10 hover:shadow-lg transition-all cursor-pointer disabled:opacity-60"
                            >
                                {isExporting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Menyiapkan Berkas...</span>
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4" />
                                        <span>Unduh Laporan</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
