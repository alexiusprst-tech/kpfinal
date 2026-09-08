import React, { useEffect, useRef, useState } from 'react';
import { X, Download, FileText, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';

/**
 * Reusable Document Preview Modal
 * Renders PDF via iframe and DOCX via docx-preview directly inside the modal
 * without triggering an unintended file download.
 */
export default function DocumentPreviewModal({ open, onClose, fileName, previewUrl, downloadUrl }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const docxContainerRef = useRef(null);

    const ext = fileName ? fileName.split('.').pop()?.toLowerCase() : '';
    const isPdf = ext === 'pdf';
    const isDocx = ext === 'docx';
    const isLegacyDoc = ext === 'doc';

    useEffect(() => {
        if (!open) {
            setLoading(false);
            setError(null);
            return;
        }

        if (isDocx && previewUrl) {
            setLoading(true);
            setError(null);

            axios.get(previewUrl, { responseType: 'blob' })
                .then(async (response) => {
                    if (docxContainerRef.current) {
                        docxContainerRef.current.innerHTML = '';
                        const { renderAsync } = await import('docx-preview');
                        await renderAsync(response.data, docxContainerRef.current, null, {
                            className: 'docx-preview-content',
                            inWrapper: true,
                            ignoreWidth: false,
                            ignoreHeight: false,
                        });
                    }
                    setLoading(false);
                })
                .catch((err) => {
                    console.error('Failed to preview docx:', err);
                    setError('Gagal memuat pratinjau dokumen DOCX. Anda dapat mengunduh berkas untuk membukanya secara manual.');
                    setLoading(false);
                });
        }
    }, [open, previewUrl, isDocx]);

    const handleOpenNewTab = (e) => {
        if (isDocx && previewUrl) {
            e.preventDefault();
            const newWin = window.open('', '_blank');
            if (newWin) {
                newWin.document.write(`
                    <!DOCTYPE html>
                    <html lang="id">
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1">
                        <title>Pratinjau - ${fileName || 'Dokumen'}</title>
                        <script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
                        <script src="https://cdn.jsdelivr.net/npm/docx-preview@0.1.15/dist/docx-preview.min.js"></script>
                        <style>
                            body { margin: 0; padding: 0; background-color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; }
                            .header { padding: 12px 24px; background: #ffffff; border-bottom: 1px solid #e2e8f0; display: flex; items-center: center; justify-content: space-between; position: sticky; top: 0; z-index: 10; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
                            .header h1 { margin: 0; font-size: 14px; font-weight: 700; color: #1e293b; }
                            .content-wrapper { padding: 24px; display: flex; justify-content: center; }
                            #docx-container { background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); padding: 20px; min-height: 80vh; width: 100%; max-width: 900px; }
                            .loading { display: flex; align-items: center; justify-content: center; padding: 60px; color: #64748b; font-size: 13px; font-weight: 600; }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h1>${fileName || 'Pratinjau Naskah Word'}</h1>
                            <span style="font-size: 11px; font-weight: 700; color: #801720; background: #fef2f2; padding: 4px 10px; border-radius: 9999px; border: 1px solid #fecaca;">DOCX PREVIEW</span>
                        </div>
                        <div class="content-wrapper">
                            <div id="docx-container"><div class="loading">Memuat dan merender naskah Word...</div></div>
                        </div>
                        <script>
                            fetch('${previewUrl}')
                                .then(res => res.blob())
                                .then(blob => {
                                    const container = document.getElementById('docx-container');
                                    container.innerHTML = '';
                                    docx.renderAsync(blob, container, null, { inWrapper: false });
                                })
                                .catch(err => {
                                    document.getElementById('docx-container').innerHTML = '<div class="loading" style="color: #dc2626;">Gagal memuat dokumen.</div>';
                                });
                        </script>
                    </body>
                    </html>
                `);
                newWin.document.close();
            }
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
                onClick={onClose}
            />

            {/* Modal Box */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden z-10 border border-gray-200">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-3">
                        <div className="w-8 h-8 rounded-lg bg-[#801720]/10 text-[#801720] flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-gray-800 truncate" title={fileName}>
                                    {fileName || 'Pratinjau Berkas'}
                                </h3>
                                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-gray-200 text-gray-700 flex-shrink-0">
                                    {ext || 'FILE'}
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-400">
                                Mode Pratinjau Naskah
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        {previewUrl && (
                            <a
                                href={previewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={handleOpenNewTab}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-100 transition-colors shadow-xs cursor-pointer"
                                title="Buka di tab baru"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Tab Baru</span>
                            </a>
                        )}

                        {downloadUrl && (
                            <a
                                href={downloadUrl}
                                download={fileName}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#801720] hover:bg-[#6a1219] transition-colors shadow-xs"
                                title="Unduh berkas fisik"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>Unduh</span>
                            </a>
                        )}

                        <button
                            onClick={onClose}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200/70 rounded-lg transition-colors ml-1 cursor-pointer"
                            title="Tutup"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body Content */}
                <div className="flex-1 bg-gray-100 overflow-y-auto relative flex flex-col">
                    {/* PDF Viewer */}
                    {isPdf && previewUrl && (
                        <iframe
                            src={previewUrl}
                            className="w-full h-full border-0 bg-white"
                            title={`Pratinjau ${fileName}`}
                        />
                    )}

                    {/* DOCX Viewer */}
                    {isDocx && (
                        <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto">
                            {loading && (
                                <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
                                    <Loader2 className="w-8 h-8 text-[#801720] animate-spin" />
                                    <p className="text-xs font-semibold text-gray-600">Memuat dan merender naskah Word...</p>
                                </div>
                            )}

                            {error && (
                                <div className="max-w-md mx-auto my-auto p-6 bg-white rounded-2xl border border-red-200 text-center space-y-3 shadow-xs">
                                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                                    <p className="text-xs text-red-700 leading-relaxed">{error}</p>
                                    {downloadUrl && (
                                        <a
                                            href={downloadUrl}
                                            download={fileName}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#801720] text-white rounded-xl text-xs font-bold hover:bg-[#6a1219]"
                                        >
                                            <Download className="w-3.5 h-3.5" /> Unduh Berkas Sekarang
                                        </a>
                                    )}
                                </div>
                            )}

                            <div
                                ref={docxContainerRef}
                                className={`docx-container mx-auto transition-opacity ${loading ? 'opacity-0' : 'opacity-100'}`}
                            />
                        </div>
                    )}

                    {/* Legacy .doc format notice */}
                    {isLegacyDoc && (
                        <div className="max-w-md mx-auto my-auto p-6 bg-white rounded-2xl border border-amber-200 text-center space-y-3 shadow-sm m-6">
                            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                                <FileText className="w-6 h-6" />
                            </div>
                            <h4 className="text-sm font-bold text-gray-800">Dokumen Word Format Lama (.doc)</h4>
                            <p className="text-xs text-gray-600 leading-relaxed">
                                Format <strong>.doc</strong> adalah format biner Microsoft Word terdahulu yang tidak mendukung pratinjau instan HTML5 langsung di peramban. Silakan gunakan tombol unduh di bawah ini untuk membuka dokumen di aplikasi Microsoft Word perangkat Anda.
                            </p>
                            {downloadUrl && (
                                <a
                                    href={downloadUrl}
                                    download={fileName}
                                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#801720] text-white rounded-xl text-xs font-bold hover:bg-[#6a1219] shadow-sm"
                                >
                                    <Download className="w-3.5 h-3.5" /> Unduh Berkas .doc
                                </a>
                            )}
                        </div>
                    )}

                    {/* Fallback for other file types */}
                    {!isPdf && !isDocx && !isLegacyDoc && (
                        <div className="max-w-md mx-auto my-auto p-6 bg-white rounded-2xl border border-gray-200 text-center space-y-3 shadow-sm m-6">
                            <FileText className="w-10 h-10 text-gray-400 mx-auto" />
                            <h4 className="text-sm font-bold text-gray-800">Pratinjau Tidak Tersedia</h4>
                            <p className="text-xs text-gray-600 leading-relaxed">
                                Jenis berkas ini tidak mendukung pratinjau interaktif langsung di browser. Silakan unduh berkas untuk membukanya secara lokal.
                            </p>
                            {downloadUrl && (
                                <a
                                    href={downloadUrl}
                                    download={fileName}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#801720] text-white rounded-xl text-xs font-bold hover:bg-[#6a1219]"
                                >
                                    <Download className="w-3.5 h-3.5" /> Unduh Berkas
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
