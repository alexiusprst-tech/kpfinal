import React, { useState, useMemo } from 'react';
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
    BELUM_UPLOAD: { label: 'Belum Upload', color: 'bg-slate-100 text-slate-700 border border-slate-200', dot: 'bg-slate-400' },
    IN_REVIEW:   { label: 'In Review', color: 'bg-purple-100 text-purple-700 border border-purple-200', dot: 'bg-purple-500' },
    SUBMITTED:   { label: 'In Review', color: 'bg-purple-100 text-purple-700 border border-purple-200', dot: 'bg-purple-500' },
    RESUBMITTED: { label: 'In Review', color: 'bg-purple-100 text-purple-700 border border-purple-200', dot: 'bg-purple-500' },
    DRAFT:       { label: 'In Review', color: 'bg-purple-100 text-purple-700 border border-purple-200', dot: 'bg-purple-500' },
    REVISION:    { label: 'Revisi',    color: 'bg-amber-100 text-amber-700 border border-amber-200',   dot: 'bg-amber-400' },
    APPROVED:    { label: 'Disetujui', color: 'bg-emerald-100 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500' },
    REJECTED:    { label: 'Ditolak',   color: 'bg-red-100 text-red-600 border border-red-200',         dot: 'bg-red-400' },
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
    { key: 'soal',      label: 'Soal',      icon: FileText },
    { key: 'plo-clo',   label: 'PLO / CLO', icon: Target },
    { key: 'aktivitas', label: 'Aktivitas', icon: ActivityIcon },
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

export default function MataKuliahShow({ mataKuliah, dosenPengampu, periode, stats, soalList, verifikators, activity, uploadOpen, hasActiveSoal, activeSoalStatus }) {
    const { flash } = usePage().props;
    const [tab, setTab] = useState('soal');
    const [confirmSoal, setConfirmSoal] = useState(null);

    const ploGroups = useMemo(() => {
        const plosMap = new Map();

        // From direct mataKuliah.plo
        if (mataKuliah.plo && Array.isArray(mataKuliah.plo)) {
            mataKuliah.plo.forEach(p => {
                plosMap.set(p.id, {
                    id: p.id,
                    kode_plo: p.kode_plo,
                    deskripsi: p.deskripsi,
                    clos: [],
                });
            });
        }

        // Map CLOs to their respective PLOs
        if (mataKuliah.clo && Array.isArray(mataKuliah.clo)) {
            mataKuliah.clo.forEach(clo => {
                if (clo.plo && Array.isArray(clo.plo) && clo.plo.length > 0) {
                    clo.plo.forEach(p => {
                        if (!plosMap.has(p.id)) {
                            plosMap.set(p.id, {
                                id: p.id,
                                kode_plo: p.kode_plo,
                                deskripsi: p.deskripsi,
                                clos: [],
                            });
                        }
                        const group = plosMap.get(p.id);
                        if (!group.clos.some(c => c.id === clo.id)) {
                            group.clos.push(clo);
                        }
                    });
                }
            });
        }

        const sorted = Array.from(plosMap.values()).sort((a, b) => 
            (a.kode_plo || '').localeCompare(b.kode_plo || '', undefined, { numeric: true })
        );

        sorted.forEach(g => {
            g.clos.sort((a, b) => (a.kode_clo || '').localeCompare(b.kode_clo || '', undefined, { numeric: true }));
        });

        return sorted;
    }, [mataKuliah]);

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
                        {(() => {
                            const canUpload = uploadOpen && !hasActiveSoal;
                            const statusLabels = {
                                DRAFT: 'Draft',
                                SUBMITTED: 'menunggu verifikasi',
                                IN_REVIEW: 'sedang diverifikasi',
                                RESUBMITTED: 'menunggu verifikasi ulang',
                                REVISION: 'perlu revisi',
                            };
                            const statusLabel = statusLabels[activeSoalStatus] || 'diproses';

                            if (canUpload) {
                                return (
                                    <Link
                                        href={`/koordinator/soal/create?mata_kuliah_id=${mataKuliah.id}`}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#801720] text-white rounded-xl text-xs font-semibold hover:bg-[#6a1219] shadow-sm transition-all duration-200"
                                    >
                                        <FilePlus2 className="w-3.5 h-3.5" /> Upload Soal
                                    </Link>
                                );
                            }

                            const tooltipText = !uploadOpen
                                ? 'Periode verifikasi tidak aktif atau deadline sudah lewat'
                                : `Soal Anda sedang ${statusLabel}. Tunggu keputusan verifikator sebelum mengunggah soal baru.`;

                            return (
                                <span
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 text-gray-400 rounded-xl text-xs font-semibold cursor-not-allowed select-none"
                                    title={tooltipText}
                                >
                                    <FilePlus2 className="w-3.5 h-3.5" /> Upload Soal
                                </span>
                            );
                        })()}
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
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl">
                            <span className="text-xs font-semibold text-gray-500">Status Soal:</span>
                            <StatusBadge status={stats.status} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                        {[
                            ['In Review', stats.in_review, 'text-purple-600 bg-purple-50/60 border-purple-100'],
                            ['Perlu Revisi', stats.revision, 'text-amber-600 bg-amber-50/60 border-amber-100'],
                            ['Disetujui', stats.approved, 'text-emerald-600 bg-emerald-50/60 border-emerald-100'],
                            ['Ditolak', stats.rejected, 'text-red-600 bg-red-50/60 border-red-100'],
                        ].map(([label, value, color]) => (
                            <div key={label} className={`rounded-xl p-3 text-center border ${color}`}>
                                <p className="text-xl font-extrabold">{value}</p>
                                <p className="text-[10px] font-semibold mt-0.5">{label}</p>
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

                        {tab === 'plo-clo' && (
                            ploGroups.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-10">Belum ada pemetaan PLO &amp; CLO untuk mata kuliah ini.</p>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-4">
                                    {ploGroups.map(plo => (
                                        <div key={plo.id} className="border border-gray-100 rounded-2xl p-5 bg-slate-50/50 hover:bg-white hover:border-[#801720]/20 transition-all space-y-3.5 shadow-xs">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span className="px-2.5 py-0.5 rounded-full bg-[#801720]/10 text-[#801720] text-xs font-black border border-[#801720]/20">
                                                        {plo.kode_plo}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-bold text-gray-800 leading-snug">
                                                    {plo.deskripsi || '-'}
                                                </p>
                                            </div>

                                            <div className="pt-2.5 border-t border-gray-100/80 space-y-2">
                                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                                                    Target CLO Terkait ({plo.clos.length})
                                                </span>
                                                {plo.clos.length === 0 ? (
                                                    <p className="text-[11px] text-gray-400 italic">Belum ada CLO yang dihubungkan ke PLO ini.</p>
                                                ) : (
                                                    <div className="space-y-1.5">
                                                        {plo.clos.map(clo => (
                                                            <div key={clo.id} className="p-2.5 rounded-xl bg-white border border-gray-200/70 text-xs space-y-1">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <span className="font-extrabold text-slate-800 text-[11px]">{clo.kode_clo}</span>
                                                                    {clo.bloom && (
                                                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                                                                            Bloom: {clo.bloom}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-[11px] text-gray-600 leading-relaxed">{clo.deskripsi}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
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
