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

export default function Dashboard({
    activePeriod,
    allPeriods = [],
    totalDosen = 0,
    totalMataKuliah = 0,
    totalPlo = 0,
    totalClo = 0,
    totalBankSoal = 0,
    progressPct = 0,
    statusCounts = { SUBMITTED: 0, REVISION: 0, APPROVED: 0, REJECTED: 0 },
    recentActivities = [],
    urgentSoal = [],
    trendData = { labels: [], menunggu: [], disetujui: [], ditolak: [] }
}) {
    const { auth } = usePage().props;
    const userName = auth?.user?.name || 'Super Admin';

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
            return { label: 'Urgent', bg: 'bg-red-50 text-red-700 border-red-200' };
        } else if (soal.status === 'RESUBMITTED') {
            return { label: 'Re-upload', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
        } else {
            return { label: 'Priority', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
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

                {/* 6 StatCards Grid (Master Data Overview) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    <StatCard label="Total Dosen"            value={totalDosen}                     icon={Users}       color="bg-slate-700" />
                    <StatCard label="Total Mata Kuliah"      value={totalMataKuliah}                icon={BookOpen}    color="bg-blue-600" />
                    <StatCard label="Total PLO"              value={totalPlo}                       icon={Target}      color="bg-purple-600" />
                    <StatCard label="Total CLO"              value={totalClo}                       icon={Layers}      color="bg-indigo-600" />
                    <StatCard label="Bank Soal (Disetujui)"  value={totalBankSoal.toLocaleString()} icon={FileText}    color="bg-emerald-600" />
                    <StatCard label="Progress Periode"       value={`${progressPct}%`}              icon={TrendingUp}  color="bg-amber-500" />
                </div>

                {/* 4 Status Verification Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatCard label="Menunggu Verifikasi" value={statusCounts.SUBMITTED} icon={Clock}         color="bg-purple-600" />
                    <StatCard label="Perlu Revisi"        value={statusCounts.REVISION}  icon={AlertTriangle} color="bg-amber-500" />
                    <StatCard label="Disetujui"           value={statusCounts.APPROVED}  icon={CheckCircle2}  color="bg-emerald-600" />
                    <StatCard label="Ditolak"             value={statusCounts.REJECTED}  icon={XCircle}       color="bg-red-500" />
                </div>

                {/* 2-Column Section: Left (Diagram Tren Verifikasi - col-span-7) & Right (Perlu Perhatian & Aktivitas - col-span-5) */}
                <div className="grid lg:grid-cols-12 gap-6 items-stretch">
                    {/* Left: Tren Verifikasi Soal */}
                    <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="font-bold text-gray-800 flex items-center gap-2">
                                        <BarChart3 className="w-4 h-4 text-[#801720]" /> Tren Verifikasi Soal
                                    </h2>
                                    <p className="text-xs text-gray-500 font-medium mt-0.5">Perbandingan soal Menunggu, Disetujui, dan Ditolak harian</p>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                    <span className="px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-[11px]">
                                        {trendData?.labels?.length > 0 ? `${trendData.labels[0]} - ${trendData.labels[trendData.labels.length - 1]}` : '7 Hari Terakhir'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={downloadChart}
                                        className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 hover:border-gray-300 hover:bg-slate-50 text-gray-700 rounded-xl transition-all shadow-xs cursor-pointer text-xs"
                                        title="Unduh Diagram sebagai PNG"
                                    >
                                        <Download className="w-3.5 h-3.5 text-[#801720]" />
                                        <span>PNG</span>
                                    </button>
                                </div>
                            </div>

                            <div className="h-64 sm:h-72 w-full pt-2">
                                <Bar ref={chartRef} data={chartData} options={chartOptions} />
                            </div>
                        </div>

                        <div className="pt-3 border-t border-gray-100 mt-4 text-center">
                            <p className="text-[11px] font-semibold text-slate-400">
                                Pemantauan tren harian verifikasi soal akademik
                            </p>
                        </div>
                    </div>

                    {/* Right: Perlu Perhatian & Aktivitas Terkini (col-span-5) */}
                    <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
                        {/* Perlu Perhatian */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between flex-1">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="font-bold text-gray-800 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-amber-500" /> Perlu Perhatian
                                    </h2>
                                    <span className="text-xs font-semibold text-slate-500">
                                        {urgentSoal.length} Soal
                                    </span>
                                </div>

                                <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                                    {urgentSoal.length > 0 ? (
                                        urgentSoal.map((soal) => {
                                            const badge = getUrgentBadge(soal);
                                            return (
                                                <div key={soal.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between hover:bg-slate-100/60 transition-colors">
                                                    <div className="min-w-0 flex-1 pr-2">
                                                        <p className="text-xs font-bold text-gray-800 truncate">
                                                            {soal.mata_kuliah?.nama_mk || 'Mata Kuliah'}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                                                            {soal.kategori?.nama || '-'} • {relativeTime(soal.created_at)}
                                                        </p>
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${badge.bg}`}>
                                                        {badge.label}
                                                    </span>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-xs text-gray-400 text-center py-6">Semua aman. Tidak ada berkas soal yang memerlukan perhatian.</p>
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

                                <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                                    {recentActivities.length > 0 ? (
                                        recentActivities.map((act) => (
                                            <div key={act.id} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/60 transition-colors">
                                                <div className="w-2 h-2 rounded-full bg-[#801720] mt-1.5 flex-shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs text-gray-700 leading-snug font-medium">{act.description || act.action}</p>
                                                    <p className="text-[10px] text-gray-400 mt-1">{act.user?.name || 'Sistem'} • {relativeTime(act.created_at)}</p>
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
                            {/* 1. Pilih Periode */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-[#801720]" />
                                    <span>Pilih Periode Verifikasi</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={selectedPeriodeId}
                                        onChange={(e) => setSelectedPeriodeId(e.target.value)}
                                        className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] transition-all cursor-pointer"
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
                                            <p className="text-[11px] text-gray-500 font-medium mt-0.5">Format resmi cetak & arsip laporan verifikasi soal</p>
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
