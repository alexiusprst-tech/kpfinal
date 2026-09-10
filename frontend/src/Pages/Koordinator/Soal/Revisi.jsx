import React, { useEffect, useRef, useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ArrowLeft, UploadCloud, FileText, X, AlertTriangle, User, CheckCircle2, Send, MessageSquare, Loader2, Eye
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


export default function SoalRevisi({ soal, catatan, cloFeedback, verifikator }) {
    const { flash } = usePage().props;
    const [step, setStep] = useState('form');
    const [clientError, setClientError] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);
    const docxRef = useRef(null);

    const [fileUrl, setFileUrl] = useState(null);
    const [renderingDocx, setRenderingDocx] = useState(false);
    const [docxError, setDocxError] = useState('');

    const { data, setData, post, processing, errors } = useForm({
        file: null,
        catatan: '',
    });

    const ext = data.file ? data.file.name.split('.').pop()?.toLowerCase() : '';

    useEffect(() => {
        if (step === 'preview' && data.file) {
            if (ext === 'pdf') {
                const url = URL.createObjectURL(data.file);
                setFileUrl(url);
                return () => URL.revokeObjectURL(url);
            } else if (ext === 'docx') {
                setRenderingDocx(true);
                setDocxError('');
                const timer = setTimeout(async () => {
                    if (docxRef.current) {
                        docxRef.current.innerHTML = '';
                        try {
                            const { renderAsync } = await import('docx-preview');
                            await renderAsync(data.file, docxRef.current, null, {
                                className: 'docx-preview-content',
                                inWrapper: true,
                                ignoreWidth: false,
                                ignoreHeight: false,
                            });
                            setRenderingDocx(false);
                        } catch (err) {
                            console.error('DOCX render error:', err);
                            setDocxError('Gagal memuat pratinjau berkas DOCX.');
                            setRenderingDocx(false);
                        }
                    } else {
                        setRenderingDocx(false);
                    }
                }, 50);
                return () => clearTimeout(timer);
            }
        }
    }, [step, data.file, ext]);

    const handleFile = (file) => {
        if (!file) return;
        const fileExt = file.name.split('.').pop().toLowerCase();
        if (!ALLOWED_EXT.includes(fileExt)) {
            setClientError('Format file harus PDF, DOC, atau DOCX.');
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
            post(`/koordinator/revisi/${soal.id}`, {
                forceFormData: true,
                onError: (errs) => {
                    const msg = Object.values(errs)[0] || 'Gagal mengunggah berkas revisi.';
                    showAlert('error', 'Gagal', msg);
                }
            });
        }
    };

function resolveCloNote(val) {
    if (!val) return null;
    if (typeof val === 'string') return { catatan: val, no_soal: '', rekomendasi: '' };
    if (typeof val === 'object') {
        return {
            no_soal: val.no_soal || '',
            catatan: val.catatan || '',
            rekomendasi: val.rekomendasi || '',
        };
    }
    return null;
}

    const cloNotes = cloFeedback && typeof cloFeedback === 'object'
        ? Object.entries(cloFeedback).filter(([_, noteVal]) => {
            const r = resolveCloNote(noteVal);
            return r && (r.catatan?.trim() || r.no_soal?.trim() || r.rekomendasi?.trim());
        })
        : [];

    return (
        <AuthenticatedLayout title="Perbaiki Soal">
            <Head title="Perbaiki Soal" />
            <FlashAlert flash={flash} />

            <div className={`mx-auto space-y-6 transition-all duration-300 ${step === 'preview' ? 'max-w-4xl' : 'max-w-2xl'}`}>
                <Link href={`/koordinator/soal/${soal.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#801720]">
                    <ArrowLeft className="w-3.5 h-3.5" /> Kembali
                </Link>

                {/* Revision reason */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
                            <AlertTriangle className="w-4 h-4" /> PERLU REVISI
                        </div>
                        {verifikator && (
                            <span className="text-[11px] text-amber-800">
                                Oleh: <strong>{verifikator}</strong>
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-600">Soal: <strong className="text-gray-800">{soal.judul}</strong></p>

                    {catatan && (
                        <div className="text-xs text-gray-700 bg-white rounded-xl p-3 border border-amber-200/70">
                            <span className="font-bold text-amber-900 block mb-1">Catatan Umum:</span>
                            "{catatan}"
                        </div>
                    )}

                    {cloNotes.length > 0 && (
                        <div className="space-y-1.5">
                            <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                                <MessageSquare className="w-3.5 h-3.5" /> Catatan Koreksi Per-CLO:
                            </span>
                            <div className="space-y-2">
                                {cloNotes.map(([kode, noteVal], idx) => {
                                    const resolved = resolveCloNote(noteVal);
                                    return (
                                        <div key={idx} className="flex flex-col gap-1 text-xs bg-white rounded-xl p-3 border border-amber-200/70">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 rounded bg-red-100 text-[#801720] font-extrabold text-[10px] whitespace-nowrap flex-shrink-0">
                                                    {kode}
                                                </span>
                                                {resolved?.no_soal && (
                                                    <span className="text-[11px] text-gray-500 font-semibold">
                                                        (No. Soal: {resolved.no_soal})
                                                    </span>
                                                )}
                                            </div>
                                            {resolved?.catatan && (
                                                <p className="text-gray-800 font-medium">{resolved.catatan}</p>
                                            )}
                                            {resolved?.rekomendasi && (
                                                <p className="text-[11px] text-gray-500 italic">Rekomendasi PLO: {resolved.rekomendasi}</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h1 className="text-lg font-extrabold text-gray-800">
                        {step === 'form' ? 'Unggah Berkas Perbaikan' : 'Preview Berkas Revisi'}
                    </h1>

                    {step === 'form' && (
                        <div className="mt-4 space-y-4">
                            {clientError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                                    {clientError}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    Berkas Soal Hasil Revisi <span className="text-red-500">*</span>
                                </label>
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); }}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
                                        dragOver ? 'border-[#801720] bg-red-50/40' : data.file ? 'border-emerald-400 bg-emerald-50/30' : 'border-gray-300 hover:border-[#801720]/40'
                                    }`}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        className="hidden"
                                        onChange={(e) => handleFile(e.target.files?.[0])}
                                    />
                                    {data.file ? (
                                        <div className="flex items-center justify-center gap-3">
                                            <FileText className="w-6 h-6 text-emerald-600" />
                                            <div className="text-left">
                                                <p className="text-xs font-bold text-gray-800">{data.file.name}</p>
                                                <p className="text-[10px] text-gray-400">{formatSize(data.file.size)}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <UploadCloud className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-xs font-semibold text-gray-700">Klik untuk pilih file perbaikan atau tarik ke sini</p>
                                            <p className="text-[10px] text-gray-400 mt-1">PDF, DOC, atau DOCX (Maks 20MB)</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    Catatan Perbaikan (Opsional)
                                </label>
                                <textarea
                                    rows={3}
                                    value={data.catatan}
                                    onChange={(e) => setData('catatan', e.target.value)}
                                    placeholder="Jelaskan perubahan atau perbaikan yang telah dilakukan..."
                                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs resize-none focus:ring-2 focus:ring-[#801720]/20 focus:border-[#801720] outline-none"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={goToPreview}
                                disabled={!data.file}
                                className="w-full py-2.5 bg-[#801720] text-white rounded-xl text-xs font-bold hover:bg-[#6a1219] disabled:opacity-50 transition-all cursor-pointer"
                            >
                                Lanjut ke Preview
                            </button>
                        </div>
                    )}

                    {step === 'preview' && (
                        <div className="mt-4 space-y-5">
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">File Revisi:</span>
                                    <span className="font-bold text-gray-800">{data.file?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Ukuran:</span>
                                    <span className="font-bold text-gray-800">{formatSize(data.file?.size)}</span>
                                </div>
                                {data.catatan && (
                                    <div className="pt-2 border-t border-gray-200">
                                        <span className="text-gray-400 block mb-0.5">Catatan Perbaikan:</span>
                                        <p className="text-gray-700 italic">"{data.catatan}"</p>
                                    </div>
                                )}
                            </div>

                            {/* Live Document Preview */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                    <Eye className="w-3.5 h-3.5 text-[#801720]" /> Pratinjau Isi Berkas:
                                </h3>

                                {ext === 'pdf' && fileUrl && (
                                    <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs bg-gray-50 h-[600px] w-full">
                                        <iframe
                                            src={fileUrl}
                                            className="w-full h-full border-0 bg-white"
                                            title="Pratinjau Berkas PDF"
                                        />
                                    </div>
                                )}

                                {ext === 'docx' && (
                                    <div className="border border-gray-200 rounded-2xl p-4 sm:p-6 bg-white min-h-[450px] shadow-xs relative overflow-y-auto max-h-[600px]">
                                        {renderingDocx && (
                                            <div className="flex flex-col items-center justify-center py-16 text-gray-500 gap-2">
                                                <Loader2 className="w-8 h-8 text-[#801720] animate-spin" />
                                                <p className="text-xs font-semibold">Memuat dan merender naskah Word...</p>
                                            </div>
                                        )}
                                        {docxError && (
                                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 text-center">
                                                {docxError}
                                            </div>
                                        )}
                                        <div
                                            ref={docxRef}
                                            className={`docx-container transition-opacity ${renderingDocx ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}
                                        />
                                    </div>
                                )}

                                {ext === 'doc' && (
                                    <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-2">
                                        <FileText className="w-8 h-8 text-amber-600 mx-auto" />
                                        <h4 className="text-xs font-bold text-gray-800">Format .doc Tidak Mendukung Live Preview</h4>
                                        <p className="text-[11px] text-gray-600 leading-relaxed">
                                            Format .doc adalah format biner Microsoft Word terdahulu. Berkas tetap akan terkirim dengan baik saat Anda menekan tombol "Ya, Kirim Revisi".
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setStep('form')}
                                    className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 cursor-pointer"
                                >
                                    Ubah Berkas
                                </button>
                                <button
                                    type="button"
                                    onClick={submitUlang}
                                    disabled={processing}
                                    className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                                >
                                    {processing ? 'Mengirim...' : 'Ya, Kirim Revisi'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

