import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    FileText, Plus, Upload, Trash2, Send, X, AlertTriangle,
    Download, RefreshCw, CheckCircle2, Eye, Sparkles
} from 'lucide-react';
import FlashAlert from '@/Components/FlashAlert';
import { showToast, showAlert, showConfirm } from '@/Utils/sweetalert';



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


function Modal({ open, onClose, title, children }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <h2 className="text-base font-bold text-gray-800">{title}</h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-5">{children}</div>
            </div>
        </div>
    );
}

const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export default function KoordinatorSoalIndex({ soalList, assignments, kategoriAll, periodeAll, filters }) {
    const { flash, auth } = usePage().props;
    const hasNoAssignment = auth?.user?.has_no_assignment;
    const [showUpload, setShowUpload] = useState(false);
    const [showRevisi, setShowRevisi] = useState(null); // soal item
    const [deleteItem, setDeleteItem] = useState(null);
    const [submitItem, setSubmitItem] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [revisiFile, setRevisiFile] = useState(null);
    const [revisiCatatan, setRevisiCatatan] = useState('');
    const [statusFilter, setStatusFilter] = useState(filters?.status || '');

    const [form, setForm] = useState({
        mata_kuliah_id: assignments[0]?.mata_kuliah_id || '',
        periode_id: periodeAll[0]?.id || '',
        kategori_id: kategoriAll[0]?.id || '',
        judul: '',
    });

    const handleFilterStatus = (s) => {
        setStatusFilter(s);
        router.get('/koordinator/soal', { status: s }, { preserveState: true });
    };

    const handleUpload = (e) => {
        e.preventDefault();
        if (!selectedFile) return;
        setProcessing(true);
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, v));
        fd.append('file', selectedFile);
        router.post('/koordinator/soal', fd, { onFinish: () => { setProcessing(false); setShowUpload(false); setSelectedFile(null); } });
    };

    const handleSubmit = async (item = submitItem) => {
        if (!item) return;
        const result = await showConfirm({
            title: 'Submit Soal untuk Verifikasi?',
            text: `Submit "${item.judul}"? Soal akan dikirim ke verifikator. Setelah disubmit, file tidak dapat diubah sampai mendapat feedback.`,
            icon: 'question',
            confirmButtonText: 'Ya, Submit Soal',
            confirmButtonColor: '#059669',
        });
        if (result.isConfirmed) {
            router.post(`/koordinator/soal/${item.id}/submit`, {}, {
                onFinish: () => { setSubmitItem(null); },
            });
        }
    };

    const handleDelete = async (item = deleteItem) => {
        if (!item) return;
        const result = await showConfirm({
            title: 'Hapus Draft Soal?',
            text: `Apakah Anda yakin ingin menghapus draft soal "${item?.judul}"?`,
            icon: 'warning',
            confirmButtonText: 'Ya, Hapus',
            confirmButtonColor: '#CD202E',
        });
        if (result.isConfirmed) {
            router.delete(`/koordinator/soal/${item.id}`, {
                onFinish: () => { setDeleteItem(null); },
            });
        }
    };


    const handleRevisi = (e) => {
        e.preventDefault();
        if (!revisiFile) return;
        setProcessing(true);
        const fd = new FormData();
        fd.append('file', revisiFile);
        if (revisiCatatan) fd.append('catatan', revisiCatatan);
        router.post(`/koordinator/revisi/${showRevisi.id}`, fd, {
            onFinish: () => { setProcessing(false); setShowRevisi(null); setRevisiFile(null); setRevisiCatatan(''); }
        });
    };

    const STATUS_FILTERS = [
        { key: '', label: 'Semua Status' },
        { key: 'IN_REVIEW', label: 'In Review' },
        { key: 'REVISION', label: 'Revisi' },
        { key: 'APPROVED', label: 'Disetujui' },
        { key: 'REJECTED', label: 'Ditolak' },
    ];

    return (
        <AuthenticatedLayout title="Kelola Soal">
            <Head title="Kelola Soal Saya" />
            <FlashAlert flash={flash} />

            <div className="space-y-6">
                {/* No Assignment Banner */}
                {hasNoAssignment && (
                    <div className="bg-amber-500 text-white rounded-3xl p-5 sm:p-6 shadow-xl shadow-amber-500/20 flex items-start gap-4 border border-amber-400">
                        <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-0.5 text-amber-100" />
                        <div className="space-y-1">
                            <h3 className="font-extrabold text-sm uppercase tracking-wider">Akses Terbatas</h3>
                            <p className="text-xs font-semibold text-amber-50 leading-relaxed">
                                Akun Anda saat ini belum diberikan penugasan aktif (Koordinator/Verifikator). Silakan hubungi Super Admin. Upload soal tidak dapat dilakukan.
                            </p>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
                            <FileText className="w-6 h-6 text-[#801720]" /> Kelola Soal Saya
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">Upload, submit, dan pantau status soal Anda</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {hasNoAssignment ? (
                            <span
                                title="Belum ada penugasan aktif"
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-200 text-slate-400 rounded-xl text-xs font-bold cursor-not-allowed select-none opacity-70"
                            >
                                <Plus className="w-3.5 h-3.5" /> Upload Soal Baru
                            </span>
                        ) : (
                            <Link href="/koordinator/soal/create"
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#801720] text-white rounded-xl text-xs font-bold hover:bg-[#6a1219] transition-all shadow-sm cursor-pointer select-none">
                                <Plus className="w-3.5 h-3.5" /> Upload Soal Baru
                            </Link>
                        )}
                    </div>
                </div>

                {/* Status Filter Tabs */}
                <div className="flex gap-2 flex-wrap">
                    {STATUS_FILTERS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => handleFilterStatus(tab.key)}
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

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase">No</th>
                                    <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase">Judul Soal</th>
                                    <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase">Mata Kuliah</th>
                                    <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase">Kategori</th>
                                    <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase">Status</th>
                                    <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase">Catatan Verifikator</th>
                                    <th className="text-right px-5 py-3.5 text-xs font-bold text-gray-500 uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {soalList.data?.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-16">
                                            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                            <p className="text-gray-400 text-sm">Belum ada soal. Mulai upload soal pertama Anda.</p>
                                        </td>
                                    </tr>
                                ) : soalList.data?.map((soal, idx) => (
                                    <tr key={soal.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4 text-gray-500 text-xs">{(soalList.current_page - 1) * soalList.per_page + idx + 1}</td>
                                        <td className="px-5 py-4">
                                            <p className="font-semibold text-gray-800 text-xs">{soal.judul}</p>
                                            <p className="text-[10px] text-gray-400">{soal.nama_file} · {formatSize(soal.file_size)}</p>
                                        </td>
                                        <td className="px-5 py-4 text-xs text-gray-700">{soal.mata_kuliah?.nama_mk}</td>
                                        <td className="px-5 py-4 text-xs text-gray-500">{soal.kategori?.nama}</td>
                                        <td className="px-5 py-4"><StatusBadge status={soal.status} /></td>
                                        <td className="px-5 py-4">
                                            <p className="text-xs text-gray-500 max-w-[180px] line-clamp-2">
                                                {soal.latest_verifikasi?.catatan || '—'}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {/* Download */}
                                                <a href={`/koordinator/soal/download/${soal.id}`}
                                                    className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg" title="Download">
                                                    <Download className="w-3.5 h-3.5" />
                                                </a>
                                                {/* Submit (if DRAFT) */}
                                                {soal.status === 'DRAFT' && (
                                                    <button onClick={() => handleSubmit(soal)} className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg cursor-pointer" title="Submit untuk Verifikasi">
                                                        <Send className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                {/* Upload Revisi (if REVISION) */}
                                                {soal.status === 'REVISION' && (
                                                    <button onClick={() => setShowRevisi(soal)} className="p-1.5 hover:bg-amber-50 text-amber-600 rounded-lg cursor-pointer" title="Upload Revisi">
                                                        <RefreshCw className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                {/* Delete (if DRAFT) */}
                                                {soal.status === 'DRAFT' && (
                                                    <button onClick={() => handleDelete(soal)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg cursor-pointer" title="Hapus">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}

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


            {/* Submit Confirm */}
            <Modal open={!!submitItem} onClose={() => setSubmitItem(null)} title="Submit Soal untuk Verifikasi">
                <div className="flex items-start gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <Send className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-800">Submit "<span className="text-[#801720]">{submitItem?.judul}</span>"?</p>
                        <p className="text-xs text-gray-500 mt-1">Soal akan dikirim ke verifikator. Setelah disubmit, file tidak bisa diubah sampai mendapat feedback.</p>
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={() => setSubmitItem(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50">Batal</button>
                    <button onClick={handleSubmit} disabled={processing} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-60">
                        {processing ? 'Submitting...' : 'Ya, Submit'}
                    </button>
                </div>
            </Modal>

            {/* Upload Revisi Modal */}
            <Modal open={!!showRevisi} onClose={() => setShowRevisi(null)} title="Upload Revisi Soal">
                {showRevisi && (
                    <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
                        <p className="text-xs font-semibold text-amber-800">Catatan Verifikator:</p>
                        <p className="text-xs text-amber-700 mt-1">{showRevisi.latest_verifikasi?.catatan || '—'}</p>
                    </div>
                )}
                <form onSubmit={handleRevisi} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">File Revisi <span className="text-red-500">*</span></label>
                        <div className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${revisiFile ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300 hover:border-[#801720]/40'}`}
                            onClick={() => document.getElementById('revisi-file').click()}>
                            <input id="revisi-file" type="file" accept=".pdf,.doc,.docx" className="hidden"
                                onChange={e => setRevisiFile(e.target.files[0])} />
                            {revisiFile ? (
                                <p className="text-xs font-semibold text-emerald-700">✓ {revisiFile.name}</p>
                            ) : (
                                <p className="text-xs text-gray-500">Klik untuk pilih file revisi</p>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Catatan Revisi</label>
                        <textarea rows={2} value={revisiCatatan} onChange={e => setRevisiCatatan(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm resize-none focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] outline-none"
                            placeholder="Apa yang diubah dari versi sebelumnya..." />
                    </div>
                    <div className="flex justify-end pt-2">
                        <button type="submit" disabled={processing || !revisiFile}
                            className="px-5 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 disabled:opacity-60">
                            {processing ? 'Mengupload...' : 'Upload Revisi'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirm */}
            <Modal open={!!deleteItem} onClose={() => setDeleteItem(null)} title="Hapus Soal">
                <div className="flex items-start gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
                    <div>
                        <p className="text-sm font-semibold text-gray-800">Hapus soal "<span className="text-[#801720]">{deleteItem?.judul}</span>"?</p>
                        <p className="text-xs text-gray-500 mt-1">File akan dihapus permanen dari server.</p>
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={() => setDeleteItem(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50">Batal</button>
                    <button onClick={handleDelete} disabled={processing} className="px-4 py-2 text-sm bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-60">
                        {processing ? 'Menghapus...' : 'Ya, Hapus'}
                    </button>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
