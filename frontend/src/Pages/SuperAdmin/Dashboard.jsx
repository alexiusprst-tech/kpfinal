import React from 'react';
import AuthenticatedLayout from '../../Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
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
    Plus,
    Upload,
    UserPlus,
    Settings,
    Bell,
    FileDown,
    ArrowUpRight,
    TrendingUp
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Dashboard({
    activePeriod,
    totalDosen = 128,
    totalMataKuliah = 86,
    totalPlo = 24,
    totalClo = 126,
    totalBankSoal = 1245,
    progressPct = 54,
    statusCounts = { SUBMITTED: 312, REVISION: 189, APPROVED: 672, REJECTED: 72 },
    recentActivities = [],
    urgentSoal = []
}) {
    // Chart data for "Tren Verifikasi Soal"
    const chartData = {
        labels: ['20 Mei', '25 Mei', '30 Mei', '04 Jun', '09 Jun', '14 Jun', '17 Jun'],
        datasets: [
            {
                label: 'Menunggu',
                data: [45, 60, 75, 50, 65, 80, 95],
                backgroundColor: '#F97316',
                borderRadius: 6,
            },
            {
                label: 'Disetujui',
                data: [80, 95, 110, 130, 150, 175, 210],
                backgroundColor: '#10B981',
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
                    <button className="relative p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors text-slate-700">
                        <Bell className="w-5 h-5" />
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white">
                            3
                        </span>
                    </button>

                    {/* Generate Laporan Button */}
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-[#1E293B] hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer">
                        <FileDown className="w-4 h-4" />
                        <span>Generate Laporan</span>
                    </button>
                </div>
            </div>

            {/* QUICK ACTION BUTTONS ROW */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 mb-6">
                <button className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#1E293B] shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all flex-shrink-0 cursor-pointer">
                    <Plus className="w-4 h-4 text-[#CD202E]" />
                    <span>+ Tambah Dosen</span>
                </button>
                <button className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#1E293B] shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all flex-shrink-0 cursor-pointer">
                    <Upload className="w-4 h-4 text-blue-600" />
                    <span>Import Data</span>
                </button>
                <button className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#1E293B] shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all flex-shrink-0 cursor-pointer">
                    <UserPlus className="w-4 h-4 text-emerald-600" />
                    <span>Tetapkan Penugasan</span>
                </button>
                <button className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#1E293B] shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all flex-shrink-0 cursor-pointer">
                    <Settings className="w-4 h-4 text-purple-600" />
                    <span>Pengaturan Periode</span>
                </button>
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
                            <span className="px-3 py-1 rounded-lg bg-slate-100 border border-slate-200">Mei - Juni 2026</span>
                        </div>
                    </div>

                    <div className="h-72 w-full">
                        <Bar data={chartData} options={chartOptions} />
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
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-[#1E293B]">Sistem Informasi (UTS)</p>
                                    <p className="text-[10px] text-slate-500 font-semibold">Menunggu Verifikasi &bull; 2 hari lalu</p>
                                </div>
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">Priority</span>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-[#1E293B]">Pemrograman Web</p>
                                    <p className="text-[10px] text-slate-500 font-semibold">Revisi Diajukan &bull; Kemarin</p>
                                </div>
                                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">Review</span>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-[#1E293B]">Basis Data (UAS)</p>
                                    <p className="text-[10px] text-slate-500 font-semibold">Mendekati Deadline Upload</p>
                                </div>
                                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">Urgent</span>
                            </div>
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
        </AuthenticatedLayout>
    );
}
