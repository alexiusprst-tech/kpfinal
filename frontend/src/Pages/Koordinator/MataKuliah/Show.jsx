import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ArrowLeft, BookOpen, Target, FileText, Users, Activity as ActivityIcon,
    Download, GraduationCap, FilePlus2, Eye, Pencil, Send, X, AlertTriangle, Sparkles
} from 'lucide-react';
import FlashAlert from '@/Components/FlashAlert';
import { showToast, showAlert, showConfirm } from '@/Utils/sweetalert';

function Toast({ flash }) {
    return <FlashAlert type="toast" flash={flash} />;
}


const STATUS_CONFIG = {
    DRAFT:       { label: 'Draft',        color: 'bg-gray-100 text-gray-600',       dot: 'bg-gray-400' },
    SUBMITTED:   { label: 'Disubmit',     color: 'bg-blue-100 text-blue-700',       dot: 'bg-blue-500' },
    IN_REVIEW:   { label: 'Direview',     color: 'bg-purple-100 text-purple-700',   dot: 'bg-purple-500' },
    RESUBMITTED: { label: 'Resubmit',     color: 'bg-indigo-100 text-indigo-700',   dot: 'bg-indigo-500' },
    APPROVED:    { label: 'Disetujui',    color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
    REVISION:    { label: 'Perlu Revisi', color: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-400' },
    REJECTED:    { label: 'Ditolak',      color: 'bg-red-100 text-red-600',         dot: 'bg-red-400' },
};

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${cfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

function ProgressBar({ percent, colorClass = 'bg-emerald-500' }) {
    const p = Math.max(0, Math.min(100, percent));
    return (
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full ${colorClass} rounded-full transition-all`} style={{ width: `${p}%` }} />
        </div>
    );
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

const TABS = [
    { key: 'soal',        label: 'Soal',        icon: FileText },
    { key: 'clo-plo',     label: 'CLO / PLO',    icon: Target },
    { key: 'verifikator', label: 'Verifikator', icon: Users },
    { key: 'aktivitas',   label: 'Aktivitas',   icon: ActivityIcon },
];

function SoalActions({ soal, onSubmit }) {
    const base = 'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors';
    switch (soal.status) {
        case 'DRAFT':
            return (
                <div className="flex items-center justify-end gap-1.5">
                    <Link href={`/koordinator/soal/${soal.id}/edit`} className={`${base} bg-gray-100 text-gray-700 hover:bg-gray-200`}>
                        <Pencil className="w-3 h-3" /> Edit
                    </Link>
                    <button onClick={() => onSubmit(soal)} className={`${base} bg-[#801720] text-white hover:bg-[#6a1219]`}>
                        <Send className="w-3 h-3" /> Submit
                    </button>
                </div>
            );
        case 'REVISION':
            return (
                <div className="flex items-center justify-end gap-1.5">
                    <Link href={`/koordinator/soal/${soal.id}`} className={`${base} bg-amber-100 text-amber-700 hover:bg-amber-200`}>
                        <Eye className="w-3 h-3" /> Lihat Revisi
                    </Link>
                    <Link href={`/koordinator/soal/${soal.id}/edit`} className={`${base} bg-[#801720] text-white hover:bg-[#6a1219]`}>
                        <Pencil className="w-3 h-3" /> Edit &amp; Submit Ulang
                    </Link>
                </div>
            );
        default:
            return (
                <div className="flex items-center justify-end">
                    <Link href={`/koordinator/soal/${soal.id}`} className={`${base} bg-gray-100 text-gray-700 hover:bg-gray-200`}>
                        <Eye className="w-3 h-3" /> Lihat
                    </Link>
                </div>
            );
    }
}

export default function MataKuliahShow({ mataKuliah, dosenPengampu, periode, stats, soalList, verifikators, activity, uploadOpen }) {
    const { flash } = usePage().props;
    const [tab, setTab] = useState('soal');
    const [confirmSoal, setConfirmSoal] = useState(null);

    const handleSubmit = async (soal = confirmSoal) => {
        if (!soal) return;
        const result = await showConfirm({
            title: 'Submit Soal untuk Verifikasi?',
            text: `Submit "${soal.judul}"? Soal akan dikirim ke verifikator untuk diperiksa.`,
            icon: 'question',
            confirmButtonText: 'Ya, Submit Soal',
            confirmButtonColor: '#059669',
        });
        if (result.isConfirmed) {
            router.post(`/koordinator/soal/${soal.id}/submit`, {}, {
                preserveScroll: true,
                onFinish: () => setConfirmSoal(null),
            });
        }
    };


    return (
        <AuthenticatedLayout title={mataKuliah.nama_mk}>
            <Head title={mataKuliah.nama_mk} />
            <Toast flash={flash} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Link href="/koordinator/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#801720]">
                        <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Dashboard
                    </Link>
                    <div className="flex items-center gap-2">
                        {uploadOpen && (
                            <Link href={`/koordinator/soal/create?mata_kuliah_id=${mataKuliah.id}&tab=generator`}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-sm transition-all duration-200">
                                <Sparkles className="w-3.5 h-3.5" /> Generator Lembar Soal
                            </Link>
                        )}
                        {uploadOpen ? (
                            <Link href={`/koordinator/soal/create?mata_kuliah_id=${mataKuliah.id}`}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#801720] text-white rounded-xl text-xs font-semibold hover:bg-[#6a1219] shadow-sm transition-all duration-200">
                                <FilePlus2 className="w-3.5 h-3.5" /> Upload Soal
                            </Link>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 text-gray-400 rounded-xl text-xs font-semibold cursor-not-allowed" title="Periode verifikasi tidak aktif atau deadline sudah lewat">
                                <FilePlus2 className="w-3.5 h-3.5" /> Upload Soal
                            </span>
                        )}
                    </div>
                </div>

                {/* Informasi Mata Kuliah */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                            <h1 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-[#801720]" /> {mataKuliah.nama_mk}
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {mataKuliah.kode_mk} · Semester {mataKuliah.semester} · {mataKuliah.sks} SKS
                                {periode && <> · Periode {periode.nama}</>}
                            </p>
                            <p className="text-sm text-gray-600 mt-2 flex items-center gap-1.5">
                                <GraduationCap className="w-4 h-4 text-gray-400" /> Dosen Pengampu: <strong>{dosenPengampu || '-'}</strong>
                            </p>
                        </div>
                        <div className="w-full md:w-64">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold text-gray-500">Progress Verifikasi</span>
                                <span className="text-sm font-extrabold text-[#801720]">{stats.progress}%</span>
                            </div>
                            <ProgressBar percent={stats.progress} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-6">
                        {[
                            ['Total', stats.total, 'text-gray-700'],
                            ['Draft', stats.draft, 'text-gray-500'],
                            ['Submitted', stats.submitted, 'text-blue-600'],
                            ['In Review', stats.in_review, 'text-purple-600'],
                            ['Revision', stats.revision, 'text-amber-600'],
                            ['Approved', stats.approved, 'text-emerald-600'],
                            ['Rejected', stats.rejected, 'text-red-500'],
                        ].map(([label, value, color]) => (
                            <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                                <p className={`text-xl font-extrabold ${color}`}>{value}</p>
                                <p className="text-[10px] text-gray-500 font-semibold mt-0.5">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex border-b border-gray-100 overflow-x-auto">
                        {TABS.map(t => {
                            const Icon = t.icon;
                            const active = tab === t.key;
                            return (
                                <button key={t.key} onClick={() => setTab(t.key)}
                                    className={`flex items-center gap-1.5 px-5 py-3.5 text-xs font-bold whitespace-nowrap border-b-2 transition-colors ${
                                        active ? 'border-[#801720] text-[#801720]' : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}>
                                    <Icon className="w-3.5 h-3.5" /> {t.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="p-5">
                        {tab === 'soal' && (
                            soalList.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-10">Belum ada soal yang diunggah untuk mata kuliah ini.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 border-b border-gray-100">
                                            <tr>
                                                <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase">No</th>
                                                <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase">Judul / File</th>
                                                <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase">Status</th>
                                                <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase">Verifikator</th>
                                                <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase">Diupload</th>
                                                <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase">Diperbarui</th>
                                                <th className="text-right px-4 py-3 text-[11px] font-bold text-gray-500 uppercase">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {soalList.map((soal, idx) => (
                                                <tr key={soal.id} className="hover:bg-gray-50/50">
                                                    <td className="px-4 py-3 text-xs text-gray-500">{idx + 1}</td>
                                                    <td className="px-4 py-3">
                                                        <p className="text-xs font-semibold text-gray-800">{soal.judul}</p>
                                                        <p className="text-[10px] text-gray-400">{soal.kategori?.nama || '-'} · {soal.nama_file}</p>
                                                    </td>
                                                    <td className="px-4 py-3"><StatusBadge status={soal.status} /></td>
                                                    <td className="px-4 py-3 text-xs text-gray-600">{soal.latest_verifikasi?.verifikator?.name || '-'}</td>
                                                    <td className="px-4 py-3 text-xs text-gray-400">{relativeTime(soal.created_at)}</td>
                                                    <td className="px-4 py-3 text-xs text-gray-400">{relativeTime(soal.updated_at)}</td>
                                                    <td className="px-4 py-3">
                                                        <SoalActions soal={soal} onSubmit={handleSubmit} />
                                                    </td>

                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        )}

                        {tab === 'clo-plo' && (
                            (!mataKuliah.clo || mataKuliah.clo.length === 0) ? (
                                <p className="text-sm text-gray-400 text-center py-10">Belum ada CLO yang terpetakan untuk mata kuliah ini.</p>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-4">
                                    {mataKuliah.clo.map(clo => (
                                        <div key={clo.id} className="border border-gray-100 rounded-xl p-4">
                                            <p className="text-sm font-bold text-gray-800">{clo.kode_clo}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{clo.deskripsi}</p>
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {clo.plo.map(plo => (
                                                    <span key={plo.id} className="px-2 py-0.5 rounded-full bg-[#801720]/10 text-[#801720] text-[10px] font-bold">{plo.kode_plo}</span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}

                        {tab === 'verifikator' && (
                            verifikators.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-10">Belum ada verifikator yang ditugaskan.</p>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-3">
                                    {verifikators.map(v => (
                                        <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                                            <div className="w-9 h-9 rounded-lg bg-[#801720]/10 flex items-center justify-center flex-shrink-0 text-[#801720] font-bold text-xs">
                                                {v.nama ? v.nama.substring(0, 2).toUpperCase() : 'VF'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-gray-800 truncate">{v.nama}</p>
                                                <p className="text-[10px] text-gray-400">{v.kode_dosen}</p>
                                            </div>
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Aktif
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}

                        {tab === 'aktivitas' && (
                            activity.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-10">Belum ada aktivitas.</p>
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
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* Confirm Submit Modal */}
            {confirmSoal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mb-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                        </div>
                        <h3 className="font-bold text-gray-800">Submit soal ini?</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            "{confirmSoal.judul}" akan dikirim untuk verifikasi dan tidak dapat diedit lagi sampai ada keputusan dari verifikator.
                        </p>
                        <div className="flex gap-2 mt-5">
                            <button onClick={() => setConfirmSoal(null)}
                                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">
                                Batal
                            </button>
                            <button onClick={handleSubmit}
                                className="flex-1 px-4 py-2 rounded-xl bg-[#801720] text-white text-sm font-semibold hover:bg-[#6a1219]">
                                Ya, Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
