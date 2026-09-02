import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FileCheck, Download, Eye, ArrowRight, X } from 'lucide-react';

const STATUS_CONFIG = {
    IN_REVIEW:   { label: 'In Review', color: 'bg-purple-100 text-purple-700',  dot: 'bg-purple-500' },
    SUBMITTED:   { label: 'In Review', color: 'bg-purple-100 text-purple-700',  dot: 'bg-purple-500' },
    RESUBMITTED: { label: 'In Review', color: 'bg-purple-100 text-purple-700',  dot: 'bg-purple-500' },
    DRAFT:       { label: 'In Review', color: 'bg-purple-100 text-purple-700',  dot: 'bg-purple-500' },
    REVISION:    { label: 'Revisi',    color: 'bg-amber-100 text-amber-700',    dot: 'bg-amber-400' },
    APPROVED:    { label: 'Disetujui', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
    REJECTED:    { label: 'Ditolak',   color: 'bg-red-100 text-red-600',        dot: 'bg-red-400' },
};

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.IN_REVIEW;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${cfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

import FlashAlert from '@/Components/FlashAlert';


const STATUS_FILTERS = [
    { key: '', label: 'Semua Status' },
    { key: 'IN_REVIEW', label: 'In Review' },
    { key: 'REVISION', label: 'Revisi' },
    { key: 'APPROVED', label: 'Disetujui' },
    { key: 'REJECTED', label: 'Ditolak' },
];

export default function VerifikatorSoalIndex({ soalList, filters }) {
    const { flash } = usePage().props;
    const [statusFilter, setStatusFilter] = useState(filters?.status || '');

    const handleFilter = (s) => {
        setStatusFilter(s);
        router.get('/verifikator/soal', { status: s }, { preserveState: true });
    };

    return (
        <AuthenticatedLayout title="Verifikasi Soal">
            <Head title="Verifikasi Soal" />
            <FlashAlert flash={flash} />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
                        <FileCheck className="w-6 h-6 text-[#801720]" /> Verifikasi Soal
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Review dan berikan keputusan verifikasi pada soal yang masuk</p>
                </div>

                {/* Status Filter */}
                <div className="flex gap-2 flex-wrap">
                    {STATUS_FILTERS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => handleFilter(tab.key)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                (statusFilter === tab.key) || (!statusFilter && tab.key === '')
                                    ? 'bg-[#801720] text-white border-[#801720] shadow-xs'
                                    : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase">No</th>
                                    <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase">Judul Soal</th>
                                    <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase">Mata Kuliah</th>
                                    <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase">Diunggah oleh</th>
                                    <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase">Status</th>
                                    <th className="text-right px-5 py-3.5 text-xs font-bold text-gray-500 uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {soalList.data?.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-16">
                                            <FileCheck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                            <p className="text-gray-400 text-sm">Tidak ada soal untuk ditampilkan</p>
                                        </td>
                                    </tr>
                                ) : soalList.data?.map((soal, idx) => (
                                    <tr key={soal.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4 text-gray-500 text-xs">{(soalList.current_page - 1) * soalList.per_page + idx + 1}</td>
                                        <td className="px-5 py-4">
                                            <p className="font-semibold text-gray-800 text-xs">{soal.judul}</p>
                                            <p className="text-[10px] text-gray-400">{soal.kategori?.nama}</p>
                                        </td>
                                        <td className="px-5 py-4 text-xs text-gray-700">{soal.mata_kuliah?.nama_mk}</td>
                                        <td className="px-5 py-4 text-xs text-gray-600">{soal.uploaded_by?.name}</td>
                                        <td className="px-5 py-4"><StatusBadge status={soal.status} /></td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <a href={`/verifikator/soal/${soal.id}/download`}
                                                    className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg" title="Download">
                                                    <Download className="w-3.5 h-3.5" />
                                                </a>
                                                <a href={`/verifikator/soal/${soal.id}`}
                                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-[#801720] text-white rounded-lg text-xs font-semibold hover:bg-[#6a1219] transition-colors">
                                                    <Eye className="w-3 h-3" /> Review
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {soalList.last_page > 1 && (
                        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                            <span>Menampilkan {soalList.from}–{soalList.to} dari {soalList.total} data</span>
                            <div className="flex gap-1">
                                {soalList.links?.map((link, i) => (
                                    <button key={i} disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                        className={`px-2.5 py-1 rounded-lg font-semibold ${link.active ? 'bg-[#801720] text-white' : 'hover:bg-gray-100 text-gray-600 disabled:opacity-40'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
