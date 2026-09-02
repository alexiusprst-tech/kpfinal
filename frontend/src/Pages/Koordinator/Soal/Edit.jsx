import React, { useRef, useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeft, UploadCloud, FileText, X, AlertTriangle } from 'lucide-react';

const ALLOWED_EXT = ['pdf', 'doc', 'docx'];
const MAX_SIZE_MB = 20;

function formatSize(bytes) {
    if (!bytes) return '0 KB';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

import FlashAlert from '@/Components/FlashAlert';
import { showToast, showAlert } from '@/Utils/sweetalert';



export default function SoalEdit({ soal, kategoriAll }) {
    const { flash } = usePage().props;
    const [clientError, setClientError] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    const { data, setData, post, processing, errors } = useForm({
        judul: soal.judul,
        kategori_id: soal.kategori_id,
        file: null,
        _method: 'put',
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

    const submit = (e) => {
        e.preventDefault();
        post(`/koordinator/soal/${soal.id}`, { forceFormData: true });
    };

    return (
        <AuthenticatedLayout title="Edit Soal">
            <Head title="Edit Soal" />
            <FlashAlert flash={flash} />

            <div className="max-w-2xl mx-auto space-y-6">
                <Link href={`/koordinator/soal/${soal.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#801720]">
                    <ArrowLeft className="w-3.5 h-3.5" /> Kembali
                </Link>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h1 className="text-xl font-extrabold text-gray-800">Edit Soal</h1>
                    <p className="text-sm text-gray-500 mt-1">{soal.mata_kuliah?.nama_mk}</p>

                    <form onSubmit={submit} className="mt-5 space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Kategori Soal</label>
                            <select
                                value={data.kategori_id}
                                onChange={e => setData('kategori_id', e.target.value)}
                                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#801720]/20"
                            >
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
                                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#801720]/20"
                            />
                            {errors.judul && <p className="text-xs text-red-600 mt-1">{errors.judul}</p>}
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Ganti File (opsional)</label>
                            <div
                                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); }}
                                onClick={() => fileInputRef.current?.click()}
                                className={`mt-1 border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
                                    dragOver ? 'border-[#801720] bg-[#801720]/5' : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
                                    onChange={e => handleFile(e.target.files?.[0])} />
                                {data.file ? (
                                    <div className="flex items-center justify-center gap-3">
                                        <FileText className="w-6 h-6 text-[#801720]" />
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
                                    <div className="flex items-center justify-center gap-3">
                                        <FileText className="w-6 h-6 text-gray-400" />
                                        <div className="text-left">
                                            <p className="text-sm font-semibold text-gray-700">{soal.nama_file}</p>
                                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                                <UploadCloud className="w-3.5 h-3.5" /> Klik atau drag file baru untuk mengganti
                                            </p>
                                        </div>
                                    </div>
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
                            <Link href={`/koordinator/soal/${soal.id}`}
                                className="flex-1 text-center px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">
                                Batal
                            </Link>
                            <button type="submit" disabled={processing}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-[#801720] text-white text-sm font-semibold hover:bg-[#6a1219] disabled:opacity-50">
                                {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
