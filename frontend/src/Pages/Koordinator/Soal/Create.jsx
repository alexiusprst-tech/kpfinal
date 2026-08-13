import React, { useRef, useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ArrowLeft, UploadCloud, FileText, X, CheckCircle2, AlertTriangle, XCircle,
} from 'lucide-react';

const ALLOWED_EXT = ['pdf', 'doc', 'docx'];
const MAX_SIZE_MB = 20;

function formatSize(bytes) {
    if (!bytes) return '0 KB';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

function Toast({ flash }) {
    const [visible, setVisible] = useState(true);
    if (!visible || (!flash?.success && !flash?.error)) return null;
    return (
        <div className={`fixed top-5 right-5 z-50 flex items-start gap-3 p-4 rounded-xl shadow-xl text-white text-sm max-w-sm ${flash.success ? 'bg-emerald-600' : 'bg-red-600'}`}>
            <span className="flex-1">{flash.success || flash.error}</span>
            <button onClick={() => setVisible(false)}><X className="w-4 h-4" /></button>
        </div>
    );
}

export default function SoalCreate({ assignments, kategoriAll, activePeriode, selectedMataKuliahId, uploadOpen }) {
    const { flash } = usePage().props;
    const [step, setStep] = useState('form');
    const [clientError, setClientError] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    const { data, setData, post, processing, errors } = useForm({
        mata_kuliah_id: selectedMataKuliahId || (assignments[0]?.id ?? ''),
        periode_id: activePeriode?.id || '',
        kategori_id: '',
        judul: '',
        file: null,
        submit_now: true,
    });

    const selectedMk = assignments.find(a => a.id === data.mata_kuliah_id);

    const validateFile = (file) => {
        const ext = file.name.split('.').pop().toLowerCase();
        if (!ALLOWED_EXT.includes(ext)) {
            return 'Format file harus PDF atau DOCX.';
        }
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            return `Ukuran file maksimal ${MAX_SIZE_MB} MB.`;
        }
        return null;
    };

    const handleFile = (file) => {
        if (!file) return;
        const err = validateFile(file);
        if (err) {
            setClientError(err);
            return;
        }
        setClientError('');
        setData('file', file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        handleFile(e.dataTransfer.files?.[0]);
    };

    const goToPreview = () => {
        if (!data.mata_kuliah_id) return setClientError('Pilih mata kuliah terlebih dahulu.');
        if (!data.kategori_id) return setClientError('Pilih kategori soal terlebih dahulu.');
        if (!data.judul.trim()) return setClientError('Judul soal wajib diisi.');
        if (!data.file) return setClientError('File soal wajib diunggah.');
        setClientError('');
        setStep('preview');
    };

    const submitSoal = () => {
        post('/koordinator/soal', { forceFormData: true });
    };

    if (!uploadOpen) {
        return (
            <AuthenticatedLayout title="Upload Soal">
                <Head title="Upload Soal" />
                <div className="max-w-lg mx-auto mt-10 bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                    <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                    <h1 className="font-bold text-gray-800">Upload Soal Tidak Tersedia</h1>
                    <p className="text-sm text-gray-500 mt-2">
                        Periode verifikasi tidak sedang aktif atau deadline upload sudah lewat. Hubungi Super Admin jika Anda memerlukan perpanjangan.
                    </p>
                    <Link href="/koordinator/dashboard" className="inline-flex items-center gap-1.5 mt-5 px-4 py-2 bg-[#801720] text-white rounded-xl text-xs font-semibold hover:bg-[#6a1219]">
                        <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Dashboard
                    </Link>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout title="Upload Soal">
            <Head title="Upload Soal" />
            <Toast flash={flash} />

            <div className="max-w-2xl mx-auto space-y-6">
                <Link href={selectedMk ? `/koordinator/mata-kuliah/${selectedMk.id}` : '/koordinator/dashboard'}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#801720]">
                    <ArrowLeft className="w-3.5 h-3.5" /> Kembali
                </Link>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h1 className="text-xl font-extrabold text-gray-800">
                        {step === 'form' ? 'Upload Soal' : 'Preview Soal'}
                    </h1>

                    {step === 'form' && (
                        <div className="mt-5 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Mata Kuliah</label>
                                <select
                                    value={data.mata_kuliah_id}
                                    onChange={e => setData('mata_kuliah_id', e.target.value)}
                                    className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#801720]/20"
                                >
                                    {assignments.map(a => (
                                        <option key={a.id} value={a.id}>{a.kode_mk} — {a.nama_mk}</option>
                                    ))}
                                </select>
                                {errors.mata_kuliah_id && <p className="text-xs text-red-600 mt-1">{errors.mata_kuliah_id}</p>}
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Periode</label>
                                <p className="mt-1.5 text-sm text-gray-700 font-semibold">{activePeriode?.nama || '-'}</p>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Kategori Soal</label>
                                <select
                                    value={data.kategori_id}
                                    onChange={e => setData('kategori_id', e.target.value)}
                                    className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#801720]/20"
                                >
                                    <option value="">Pilih kategori...</option>
                                    {kategoriAll.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                                </select>
                                {errors.kategori_id && <p className="text-xs text-red-600 mt-1">{errors.kategori_id}</p>}
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Judul Soal</label>
                                <input
                                    type="text"
                                    value={data.judul}
                                    onChange={e => setData('judul', e.target.value)}
                                    placeholder="Contoh: Soal UTS Algoritma dan Pemrograman"
                                    className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#801720]/20"
                                />
                                {errors.judul && <p className="text-xs text-red-600 mt-1">{errors.judul}</p>}
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Upload File</label>
                                <div
                                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`mt-1 border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
                                        dragOver ? 'border-[#801720] bg-[#801720]/5' : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
                                        onChange={e => handleFile(e.target.files?.[0])} />
                                    {data.file ? (
                                        <div className="flex items-center justify-center gap-3">
                                            <FileText className="w-8 h-8 text-[#801720]" />
                                            <div className="text-left">
                                                <p className="text-sm font-semibold text-gray-800">{data.file.name}</p>
                                                <p className="text-xs text-gray-400">{formatSize(data.file.size)}</p>
                                            </div>
                                            <button type="button" onClick={(e) => { e.stopPropagation(); setData('file', null); }}
                                                className="p-1 rounded-full hover:bg-gray-100">
                                                <X className="w-4 h-4 text-gray-400" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <UploadCloud className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                            <p className="text-sm font-semibold text-gray-600">Drag &amp; Drop File atau pilih file</p>
                                            <p className="text-xs text-gray-400 mt-1">PDF / DOCX, maksimal {MAX_SIZE_MB} MB</p>
                                        </>
                                    )}
                                </div>
                                {errors.file && <p className="text-xs text-red-600 mt-1">{errors.file}</p>}
                            </div>

                            {clientError && (
                                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> {clientError}
                                </div>
                            )}

                            <div className="flex gap-2 pt-2">
                                <Link href={selectedMk ? `/koordinator/mata-kuliah/${selectedMk.id}` : '/koordinator/dashboard'}
                                    className="flex-1 text-center px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">
                                    Batal
                                </Link>
                                <button type="button" onClick={goToPreview}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#801720] text-white text-sm font-semibold hover:bg-[#6a1219]">
                                    Preview
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'preview' && (
                        <div className="mt-5 space-y-4">
                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                                <FileText className="w-8 h-8 text-[#801720] flex-shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 truncate">{data.file?.name}</p>
                                    <p className="text-xs text-gray-400">{formatSize(data.file?.size)}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Status Validasi</p>
                                <div className="space-y-1.5">
                                    {[
                                        'Format file valid',
                                        'Mata kuliah valid',
                                        'Periode aktif',
                                        'Deadline belum lewat',
                                        'File berhasil dibaca',
                                    ].map(check => (
                                        <div key={check} className="flex items-center gap-2 text-sm text-gray-600">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {check}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Mata Kuliah</p>
                                    <p className="text-gray-700 font-semibold">{selectedMk?.nama_mk}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Kategori</p>
                                    <p className="text-gray-700 font-semibold">{kategoriAll.find(k => k.id === data.kategori_id)?.nama}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Judul</p>
                                    <p className="text-gray-700 font-semibold">{data.judul}</p>
                                </div>
                            </div>

                            <p className="text-xs text-gray-400">
                                Soal akan langsung disubmit untuk verifikasi setelah Anda menekan "Submit Soal".
                            </p>

                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setStep('form')}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">
                                    Kembali
                                </button>
                                <button type="button" onClick={submitSoal} disabled={processing}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#801720] text-white text-sm font-semibold hover:bg-[#6a1219] disabled:opacity-50">
                                    {processing ? 'Mengirim...' : 'Submit Soal'}
                                </button>
                            </div>

                            {errors.file && (
                                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                                    <XCircle className="w-3.5 h-3.5 flex-shrink-0" /> {errors.file}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
