import React, { useRef, useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ArrowLeft, UploadCloud, FileText, X, AlertTriangle, User, CheckCircle2, Send,
} from 'lucide-react';

const ALLOWED_EXT = ['pdf', 'doc', 'docx'];
const MAX_SIZE_MB = 20;

function formatSize(bytes) {
    if (!bytes) return '0 KB';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

import FlashAlert from '@/Components/FlashAlert';
import { showToast, showAlert, showConfirm } from '@/Utils/sweetalert';

function Toast({ flash }) {
    return <FlashAlert type="toast" flash={flash} />;
}


export default function SoalRevisi({ soal, catatan, verifikator }) {
    const { flash } = usePage().props;
    const [step, setStep] = useState('form');
    const [clientError, setClientError] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    const { data, setData, post, processing, errors } = useForm({
        file: null,
        catatan: '',
    });

    const handleFile = (file) => {
        if (!file) return;
        const ext = file.name.split('.').pop().toLowerCase();
        if (!ALLOWED_EXT.includes(ext)) {
            setClientError('Format file harus PDF atau DOCX.');
            return;
        }
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            setClientError(`Ukuran file maksimal ${MAX_SIZE_MB} MB.`);
            return;
        }
        setClientError('');
        setData('file', file);
    };

    const goToPreview = () => {
        if (!data.file) return setClientError('Unggah file revisi terlebih dahulu.');
        setClientError('');
        setStep('preview');
    };

    const submitUlang = async () => {
        const result = await showConfirm({
            title: 'Submit Ulang Perbaikan?',
            text: 'File revisi akan dikirimkan kembali ke verifikator untuk diperiksa ulang.',
            icon: 'question',
            confirmButtonText: 'Ya, Submit Ulang',
            confirmButtonColor: '#059669',
        });
        if (result.isConfirmed) {
            post(`/koordinator/revisi/${soal.id}`, { forceFormData: true });
        }
    };


    return (
        <AuthenticatedLayout title="Perbaiki Soal">
            <Head title="Perbaiki Soal" />
            <Toast flash={flash} />

            <div className="max-w-2xl mx-auto space-y-6">
                <Link href={`/koordinator/soal/${soal.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#801720]">
                    <ArrowLeft className="w-3.5 h-3.5" /> Kembali
                </Link>

                {/* Revision reason */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                    <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
                        <AlertTriangle className="w-4 h-4" /> PERLU REVISI
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Soal: <strong className="text-gray-700">{soal.judul}</strong></p>
                    <p className="mt-3 text-sm text-gray-700 bg-white rounded-lg p-3 border border-amber-100">
                        "{catatan || 'Tidak ada catatan tambahan.'}"
                    </p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h1 className="text-xl font-extrabold text-gray-800">
                        {step === 'form' ? 'Unggah Perbaikan' : 'Preview Revisi'}
                    </h1>

                    {step === 'form' && (
                        <div className="mt-5 space-y-4">
                            <div
                                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); }}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
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
                                        <p className="text-sm font-semibold text-gray-600">Drag &amp; Drop File Perbaikan atau pilih file</p>
                                        <p className="text-xs text-gray-400 mt-1">PDF / DOCX, maksimal {MAX_SIZE_MB} MB</p>
                                    </>
                                )}
                            </div>
                            {errors.file && <p className="text-xs text-red-600 mt-1">{errors.file}</p>}

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Catatan Perbaikan (opsional)</label>
                                <textarea
                                    value={data.catatan}
                                    onChange={e => setData('catatan', e.target.value)}
                                    rows={3}
                                    placeholder="Jelaskan perbaikan yang telah dilakukan..."
                                    className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#801720]/20"
                                />
                            </div>

                            {clientError && (
                                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> {clientError}
                                </div>
                            )}

                            <div className="flex gap-2 pt-2">
                                <Link href={`/koordinator/soal/${soal.id}`}
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

                            <div className="space-y-1.5">
                                {['Format file valid', 'File berhasil dibaca'].map(check => (
                                    <div key={check} className="flex items-center gap-2 text-sm text-gray-600">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {check}
                                    </div>
                                ))}
                            </div>

                            {data.catatan && (
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Catatan Perbaikan</p>
                                    <p className="text-sm text-gray-700">{data.catatan}</p>
                                </div>
                            )}

                            <p className="text-xs text-gray-400">
                                Soal akan berstatus RESUBMITTED dan dikirim kembali ke verifikator setelah Anda menekan "Submit Ulang".
                            </p>

                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setStep('form')}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">
                                    Kembali
                                </button>
                                <button type="button" onClick={submitUlang} disabled={processing}
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#801720] text-white text-sm font-semibold hover:bg-[#6a1219] disabled:opacity-50">
                                    <Send className="w-4 h-4" /> {processing ? 'Mengirim...' : 'Submit Ulang'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
