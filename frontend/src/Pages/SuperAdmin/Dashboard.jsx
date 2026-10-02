import React, { useState, useRef, useMemo, useEffect } from 'react';
import AuthenticatedLayout from '../../Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Users,
    BookOpen,
    Activity,
    FileText,
    CheckCircle2,
    Clock,
    AlertCircle,
    AlertTriangle,
    FileDown,
    ArrowUpRight,
    X,
    Calendar,
    Download,
    ShieldCheck,
    BarChart3,
    Filter,
    Search,
    ChevronDown,
    ChevronUp,
    FolderKanban
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
import StatCard from '@/Components/StatCard';
import { relativeTime } from '@/Utils/date';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, ChartLegend);

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
    statusCounts = { SUBMITTED: 0, REVISION: 0, APPROVED: 0 },
    recentActivities = [],
    urgentMataKuliah = [],
    urgentSoal = [],
    courseComparisonData = { labels: [], approved: [], submitted: [], revision: [], belumUpload: [] },
    groupComparisonData = { labels: [], tuntas: [], proses: [], belumUpload: [], groups: [] },
    semesterComparisonData = { labels: [], tuntas: [], proses: [], belumUpload: [], semesters: [] },
    trendData = { labels: [], menunggu: [], disetujui: [], revisi: [] }
}) {
    const { auth } = usePage().props;
    const userName = auth?.user?.name || 'Super Admin';

    const [comparisonViewMode, setComparisonViewMode] = useState('KELOMPOK'); // 'KELOMPOK' | 'SEMESTER' | 'MK'
    const [expandedGroupIds, setExpandedGroupIds] = useState([]);

    const toggleGroupExpand = (groupId) => {
        setExpandedGroupIds(prev =>
            prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
        );
    };

    const attentionList = (urgentMataKuliah && urgentMataKuliah.length > 0) ? urgentMataKuliah : (urgentSoal || []);

    // Chart refs and download handlers
    const chartRef = useRef(null);
    const courseChartRef = useRef(null);

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

    const downloadCourseChart = () => {
        if (courseChartRef.current) {
            const chartInstance = courseChartRef.current;
            const url = chartInstance.toBase64Image ? chartInstance.toBase64Image() : chartInstance.canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = 'perbandingan-upload-soal-mata-kuliah.png';
            link.href = url;
            link.click();
        }
    };

    // Badge styling helper
    const getUrgentBadge = (item) => {
        const status = item?.status;
        switch (status) {
            case 'REVISION':
                return { label: 'Perlu Revisi', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
            case 'IN_REVIEW':
            case 'SUBMITTED':
            case 'RESUBMITTED':
                return { label: 'Menunggu Verifikasi', bg: 'bg-sky-50 text-sky-700 border-sky-200' };
            case 'BELUM_UPLOAD':
                return { label: 'Belum Upload', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
            case 'DRAFT':
                return { label: 'Draf', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
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
            'UPLOAD_SOAL': 'Mengunggah berkas soal baru',
            'SUBMIT_SOAL': 'Mengajukan soal untuk verifikasi',
            'UPLOAD_REVISI': 'Mengunggah revisi berkas soal',
            'UPDATE_SOAL': 'Memperbarui data berkas soal',
            'DELETE_SOAL': 'Menghapus berkas soal',
            'CHANGE_PASSWORD': 'Mengubah kata sandi akun',
        };
        return dict[action] || action.replace(/_/g, ' ').toLowerCase();
    };

    // Modal state for Laporan Download
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedPeriodeId, setSelectedPeriodeId] = useState(activePeriod?.id || 'ALL');
    const [periodFilter, setPeriodFilter] = useState(activePeriod ? 'ACTIVE_ONLY' : 'ALL');
    const [reportType, setReportType] = useState('rekap');
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        if (!showReportModal) return;
        const handleKeyDown = (e) => {
            if ((e.key === 'Escape' || e.key === 'Esc') && !isExporting) {
                setShowReportModal(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showReportModal, isExporting]);

    const displayedPeriods = useMemo(() => {
        if (periodFilter === 'ACTIVE_ONLY') {
            return allPeriods.filter((p) => p.status === 'ACTIVE');
        }
        return allPeriods;
    }, [allPeriods, periodFilter]);

    const handleDownloadReport = () => {
        setIsExporting(true);
        const params = new URLSearchParams({
            periode_id: selectedPeriodeId,
            format: 'pdf',
            type: reportType
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
                label: 'Perlu Revisi',
                data: trendData?.revisi || [],
                backgroundColor: '#F59E0B',
                hoverBackgroundColor: '#D97706',
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

    // State Filter Scope & Selection Mata Kuliah
    const rawCourseList = useMemo(() => courseComparisonData?.courses || [], [courseComparisonData]);
    const assignedCoursesCount = useMemo(() => rawCourseList.filter(c => c.is_assigned).length, [rawCourseList]);

    const [scopeFilter, setScopeFilter] = useState('ALL'); // 'ALL' | 'ASSIGNED'
    const [selectedCourseFilter, setSelectedCourseFilter] = useState('ALL');
    const [searchCourseKeyword, setSearchCourseKeyword] = useState('');

    const filteredCourses = useMemo(() => {
        let list = rawCourseList;

        if (scopeFilter === 'ASSIGNED') {
            list = list.filter(c => c.is_assigned);
        }

        if (selectedCourseFilter !== 'ALL') {
            list = list.filter(c => String(c.id) === String(selectedCourseFilter));
        }

        if (searchCourseKeyword) {
            const kw = searchCourseKeyword.toLowerCase();
            list = list.filter(c => 
                (c.nama_mk && c.nama_mk.toLowerCase().includes(kw)) || 
                (c.kode_mk && c.kode_mk.toLowerCase().includes(kw))
            );
        }

        return list;
    }, [rawCourseList, scopeFilter, selectedCourseFilter, searchCourseKeyword]);

    // Chart data for "Perbandingan Upload Soal per Mata Kuliah" (Stacked Bar Chart)
    const courseComparisonChartData = {
        labels: filteredCourses.map(c => c.short_label || c.nama_mk),
        datasets: [
            {
                label: 'Disetujui',
                data: filteredCourses.map(c => c.approved),
                backgroundColor: '#059669',
                hoverBackgroundColor: '#047857',
                borderRadius: 4,
                borderSkipped: false,
                stack: 'Stack0',
            },
            {
                label: 'Menunggu Verifikasi',
                data: filteredCourses.map(c => c.submitted),
                backgroundColor: '#0EA5E9',
                hoverBackgroundColor: '#0284C7',
                borderRadius: 4,
                borderSkipped: false,
                stack: 'Stack0',
            },
            {
                label: 'Perlu Revisi',
                data: filteredCourses.map(c => c.revision),
                backgroundColor: '#F59E0B',
                hoverBackgroundColor: '#D97706',
                borderRadius: 4,
                borderSkipped: false,
                stack: 'Stack0',
            },
            {
                label: 'Belum Upload',
                data: filteredCourses.map(c => c.belumUpload),
                backgroundColor: '#DC2626',
                hoverBackgroundColor: '#B91C1C',
                borderRadius: 4,
                borderSkipped: false,
                stack: 'Stack0',
            },
        ],
    };

    // Chart data for "Per Kelompok Verifikasi"
    const groupComparisonChartData = {
        labels: groupComparisonData?.labels || [],
        datasets: [
            {
                label: 'Disetujui (100% Tuntas)',
                data: groupComparisonData?.tuntas || [],
                backgroundColor: '#059669',
                hoverBackgroundColor: '#047857',
                borderRadius: 4,
                borderSkipped: false,
                stack: 'Stack0',
            },
            {
                label: 'Sedang Dalam Proses',
                data: groupComparisonData?.proses || [],
                backgroundColor: '#F59E0B',
                hoverBackgroundColor: '#D97706',
                borderRadius: 4,
                borderSkipped: false,
                stack: 'Stack0',
            },
            {
                label: 'Belum Upload',
                data: groupComparisonData?.belumUpload || [],
                backgroundColor: '#DC2626',
                hoverBackgroundColor: '#B91C1C',
                borderRadius: 4,
                borderSkipped: false,
                stack: 'Stack0',
            },
        ],
    };

    // Chart data for "Per Semester"
    const semesterComparisonChartData = {
        labels: semesterComparisonData?.labels || [],
        datasets: [
            {
                label: 'Disetujui (100% Tuntas)',
                data: semesterComparisonData?.tuntas || [],
                backgroundColor: '#059669',
                hoverBackgroundColor: '#047857',
                borderRadius: 4,
                borderSkipped: false,
                stack: 'Stack0',
            },
            {
                label: 'Sedang Dalam Proses',
                data: semesterComparisonData?.proses || [],
                backgroundColor: '#F59E0B',
                hoverBackgroundColor: '#D97706',
                borderRadius: 4,
                borderSkipped: false,
                stack: 'Stack0',
            },
            {
                label: 'Belum Upload',
                data: semesterComparisonData?.belumUpload || [],
                backgroundColor: '#DC2626',
                hoverBackgroundColor: '#B91C1C',
                borderRadius: 4,
                borderSkipped: false,
                stack: 'Stack0',
            },
        ],
    };

    const macroComparisonChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    font: { size: 11, weight: '500' },
                    usePointStyle: true,
                    boxWidth: 8,
                    color: '#334155',
                },
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#FFFFFF',
                bodyColor: '#F8FAFC',
                titleFont: { size: 12, weight: '600' },
                bodyFont: { size: 11, weight: '400' },
                padding: { top: 8, bottom: 8, left: 10, right: 10 },
                cornerRadius: 4,
                boxPadding: 4,
            },
        },
        scales: {
            x: {
                stacked: true,
                grid: { display: false },
                ticks: {
                    font: { size: 11, weight: '500' },
                    color: '#64748B',
                },
            },
            y: {
                stacked: true,
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                    precision: 0,
                    font: { size: 11 },
                    color: '#64748B',
                },
                grid: { color: '#F1F5F9' },
            },
        },
    };

    const courseComparisonChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 300,
        },
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    font: { size: 11, weight: '500' },
                    usePointStyle: true,
                    boxWidth: 8,
                    color: '#334155',
                },
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#FFFFFF',
                bodyColor: '#F8FAFC',
                titleFont: { size: 12, weight: '600' },
                bodyFont: { size: 11, weight: '400' },
                padding: { top: 8, bottom: 8, left: 10, right: 10 },
                cornerRadius: 4,
                boxPadding: 4,
            },
        },
        scales: {
            x: {
                stacked: true,
                grid: { display: false },
                ticks: {
                    font: { size: 10, weight: '500' },
                    color: '#64748B',
                    maxRotation: 45,
                    minRotation: 0,
                },
            },
            y: {
                stacked: true,
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                    precision: 0,
                    font: { size: 11 },
                    color: '#64748B',
                },
                grid: {
                    color: '#F1F5F9',
                },
            },
        },
    };

    return (
        <AuthenticatedLayout title="Beranda Super Admin">
            <Head title="Beranda Super Admin" />

            <div className="space-y-6">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Ringkasan Beranda</h1>
                        <p className="text-xs text-slate-500 font-normal mt-0.5">Sistem tata kelola dan pemantauan verifikasi soal akademik Telkom University</p>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <button
                            type="button"
                            onClick={() => setShowReportModal(true)}
                            className="flex items-center gap-2 px-3.5 py-2 bg-[#9E1B28] hover:bg-[#801720] text-white rounded-[6px] text-xs font-medium border border-[#801720] transition-colors cursor-pointer"
                        >
                            <FileDown className="w-4 h-4" />
                            <span>Buat Laporan</span>
                        </button>
                    </div>
                </div>

                {/* Banner Hero */}
                <div className="relative overflow-hidden bg-gradient-to-r from-[#9E1B28] to-[#801720] text-white rounded-[8px] p-6 lg:p-7 border border-[#801720]/30">
                    <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-end pr-8">
                        <img src="/images/logo-telkom.png" alt="Telkom University" className="w-48 h-48 object-contain filter brightness-0 invert" />
                    </div>

                    <div className="relative z-10 max-w-4xl space-y-3">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-white/10 text-white/90 text-xs font-medium border border-white/15">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                            <span>Administrator Utama Sistem</span>
                        </div>

                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
                            Selamat Datang, {userName}
                        </h1>

                        <p className="text-white/80 text-xs sm:text-sm leading-relaxed font-normal">
                            Pantau kelancaran siklus verifikasi soal ujian akademik, kelola master data dosen dan mata kuliah, serta terbitkan laporan rekapitulasi capaian pembelajaran.
                        </p>

                        <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-medium text-white/90">
                            {activePeriod ? (
                                <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-[4px] border border-white/10">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span>Periode Aktif: <strong className="text-white font-semibold">{activePeriod.nama}</strong></span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 bg-amber-500/20 text-amber-200 px-3 py-1.5 rounded-[4px] border border-amber-300/30">
                                    <AlertCircle className="w-4 h-4 text-amber-300" />
                                    <span>Tidak ada periode verifikasi yang aktif</span>
                                </div>
                            )}

                            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-[4px] border border-white/10">
                                <FileText className="w-4 h-4 text-amber-300" />
                                <span>Bank Soal (Disetujui): <strong className="text-white font-semibold">{totalBankSoal.toLocaleString()}</strong></span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* StatCards Grid (Master Data & Bank Soal Overview) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard label="Total Dosen" value={totalDosen} icon={Users} color="bg-slate-500" href="/superadmin/dosen" />
                    <StatCard label="Total Mata Kuliah" value={totalMataKuliah} icon={BookOpen} color="bg-blue-600" href="/superadmin/mata-kuliah" />
                    <StatCard label="Bank Soal (Disetujui)" value={totalBankSoal.toLocaleString()} icon={FileText} color="bg-emerald-600" />
                </div>

                {/* 3 Status Verification Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard label="Menunggu Verifikasi" value={statusCounts.SUBMITTED} icon={Clock} color="bg-sky-500" />
                    <StatCard label="Perlu Revisi" value={statusCounts.REVISION} icon={AlertTriangle} color="bg-amber-500" />
                    <StatCard label="Disetujui" value={statusCounts.APPROVED} icon={CheckCircle2} color="bg-emerald-600" />
                </div>

                {/* 2-Column Section: Left (Ringkasan Periode Aktif - col-span-7) & Right (Perhatian & Aktivitas - col-span-5) */}
                <div className="grid lg:grid-cols-12 gap-6 items-stretch">
                    {/* Left: Ringkasan Periode Aktif */}
                    <div className="lg:col-span-7 bg-white rounded-[8px] border border-slate-200/90 shadow-2xs p-5 sm:p-6 flex flex-col justify-between">
                        <div>
                            {/* Card Header */}
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="font-bold text-slate-900 flex items-center gap-2.5 text-base">
                                    <div className="w-8 h-8 rounded-[6px] bg-[#9E1B28]/10 flex items-center justify-center text-[#9E1B28]">
                                        <Calendar className="w-4.5 h-4.5" />
                                    </div>
                                    <span>Periode Aktif</span>
                                </h2>

                            </div>

                            {activePeriodSummary ? (
                                <div className="space-y-5">
                                    {/* Title & Dates */}
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                                            {activePeriodSummary.nama}
                                        </h3>
                                        <p className="text-xs text-slate-500 font-normal mt-0.5">
                                            {activePeriodSummary.tanggal_mulai} - {activePeriodSummary.tanggal_selesai}
                                        </p>
                                    </div>

                                    {/* Progress Section */}
                                    <div className="space-y-2 pt-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-slate-900">Progress Keseluruhan</span>
                                            <span className="text-base font-bold text-[#1A6B42]">
                                                {activePeriodSummary.progress_pct}%
                                            </span>
                                        </div>
                                        <div className="w-full h-2 rounded-[2px] bg-slate-100 overflow-hidden">
                                            <div
                                                className="h-full rounded-[2px] bg-[#1A6B42] transition-all duration-500"
                                                style={{ width: `${Math.min(100, Math.max(0, activePeriodSummary.progress_pct))}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 pt-0.5 font-normal">
                                            <strong className="text-slate-900 font-semibold">{activePeriodSummary.completed_mk}</strong> / {activePeriodSummary.total_mk} Mata Kuliah selesai
                                        </p>
                                    </div>

                                    {/* Metadata Items List */}
                                    <div className="space-y-3 pt-4 border-t border-slate-100">
                                        {activePeriodSummary.tahun_ajaran && (
                                            <div className="flex items-center justify-between text-xs py-0.5">
                                                <span className="flex items-center gap-2.5 text-slate-500 font-normal">
                                                    <BookOpen className="w-4 h-4 text-slate-400" />
                                                    <span>Tahun Ajaran</span>
                                                </span>
                                                <span className="font-semibold text-slate-900">
                                                    {activePeriodSummary.tahun_ajaran}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between text-xs py-0.5">
                                            <span className="flex items-center gap-2.5 text-slate-500 font-normal">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                <span>Batas Waktu Unggah</span>
                                            </span>
                                            <span className="font-semibold text-slate-900">
                                                {activePeriodSummary.deadline_upload}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between text-xs py-0.5">
                                            <span className="flex items-center gap-2.5 text-slate-500 font-normal">
                                                <Clock className="w-4 h-4 text-slate-400" />
                                                <span>Sisa Waktu</span>
                                            </span>
                                            <span className="font-semibold text-slate-900">
                                                {activePeriodSummary.sisa_waktu}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between text-xs py-0.5">
                                            <span className="flex items-center gap-2.5 text-slate-500 font-normal">
                                                <ShieldCheck className="w-4 h-4 text-slate-400" />
                                                <span>Status Periode</span>
                                            </span>
                                            <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                {activePeriodSummary.status_label}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Button: Lihat Detail Periode */}
                                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                                        <Link
                                            href={`/superadmin/periode/${activePeriodSummary.id}`}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#9E1B28] hover:bg-[#801720] text-white text-xs font-medium rounded-[6px] border border-[#801720] transition-colors"
                                        >
                                            <span>Lihat Detail Periode</span>
                                            <ArrowUpRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-12 text-center text-slate-500 space-y-3">
                                    <Calendar className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">Belum Ada Periode Aktif</p>
                                        <p className="text-xs text-slate-500 mt-0.5">Aktifkan periode verifikasi soal untuk melihat ringkasan real-time</p>
                                    </div>
                                    <Link
                                        href="/superadmin/periode"
                                        className="inline-flex items-center gap-1.5 mt-2 px-3.5 py-1.5 bg-[#9E1B28] hover:bg-[#801720] text-white text-xs font-medium rounded-[6px] border border-[#801720] transition-colors"
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
                        <div className="bg-white rounded-[8px] border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between flex-1">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="font-bold text-slate-900 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-amber-500" /> Perhatian
                                    </h2>
                                    <span className="text-xs text-slate-500">
                                        {attentionList.length} Mata Kuliah
                                    </span>
                                </div>

                                <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
                                    {attentionList.length > 0 ? (
                                        attentionList.map((item) => {
                                            const badge = getUrgentBadge(item);
                                            const namaMk = item.nama_mk || item.mata_kuliah?.nama_mk || 'Mata Kuliah';
                                            const kodeMk = item.kode_mk || item.mata_kuliah?.kode_mk || '';
                                            const koordinator = item.koordinator ? `Koord: ${item.koordinator}` : 'Koordinator belum ada';
                                            const keterangan = item.keterangan || (item.kategori?.nama ? `${item.kategori.nama} • ${relativeTime(item.created_at)}` : 'Belum disetujui');

                                            return (
                                                <div key={item.id} className="p-2.5 rounded-[6px] bg-slate-50/70 border border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                                    <div className="min-w-0 flex-1 pr-2">
                                                        <p className="text-xs font-semibold text-slate-900 truncate">
                                                             {namaMk} {kodeMk && <span className="text-slate-500 font-normal">({kodeMk})</span>}
                                                        </p>
                                                        <p className="text-[10px] text-slate-500 font-normal mt-0.5 truncate">
                                                            {koordinator} • {keterangan}
                                                        </p>
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-semibold border flex-shrink-0 ${badge.bg}`}>
                                                        {badge.label}
                                                    </span>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-xs text-slate-500 text-center py-6">Semua aman. Seluruh mata kuliah telah memiliki soal yang disetujui.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Aktivitas Terkini */}
                        <div className="bg-white rounded-[8px] border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between flex-1">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="font-bold text-slate-900 flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-[#9E1B28]" /> Aktivitas Terkini
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500">
                                            {recentActivities.length} Terkini
                                        </span>
                                        <span className="text-slate-300">•</span>
                                        <Link
                                            href="/superadmin/aktivitas"
                                            className="text-xs font-semibold text-[#9E1B28] hover:underline flex items-center gap-0.5 transition-colors"
                                            title="Lihat semua riwayat log aktivitas"
                                        >
                                            <span>Lihat Semua</span>
                                            <ArrowUpRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                </div>

                                <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
                                    {recentActivities.length > 0 ? (
                                        recentActivities.map((act) => (
                                            <div key={act.id} className="flex items-start gap-2.5 p-2.5 rounded-[6px] bg-slate-50/70 border border-slate-100 hover:bg-slate-50 transition-colors">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#9E1B28] mt-1.5 flex-shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs text-slate-800 leading-snug font-normal">
                                                        {act.description || formatActivityFallback(act.action)}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 mt-0.5">
                                                        {act.user?.name || act.user_name || 'Sistem'} • {relativeTime(act.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-slate-500 text-center py-6">Belum ada aktivitas tercatat.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Full Width Comparison Chart: Status Upload Soal vs Mata Kuliah / Kelompok / Semester */}
                <div className="bg-white rounded-[8px] border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
                    {/* Header with Title & View Mode Toggle & Download Button */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div>
                            <h2 className="font-bold text-slate-900 flex items-center gap-2.5 text-base">
                                <div className="w-8 h-8 rounded-[6px] bg-[#9E1B28]/10 text-[#9E1B28] flex items-center justify-center">
                                    <BarChart3 className="w-4.5 h-4.5" />
                                </div>
                                <span>Perbandingan Progres Verifikasi Soal & Mata Kuliah</span>
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5 font-normal">
                                {comparisonViewMode === 'KELOMPOK' && 'Membandingkan tingkat kelengkapan dan progres verifikasi soal antar Kelompok Verifikasi'}
                                {comparisonViewMode === 'SEMESTER' && 'Membandingkan ketersediaan dan verifikasi berkas soal berdasarkan jenjang Semester'}
                                {comparisonViewMode === 'MK' && 'Visualisasi status berkas soal per Mata Kuliah secara individual'}
                            </p>
                        </div>

                        <div className="flex items-center gap-2.5 flex-wrap">
                            {/* View Mode Toggle Switch */}
                            <div className="inline-flex items-center p-0.5 bg-slate-100/70 rounded-[6px] border border-slate-200/80">
                                <button
                                    type="button"
                                    onClick={() => setComparisonViewMode('KELOMPOK')}
                                    className={`px-3 py-1.5 rounded-[4px] text-xs font-semibold transition-colors cursor-pointer ${
                                        comparisonViewMode === 'KELOMPOK'
                                            ? 'bg-[#9E1B28] text-white'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    Per Kelompok Verifikasi
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setComparisonViewMode('SEMESTER')}
                                    className={`px-3 py-1.5 rounded-[4px] text-xs font-semibold transition-colors cursor-pointer ${
                                        comparisonViewMode === 'SEMESTER'
                                            ? 'bg-[#9E1B28] text-white'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    Per Semester
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setComparisonViewMode('MK')}
                                    className={`px-3 py-1.5 rounded-[4px] text-xs font-semibold transition-colors cursor-pointer ${
                                        comparisonViewMode === 'MK'
                                            ? 'bg-[#9E1B28] text-white'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    Per MK (Detail)
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={downloadCourseChart}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-[6px] text-xs font-medium transition-colors cursor-pointer shadow-2xs"
                                title="Unduh Diagram sebagai PNG"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>Unduh Chart</span>
                            </button>
                        </div>
                    </div>

                    {/* Content View Based on Mode */}
                    {comparisonViewMode === 'KELOMPOK' && (
                        <div className="space-y-4">
                            {/* Detailed Accordion Breakdown per Kelompok Verifikasi */}
                            {groupComparisonData?.groups?.length > 0 ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                            <FolderKanban className="w-4 h-4 text-[#9E1B28]" />
                                            <span>Penjabaran Progres & Mata Kuliah per Kelompok Verifikasi</span>
                                        </h3>
                                        <span className="text-xs text-slate-500 font-normal">
                                            {groupComparisonData.groups.length} Kelompok Terdaftar
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        {groupComparisonData.groups.map((g) => {
                                            const isExpanded = expandedGroupIds.includes(g.id);
                                            return (
                                                <div key={g.id} className="bg-slate-50/60 border border-slate-200/90 rounded-[6px] p-3.5 space-y-3 transition-colors">
                                                    {/* Group Bar & Info Header */}
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                        <div className="space-y-1 flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-bold text-slate-900 text-sm truncate">{g.nama}</h4>
                                                                <span className="px-2 py-0.5 rounded-[4px] bg-slate-100 text-slate-700 text-[10px] font-semibold">
                                                                    {g.total_mk} MK
                                                                </span>
                                                            </div>

                                                            {/* Progress Bar */}
                                                            <div className="flex items-center gap-3 pt-1">
                                                                <div className="flex-1 h-2 rounded-[2px] bg-slate-200/80 overflow-hidden">
                                                                    <div
                                                                        className="h-full rounded-[2px] bg-[#1A6B42] transition-all duration-500"
                                                                        style={{ width: `${g.progress_pct}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-xs font-bold text-[#1A6B42] min-w-[45px] text-right">
                                                                    {g.progress_pct}%
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Status Summary & Expand Button */}
                                                        <div className="flex items-center gap-3 flex-shrink-0">
                                                            <div className="text-right text-[11px] font-normal text-slate-500 hidden md:block">
                                                                <span className="text-[#1A6B42] font-semibold">{g.tuntas}</span> disetujui • <span className="text-[#92490A] font-semibold">{g.proses}</span> proses • <span className="text-[#991B1B] font-semibold">{g.belum_upload}</span> belum
                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={() => toggleGroupExpand(g.id)}
                                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors cursor-pointer border ${
                                                                    isExpanded
                                                                        ? 'bg-[#9E1B28] text-white border-[#801720]'
                                                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                                                }`}
                                                            >
                                                                <span>{isExpanded ? 'Sembunyikan MK' : `Detail MK (${g.mk_details?.length || 0})`}</span>
                                                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Expanded Course Breakdown */}
                                                    {isExpanded && (
                                                        <div className="pt-3 border-t border-slate-200 animate-in fade-in duration-150">
                                                            {g.mk_details && g.mk_details.length > 0 ? (
                                                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                                                    {g.mk_details.map((mk) => {
                                                                        let badgeStyle = 'bg-stone-100 text-stone-700 border-stone-300';
                                                                        if (mk.status === 'APPROVED') badgeStyle = 'bg-[#1A6B42]/10 text-[#1A6B42] border-[#1A6B42]/25';
                                                                        else if (mk.status === 'REVISION') badgeStyle = 'bg-[#92490A]/10 text-[#92490A] border-[#92490A]/25';
                                                                        else if (mk.status === 'IN_REVIEW') badgeStyle = 'bg-[#2D4A77]/10 text-[#2D4A77] border-[#2D4A77]/25';
                                                                        else if (mk.status === 'BELUM_UPLOAD') badgeStyle = 'bg-[#991B1B]/10 text-[#991B1B] border-[#991B1B]/25';

                                                                        return (
                                                                            <div key={mk.id} className="bg-white border border-slate-200 rounded-[6px] p-3 flex flex-col justify-between space-y-2">
                                                                                <div>
                                                                                    <div className="flex items-center justify-between gap-1 mb-1">
                                                                                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{mk.kode_mk}</span>
                                                                                        <span className="text-[10px] font-normal text-slate-500">Sem {mk.semester || '-'}</span>
                                                                                    </div>
                                                                                    <h5 className="text-xs font-semibold text-slate-900 line-clamp-2 leading-snug">{mk.nama_mk}</h5>
                                                                                </div>

                                                                                <div className="pt-1 flex items-center justify-between border-t border-slate-100 text-[11px]">
                                                                                    <span className="text-slate-500 font-normal">Status Soal</span>
                                                                                    <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-semibold border ${badgeStyle}`}>
                                                                                        {mk.status_label}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            ) : (
                                                                <p className="text-xs text-slate-500 italic py-2 text-center">Belum ada mata kuliah yang didaftarkan pada kelompok ini.</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-48 flex flex-col items-center justify-center text-slate-500 space-y-2">
                                    <FolderKanban className="w-10 h-10 stroke-[1.5] text-slate-300" />
                                    <p className="text-xs font-normal text-slate-500">
                                        Belum ada Kelompok Verifikasi pada periode aktif
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {comparisonViewMode === 'SEMESTER' && (
                        <div className="space-y-3">
                            <div className="h-80 w-full pt-2">
                                {semesterComparisonData?.labels?.length > 0 ? (
                                    <Bar ref={courseChartRef} data={semesterComparisonChartData} options={macroComparisonChartOptions} />
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                                        <BarChart3 className="w-10 h-10 stroke-[1.5] text-slate-300" />
                                        <p className="text-xs font-normal text-slate-500">
                                            Belum ada data semester mata kuliah aktif
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {comparisonViewMode === 'MK' && (
                        <div className="space-y-4">
                            {/* Filter Bar per MK */}
                            {rawCourseList.length > 0 && (
                                <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-[6px] bg-slate-50/80 border border-slate-200">
                                    <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
                                        <div className="inline-flex items-center p-0.5 bg-slate-200/80 rounded-[4px] text-xs font-semibold mr-1">
                                            <button
                                                type="button"
                                                onClick={() => { setScopeFilter('ALL'); setSelectedCourseFilter('ALL'); }}
                                                className={`px-2.5 py-1 rounded-[3px] transition-colors cursor-pointer ${scopeFilter === 'ALL' ? 'bg-white text-slate-900 font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                                            >
                                                Semua MK ({rawCourseList.length})
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setScopeFilter('ASSIGNED'); setSelectedCourseFilter('ALL'); }}
                                                className={`px-2.5 py-1 rounded-[3px] transition-colors cursor-pointer ${scopeFilter === 'ASSIGNED' ? 'bg-[#9E1B28] text-white font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
                                            >
                                                MK Ditugaskan ({assignedCoursesCount})
                                            </button>
                                        </div>

                                        <span className="text-xs font-semibold text-slate-900 flex items-center gap-1 flex-shrink-0">
                                            <Filter className="w-3.5 h-3.5 text-[#9E1B28]" />
                                            <span>Pilih MK:</span>
                                        </span>

                                        <select
                                            value={selectedCourseFilter}
                                            onChange={(e) => setSelectedCourseFilter(e.target.value)}
                                            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-[4px] text-xs font-normal text-slate-900 outline-none focus:border-[#9E1B28] transition-colors cursor-pointer max-w-xs"
                                        >
                                            <option value="ALL">Pilih Spesifik Mata Kuliah...</option>
                                            {rawCourseList.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    [{c.kode_mk}] {c.nama_mk}
                                                </option>
                                            ))}
                                        </select>

                                        <div className="relative max-w-xs flex-1">
                                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                value={searchCourseKeyword}
                                                onChange={(e) => setSearchCourseKeyword(e.target.value)}
                                                placeholder="Cari nama / kode MK..."
                                                className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-[4px] text-xs text-slate-900 focus:border-[#9E1B28] outline-none transition-colors"
                                            />
                                            {searchCourseKeyword && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSearchCourseKeyword('')}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {(selectedCourseFilter !== 'ALL' || searchCourseKeyword || scopeFilter !== 'ALL') && (
                                        <button
                                            type="button"
                                            onClick={() => { setScopeFilter('ALL'); setSelectedCourseFilter('ALL'); setSearchCourseKeyword(''); }}
                                            className="px-2 py-1 text-xs font-medium text-[#9E1B28] hover:bg-[#9E1B28]/10 rounded-[4px] transition-colors cursor-pointer flex items-center gap-1"
                                        >
                                            <X className="w-3 h-3" /> Reset Filter
                                        </button>
                                    )}
                                </div>
                            )}

                            <div className="h-80 w-full pt-2">
                                {filteredCourses.length > 0 ? (
                                    <Bar ref={courseChartRef} data={courseComparisonChartData} options={courseComparisonChartOptions} />
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                                        <BarChart3 className="w-10 h-10 stroke-[1.5] text-slate-300" />
                                        <p className="text-xs font-normal text-slate-500">
                                            {rawCourseList.length > 0 
                                                ? 'Tidak ada mata kuliah yang cocok dengan kata kunci filter' 
                                                : 'Belum ada data mata kuliah yang ditugaskan pada periode aktif'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL GENERATE LAPORAN (POP-UP) */}
            {showReportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
                        onClick={() => !isExporting && setShowReportModal(false)}
                    />

                    {/* Modal Content */}
                    <div className="relative bg-white rounded-[8px] shadow-lg border border-slate-200 w-full max-w-xl overflow-hidden z-10">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-[4px] bg-[#9E1B28]/10 text-[#9E1B28] flex items-center justify-center flex-shrink-0">
                                    <FileDown className="w-4.5 h-4.5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">Buat Laporan Verifikasi</h3>
                                    <p className="text-xs text-slate-500 font-normal">Ekspor data ringkasan & berkas soal akademik</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowReportModal(false)}
                                disabled={isExporting}
                                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-[4px] transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Body Form */}
                        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                            {/* Filter Status Periode */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-[#9E1B28]" />
                                        <span>Filter Periode Verifikasi</span>
                                    </span>
                                </label>

                                {/* Tabs Filter Periode */}
                                <div className="flex items-center gap-1 p-0.5 bg-slate-50 border border-slate-200 rounded-[6px] mb-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPeriodFilter('ACTIVE_ONLY');
                                            if (activePeriod) setSelectedPeriodeId(activePeriod.id);
                                        }}
                                        className={`flex-1 py-1.5 px-3 rounded-[4px] text-xs font-semibold transition-colors cursor-pointer ${periodFilter === 'ACTIVE_ONLY'
                                                ? 'bg-[#9E1B28] text-white'
                                                : 'text-slate-500 hover:text-slate-900'
                                            }`}
                                    >
                                        Hanya Periode Aktif
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPeriodFilter('ALL')}
                                        className={`flex-1 py-1.5 px-3 rounded-[4px] text-xs font-semibold transition-colors cursor-pointer ${periodFilter === 'ALL'
                                                ? 'bg-[#9E1B28] text-white'
                                                : 'text-slate-500 hover:text-slate-900'
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
                                        className="w-full px-3 py-2 text-xs font-normal bg-white border border-slate-200 rounded-[6px] text-slate-900 focus:outline-hidden focus:border-[#9E1B28] transition-colors cursor-pointer"
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
                                <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <FileDown className="w-3.5 h-3.5 text-[#9E1B28]" />
                                    <span>Format Dokumen</span>
                                </label>
                                <div className="p-3.5 rounded-[6px] border border-[#9E1B28] bg-[#9E1B28]/5 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-[4px] bg-[#9E1B28]/10 text-[#9E1B28] flex items-center justify-center flex-shrink-0">
                                            <FileText className="w-4.5 h-4.5" />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                                <span>Dokumen PDF</span>
                                                <span className="px-1.5 py-0.5 rounded-[2px] text-[9px] font-semibold bg-[#9E1B28]/15 text-[#9E1B28]">.pdf</span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 font-normal mt-0.5">Format PDF resmi cetak & arsip laporan verifikasi soal</p>
                                        </div>
                                    </div>
                                    <span className="w-5 h-5 rounded-[4px] bg-[#9E1B28] text-white flex items-center justify-center text-[10px] flex-shrink-0">
                                        <Check className="w-3 h-3 stroke-[3]" />
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={() => setShowReportModal(false)}
                                disabled={isExporting}
                                className="px-3.5 py-2 text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-[6px] transition-colors cursor-pointer disabled:opacity-50"
                            >
                                Batal
                            </button>

                            <button
                                type="button"
                                onClick={handleDownloadReport}
                                disabled={isExporting}
                                className="flex items-center gap-2 px-4 py-2 bg-[#9E1B28] hover:bg-[#801720] text-white rounded-[6px] text-xs font-medium border border-[#801720] transition-colors cursor-pointer disabled:opacity-60"
                            >
                                {isExporting ? (
                                    <>
                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Menyiapkan Berkas...</span>
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-3.5 h-3.5" />
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
