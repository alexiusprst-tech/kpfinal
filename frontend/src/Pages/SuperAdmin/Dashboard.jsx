import React, { useState, useRef } from 'react';
import AuthenticatedLayout from '../../Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import {
    Users,
    BookOpen,
    Target,
    Activity,
    FileText,
    CheckCircle2,
    Clock,
    AlertCircle,
    XCircle,
    Bell,
    FileDown,
    ArrowUpRight,
    TrendingUp,
    X,
    Calendar,
    FileSpreadsheet,
    Check,
    Layers,
    Download,
    Sparkles
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Dashboard({
    activePeriod,
    allPeriods = [],
    totalDosen = 128,
    totalMataKuliah = 86,
    totalPlo = 24,
    totalClo = 126,
    totalBankSoal = 1245,
    progressPct = 54,
    statusCounts = { SUBMITTED: 312, REVISION: 189, APPROVED: 672, REJECTED: 72 },
    recentActivities = [],
    urgentSoal = [],
    trendData = { labels: [], menunggu: [], disetujui: [], ditolak: [] }
}) {
    const { notifications } = usePage().props;
    const notifCount = notifications?.count || 0;

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
    const getUrgentBadge = (soal) => {
        const diffMs = Date.now() - new Date(soal.created_at).getTime();
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (days >= 3) {
            return { label: 'Urgent', bg: 'bg-red-50 text-red-700 border-red-200', text: 'text-red-700' };
        } else if (soal.status === 'RESUBMITTED') {
            return { label: 'Re-upload', bg: 'bg-blue-50 text-blue-700 border-blue-200', text: 'text-blue-700' };
        } else {
            return { label: 'Priority', bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-700' };
        }
    };

    // Modal state for Generate Laporan
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedPeriodeId, setSelectedPeriodeId] = useState(activePeriod?.id || 'ALL');
    const [isExporting, setIsExporting] = useState(false);

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
                backgroundColor: '#F97316',
                borderRadius: 6,
            },
            {
                label: 'Disetujui',
                data: trendData?.disetujui || [],
                backgroundColor: '#10B981',
                borderRadius: 6,
            },
            {
                label: 'Ditolak',
                data: trendData?.ditolak || [],
                backgroundColor: '#EF4444',
                borderRadius: 6,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    font: { family: 'Plus Jakarta Sans', weight: '700', size: 12 },
                    usePointStyle: true,
                    pointStyle: 'circle',
                },
            },
        },
        scales: {
            x: { grid: { display: false } },
            y: { grid: { color: '#E2E8F0' }, ticks: { stepSize: 50 } },
        },
    };

    return (
        <AuthenticatedLayout title="Dashboard Overview">
            <Head title="Dashboard Super Admin" />

            {/* TOP HEADER SECTION */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-extrabold text-[#1E293B] tracking-tight">Dashboard Overview</h1>
                    <p className="text-xs sm:text-sm text-[#64748B] font-medium">
                        Pemantauan real-time verifikasi soal akademik Telkom University.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Notification Bell */}
                    <button 
                        onClick={() => window.dispatchEvent(new CustomEvent('open-notifications'))}
                        className="relative p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors text-slate-700 cursor-pointer"
                        title="Notifikasi"
                    >
                        <Bell className="w-5 h-5" />
                        {notifCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white animate-pulse">
                                {notifCount}
                            </span>
                        )}
                    </button>

                    {/* Generate Laporan Button */}
                    <button 
                        onClick={() => setShowReportModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#801720] hover:bg-[#681219] text-white rounded-xl text-xs font-bold shadow-md shadow-red-900/10 hover:shadow-lg transition-all cursor-pointer group"
                    >
                        <FileDown className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
                        <span>Generate Laporan</span>
                    </button>
                </div>
            </div>


            {/* ROW 1: 6 STATS GRID */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                {/* 1. Total Dosen */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs text-[#64748B] font-bold mb-2">
                        <span>Total Dosen</span>
                        <div className="w-7 h-7 rounded-lg bg-red-50 text-[#CD202E] flex items-center justify-center">
                            <Users className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-extrabold text-[#1E293B] tracking-tight mb-1">{totalDosen}</div>
                    <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[#64748B] font-semibold">Aktif 115</span>
                        <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-full">+12%</span>
                    </div>
                </div>

                {/* 2. Total Mata Kuliah */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs text-[#64748B] font-bold mb-2">
                        <span>Total MK</span>
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <BookOpen className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-extrabold text-[#1E293B] tracking-tight mb-1">{totalMataKuliah}</div>
                    <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[#64748B] font-semibold">Aktif 80</span>
                        <span className="text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded-full">0%</span>
                    </div>
                </div>

                {/* 3. Total PLO */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs text-[#64748B] font-bold mb-2">
                        <span>Total PLO</span>
                        <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                            <Target className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-extrabold text-[#1E293B] tracking-tight mb-1">{totalPlo}</div>
                    <span className="text-[10px] text-[#64748B] font-semibold">Program Outcome</span>
                </div>

                {/* 4. Total CLO */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs text-[#64748B] font-bold mb-2">
                        <span>Total CLO</span>
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <Activity className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-extrabold text-[#1E293B] tracking-tight mb-1">{totalClo}</div>
                    <span className="text-[10px] text-[#64748B] font-semibold">Course Outcome</span>
                </div>

                {/* 5. Total Bank Soal */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs text-[#64748B] font-bold mb-2">
                        <span>Bank Soal</span>
                        <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                            <FileText className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-extrabold text-[#1E293B] tracking-tight mb-1">{totalBankSoal.toLocaleString()}</div>
                    <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[#64748B] font-semibold">Verified 672</span>
                        <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-full">+24%</span>
                    </div>
                </div>

                {/* 6. Progress Verifikasi */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs text-[#64748B] font-bold mb-1">
                        <span>Progress</span>
                        <div className="w-7 h-7 rounded-lg bg-rose-50 text-[#801720] flex items-center justify-center">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                    </div>
                    <div>
                        <div className="text-xl font-extrabold text-[#1E293B] tracking-tight mb-1.5">{progressPct}% <span className="text-xs font-bold text-slate-500">Selesai</span></div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#801720] rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }}></div>
                        </div>
                    </div>
                    <span className="text-[10px] text-[#801720] font-bold mt-1.5">Periode Aktif</span>
                </div>
            </div>

            {/* ROW 2: 4 STATUS CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {/* MENUNGGU */}
                <div className="bg-white rounded-2xl p-4.5 border border-slate-200/70 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]"></span>
                            <span className="text-xs font-extrabold text-[#64748B] uppercase tracking-wider">Menunggu</span>
                        </div>
                        <div className="text-2xl font-extrabold text-[#1E293B]">{statusCounts.SUBMITTED}</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#FFEDD5] text-[#EA580C] flex items-center justify-center">
                        <Clock className="w-5 h-5" />
                    </div>
                </div>

                {/* REVISI */}
                <div className="bg-white rounded-2xl p-4.5 border border-slate-200/70 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308]"></span>
                            <span className="text-xs font-extrabold text-[#64748B] uppercase tracking-wider">Revisi</span>
                        </div>
                        <div className="text-2xl font-extrabold text-[#1E293B]">{statusCounts.REVISION}</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                </div>

                {/* DISETUJUI */}
                <div className="bg-white rounded-2xl p-4.5 border border-slate-200/70 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
                            <span className="text-xs font-extrabold text-[#64748B] uppercase tracking-wider">Disetujui</span>
                        </div>
                        <div className="text-2xl font-extrabold text-[#1E293B]">{statusCounts.APPROVED}</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] text-[#15803D] flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                </div>

                {/* DITOLAK */}
                <div className="bg-white rounded-2xl p-4.5 border border-slate-200/70 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></span>
                            <span className="text-xs font-extrabold text-[#64748B] uppercase tracking-wider">Ditolak</span>
                        </div>
                        <div className="text-2xl font-extrabold text-[#1E293B]">{statusCounts.REJECTED}</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center">
                        <XCircle className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT 2-COLUMNS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT COL (~68% / 8 cols): Grouped Bar Chart */}
                <div className="lg:col-span-8 bg-white rounded-2xl p-5 border border-slate-200/70 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-base font-extrabold text-[#1E293B]">Tren Verifikasi Soal</h2>
                            <p className="text-xs text-[#64748B] font-medium">Perbandingan soal Menunggu vs Disetujui per tanggal.</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                            <span className="px-3 py-1 rounded-lg bg-slate-100 border border-slate-200">
                                {trendData?.labels?.length > 0 ? `${trendData.labels[0]} - ${trendData.labels[trendData.labels.length - 1]}` : 'Mei - Juni 2026'}
                            </span>
                            <button
                                onClick={downloadChart}
                                className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl transition-all shadow-sm cursor-pointer"
                                title="Unduh Diagram sebagai PNG"
                            >
                                <Download className="w-3.5 h-3.5 text-[#801720]" />
                                <span>Unduh PNG</span>
                            </button>
                        </div>
                    </div>

                    <div className="h-72 w-full">
                        <Bar ref={chartRef} data={chartData} options={chartOptions} />
                    </div>
                </div>

                {/* RIGHT COL (~32% / 4 cols): Perlu Perhatian & Aktivitas Terkini */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Panel: Perlu Perhatian */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-extrabold text-[#1E293B] flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-500" />
                                <span>Perlu Perhatian</span>
                            </h2>
                            <a href="#" className="text-[11px] font-bold text-[#801720] hover:underline flex items-center gap-0.5">
                                <span>Lihat Semua</span>
                                <ArrowUpRight className="w-3 h-3" />
                            </a>
                        </div>

                        <div className="space-y-2.5">
                            {urgentSoal.length > 0 ? (
                                urgentSoal.map((soal) => {
                                    const badge = getUrgentBadge(soal);
                                    return (
                                        <div key={soal.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between hover:bg-slate-100/50 transition-colors">
                                            <div className="min-w-0 flex-1 pr-2">
                                                <p className="text-xs font-bold text-[#1E293B] truncate">
                                                    {soal.mata_kuliah?.nama_mk || 'Mata Kuliah'}
                                                </p>
                                                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                                                    {soal.kategori?.nama || '-'} &bull; {relativeTime(soal.created_at)}
                                                </p>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${badge.bg}`}>
                                                {badge.label}
                                            </span>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                    <p className="text-xs font-semibold text-slate-400">Semua aman. Tidak ada berkas soal yang memerlukan perhatian.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Panel: Aktivitas Terkini */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-sm">
                        <h2 className="text-sm font-extrabold text-[#1E293B] mb-3">Aktivitas Terkini</h2>

                        <div className="relative pl-5 space-y-3.5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                            <div className="relative">
                                <span className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white"></span>
                                <p className="text-xs font-bold text-[#1E293B]">Import PLO berhasil</p>
                                <p className="text-[10px] text-slate-400 font-medium">5 data PLO ditambahkan &bull; 10 menit lalu</p>
                            </div>

                            <div className="relative">
                                <span className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white"></span>
                                <p className="text-xs font-bold text-[#1E293B]">Soal IF401 Diunggah</p>
                                <p className="text-[10px] text-slate-400 font-medium">Oleh ordinator &bull; 1 jam lalu</p>
                            </div>

                            <div className="relative">
                                <span className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-white"></span>
                                <p className="text-xs font-bold text-[#1E293B]">Catatan Revisi Ditambahkan</p>
                                <p className="text-[10px] text-slate-400 font-medium">Oleh Prof. Siti Verifikator &bull; 3 jam lalu</p>
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
                    <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden z-10">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#801720]/10 text-[#801720] flex items-center justify-center flex-shrink-0">
                                    <FileDown className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-[#1E293B]">Generate Laporan Verifikasi</h3>
                                    <p className="text-xs text-slate-500 font-medium">Ekspor data ringkasan & berkas soal akademik</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowReportModal(false)}
                                disabled={isExporting}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body Form */}
                        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                            {/* 1. Pilih Periode */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-[#801720]" />
                                    <span>Pilih Periode Verifikasi</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={selectedPeriodeId}
                                        onChange={(e) => setSelectedPeriodeId(e.target.value)}
                                        className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] transition-all cursor-pointer"
                                    >
                                        <option value="ALL">Semua Periode (Keseluruhan Riwayat)</option>
                                        {allPeriods.length > 0 ? (
                                            allPeriods.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.nama} {p.tahun_ajaran?.nama ? `(${p.tahun_ajaran.nama})` : ''} {p.status === 'ACTIVE' ? '— [AKTIF]' : ''}
                                                </option>
                                            ))
                                        ) : (
                                            activePeriod && (
                                                <option value={activePeriod.id}>
                                                    {activePeriod.nama} [Periode Aktif]
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>
                            </div>

                            {/* 2. Format Dokumen */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <FileDown className="w-3.5 h-3.5 text-[#801720]" />
                                    <span>Format Dokumen</span>
                                </label>
                                <div className="p-4 rounded-xl border border-red-500 bg-red-50/50 ring-2 ring-red-500/20 shadow-xs flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center flex-shrink-0">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-xs font-extrabold text-[#1E293B] flex items-center gap-1.5">
                                                <span>PDF Document</span>
                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-200/70 text-red-800">.pdf</span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Format resmi cetak & arsip laporan verifikasi soal</p>
                                        </div>
                                    </div>
                                    <span className="w-5 h-5 rounded-full bg-[#801720] text-white flex items-center justify-center text-[10px] flex-shrink-0 shadow-xs">
                                        <Check className="w-3 h-3 stroke-[3]" />
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={() => setShowReportModal(false)}
                                disabled={isExporting}
                                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                            >
                                Batal
                            </button>

                            <button
                                type="button"
                                onClick={handleDownloadReport}
                                disabled={isExporting}
                                className="flex items-center gap-2 px-5 py-2.5 bg-[#801720] hover:bg-[#681219] text-white rounded-xl text-xs font-bold shadow-md shadow-red-900/10 hover:shadow-lg transition-all cursor-pointer disabled:opacity-60"
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
