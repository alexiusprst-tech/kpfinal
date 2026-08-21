import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import axios from 'axios';
import {
    ArrowLeft, Plus, Trash2, FileText, Download,
    CheckCircle2, AlertTriangle, Sparkles, MoveUp, MoveDown
} from 'lucide-react';
import { showToast, showAlert } from '@/Utils/sweetalert';


export default function SoalGenerator({ mataKuliah, activePeriode, initialData }) {
    const [formData, setFormData] = useState(initialData);
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState('');

    // --- Form Handlers ---
    const handleHeaderChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handlePetunjukChange = (index, value) => {
        setFormData(prev => {
            const list = [...prev.petunjuk_pengerjaan];
            list[index] = value;
            return { ...prev, petunjuk_pengerjaan: list };
        });
    };

    const addPetunjuk = () => {
        setFormData(prev => ({
            ...prev,
            petunjuk_pengerjaan: [...prev.petunjuk_pengerjaan, '']
        }));
    };

    const removePetunjuk = (index) => {
        setFormData(prev => {
            const list = prev.petunjuk_pengerjaan.filter((_, i) => i !== index);
            return { ...prev, petunjuk_pengerjaan: list };
        });
    };

    const movePetunjuk = (index, direction) => {
        setFormData(prev => {
            const list = [...prev.petunjuk_pengerjaan];
            const targetIndex = index + direction;
            if (targetIndex < 0 || targetIndex >= list.length) return prev;
            
            const temp = list[index];
            list[index] = list[targetIndex];
            list[targetIndex] = temp;
            return { ...prev, petunjuk_pengerjaan: list };
        });
    };

    // --- PLO Handlers ---
    const handlePloChange = (ploIndex, field, value) => {
        setFormData(prev => {
            const plos = [...prev.plo];
            plos[ploIndex] = { ...plos[ploIndex], [field]: value };
            return { ...prev, plo: plos };
        });
    };

    const addPlo = () => {
        setFormData(prev => ({
            ...prev,
            plo: [
                ...prev.plo,
                {
                    kode: `PLO${prev.plo.length + 1}`,
                    deskripsi: '',
                    clo: []
                }
            ]
        }));
    };

    const removePlo = (ploIndex) => {
        setFormData(prev => {
            const plos = prev.plo.filter((_, i) => i !== ploIndex);
            return { ...prev, plo: plos };
        });
    };

    // --- CLO Handlers ---
    const handleCloChange = (ploIndex, cloIndex, field, value) => {
        setFormData(prev => {
            const plos = [...prev.plo];
            const clos = [...plos[ploIndex].clo];
            clos[cloIndex] = { ...clos[cloIndex], [field]: value };
            plos[ploIndex] = { ...plos[ploIndex], clo: clos };
            return { ...prev, plo: plos };
        });
    };

    const addClo = (ploIndex) => {
        setFormData(prev => {
            const plos = [...prev.plo];
            // Count total CLOs globally to determine default code
            let totalClos = 0;
            plos.forEach(p => { totalClos += p.clo.length; });

            const newClo = {
                kode: `CLO${totalClos + 1}`,
                deskripsi: '',
                bobot_lo: '0%'
            };
            plos[ploIndex] = {
                ...plos[ploIndex],
                clo: [...plos[ploIndex].clo, newClo]
            };
            return { ...prev, plo: plos };
        });
    };

    const removeClo = (ploIndex, cloIndex) => {
        setFormData(prev => {
            const plos = [...prev.plo];
            const clos = plos[ploIndex].clo.filter((_, i) => i !== cloIndex);
            plos[ploIndex] = { ...plos[ploIndex], clo: clos };
            return { ...prev, plo: plos };
        });
    };

    // --- Calculations ---
    const calculateTotalWeight = () => {
        let total = 0;
        formData.plo.forEach(p => {
            p.clo.forEach(c => {
                const val = parseInt(c.bobot_lo) || 0;
                total += val;
            });
        });
        return total;
    };

    const getGlobalCloCount = () => {
        let count = 0;
        formData.plo.forEach(p => {
            count += p.clo.length;
        });
        return count;
    };

    const totalWeight = calculateTotalWeight();
    const isWeightValid = totalWeight === 100;

    // --- Exports ---
    const handleExport = (type) => {
        setIsExporting(true);
        setExportError('');
        axios.post(`/koordinator/soal-generator/export-${type}`, formData, {
            responseType: 'blob'
        })
        .then(response => {
            const blob = new Blob([response.data], { type: response.headers['content-type'] });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const ext = type === 'pdf' ? 'pdf' : 'doc';
            const cleanMk = formData.kode_nama_mk.replace(/[\/\\?%*:|"<>\s]+/g, '_');
            link.setAttribute('download', `Lembar_Soal_${cleanMk}.${ext}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            showToast('success', `Dokumen soal berhasil diekspor (${type.toUpperCase()})`);
        })
        .catch(err => {
            console.error(err);
            const msg = 'Gagal melakukan ekspor dokumen. Pastikan semua data terisi dengan format benar.';
            setExportError(msg);
            showAlert({
                icon: 'error',
                title: 'Ekspor Gagal',
                text: msg,
            });
        })
        .finally(() => {
            setIsExporting(false);
        });
    };


    // Helper to keep track of visual question area indexes sequentially
    let previewQuestionIndex = 1;

    return (
        <AuthenticatedLayout title={`Generator Lembar Soal - ${mataKuliah.nama_mk}`}>
            <Head title="Generator Lembar Soal" />

            <div className="max-w-[1600px] mx-auto space-y-4">
                {/* Upper Breadcrumbs & Quick Action Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <Link href={`/koordinator/mata-kuliah/${mataKuliah.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#801720] transition-colors">
                        <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Detail Mata Kuliah
                    </Link>
                    
                    <div className="flex items-center gap-2">
                        {/* Weight Status Indicator */}
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                            isWeightValid ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'
                        }`}>
                            {isWeightValid ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                            )}
                            Total Bobot LO: {totalWeight}%
                        </div>
                    </div>
                </div>

                {exportError && (
                    <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        {exportError}
                    </div>
                )}

                {/* Main Split-Screen Panel */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                    
                    {/* Left Column: Form Editor (xl:span-5) */}
                    <div className="xl:col-span-5 space-y-5 max-h-[85vh] overflow-y-auto pr-1">
                        
                        {/* Box 1: Informasi Ujian */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                            <h2 className="text-sm font-extrabold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-2">
                                <Sparkles className="w-4 h-4 text-[#801720]" /> Informasi Lembar Ujian
                            </h2>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div className="sm:col-span-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Kode/Nama MK</label>
                                    <input
                                        type="text"
                                        value={formData.kode_nama_mk}
                                        onChange={e => handleHeaderChange('kode_nama_mk', e.target.value)}
                                        className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#801720]/20"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nama Evaluasi</label>
                                    <div className="mt-1 flex items-center justify-between border border-gray-200 bg-gray-50/80 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800">
                                        <span>{formData.nama_evaluasi || 'Ujian Tengah Semester (UTS)'}</span>
                                        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#801720]/10 text-[#801720] rounded flex-shrink-0">
                                            Sesuai Periode
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Kode Dosen</label>
                                    <div className="mt-1 flex items-center justify-between border border-gray-200 bg-gray-50/80 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800">
                                        <span>{formData.kode_dosen || '-'}</span>
                                        <span className="text-[9px] font-bold text-gray-400">Paten</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tipe Ujian</label>
                                    <div className="mt-1 flex items-center justify-between border border-gray-200 bg-gray-50/80 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800">
                                        <span>{formData.tipe_ujian || 'UTS'}</span>
                                        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#801720]/10 text-[#801720] rounded flex-shrink-0">
                                            {formData.tipe_ujian || 'UTS'}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tanggal &amp; Durasi</label>
                                    <input
                                        type="text"
                                        value={formData.tanggal_evaluasi}
                                        onChange={e => handleHeaderChange('tanggal_evaluasi', e.target.value)}
                                        className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#801720]/20"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tipe Soal (Sifat Ujian)</label>
                                    <input
                                        type="text"
                                        value={formData.tipe_soal}
                                        onChange={e => handleHeaderChange('tipe_soal', e.target.value)}
                                        className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#801720]/20"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">No Form</label>
                                    <input
                                        type="text"
                                        value={formData.form_no}
                                        onChange={e => handleHeaderChange('form_no', e.target.value)}
                                        className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#801720]/20"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Box 2: Petunjuk Pengerjaan */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                <h2 className="text-sm font-extrabold text-gray-800 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-[#801720]" /> Petunjuk Pengerjaan
                                </h2>
                                <button
                                    type="button"
                                    onClick={addPetunjuk}
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-1 rounded-lg transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Tambah
                                </button>
                            </div>

                            <div className="space-y-2">
                                {formData.petunjuk_pengerjaan.map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-2 bg-gray-50 border border-gray-100 p-2 rounded-xl">
                                        <div className="flex flex-col gap-1 mt-1 text-gray-400">
                                            <button
                                                type="button"
                                                onClick={() => movePetunjuk(idx, -1)}
                                                disabled={idx === 0}
                                                className="hover:text-gray-600 disabled:opacity-30"
                                            >
                                                <MoveUp className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => movePetunjuk(idx, 1)}
                                                disabled={idx === formData.petunjuk_pengerjaan.length - 1}
                                                className="hover:text-gray-600 disabled:opacity-30"
                                            >
                                                <MoveDown className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <span className="text-xs font-bold text-gray-400 mt-2">({idx + 1})</span>
                                        <textarea
                                            value={item}
                                            onChange={e => handlePetunjukChange(idx, e.target.value)}
                                            rows={2}
                                            className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#801720]/20 resize-none bg-white"
                                            placeholder="Masukkan petunjuk pengerjaan..."
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removePetunjuk(idx)}
                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg mt-1 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}

                                {formData.petunjuk_pengerjaan.length === 0 && (
                                    <p className="text-xs text-gray-400 text-center py-2">Belum ada petunjuk. Klik tambah di kanan atas.</p>
                                )}
                            </div>
                        </div>

                        {/* Box 3: PLO & CLO Structure */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                <h2 className="text-sm font-extrabold text-gray-800 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-[#801720]" /> Struktur PLO &amp; CLO
                                </h2>
                                <button
                                    type="button"
                                    onClick={addPlo}
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-1 rounded-lg transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Tambah PLO
                                </button>
                            </div>

                            <div className="space-y-4">
                                {formData.plo.map((ploItem, ploIdx) => (
                                    <div key={ploIdx} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-3">
                                        
                                        {/* PLO Header Input Row */}
                                        <div className="flex items-start gap-2">
                                            <div className="w-24">
                                                <label className="text-[9px] font-bold text-gray-400 uppercase">Kode PLO</label>
                                                <input
                                                    type="text"
                                                    value={ploItem.kode}
                                                    onChange={e => handlePloChange(ploIdx, 'kode', e.target.value)}
                                                    className="mt-1 w-full border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#801720]/20 bg-white"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-[9px] font-bold text-gray-400 uppercase">Deskripsi PLO</label>
                                                <textarea
                                                    value={ploItem.deskripsi}
                                                    onChange={e => handlePloChange(ploIdx, 'deskripsi', e.target.value)}
                                                    rows={1}
                                                    className="mt-1 w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#801720]/20 resize-none bg-white"
                                                    placeholder="Deskripsi Program Learning Outcome..."
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removePlo(ploIdx)}
                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg mt-5 transition-colors"
                                                title="Hapus PLO beserta seluruh CLO di dalamnya"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        {/* Nested CLOs */}
                                        <div className="pl-6 border-l-2 border-gray-200 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">Course Learning Outcomes ({ploItem.clo.length})</span>
                                                <button
                                                    type="button"
                                                    onClick={() => addClo(ploIdx)}
                                                    className="inline-flex items-center gap-0.5 text-[9px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 px-2 py-0.5 rounded transition-colors"
                                                >
                                                    <Plus className="w-3 h-3" /> Tambah CLO
                                                </button>
                                            </div>

                                            {ploItem.clo.map((cloItem, cloIdx) => (
                                                <div key={cloIdx} className="flex items-start gap-2 bg-white border border-gray-150 p-2.5 rounded-lg shadow-sm">
                                                    <div className="w-20">
                                                        <label className="text-[8px] font-bold text-gray-400 uppercase">Kode CLO</label>
                                                        <input
                                                            type="text"
                                                            value={cloItem.kode}
                                                            onChange={e => handleCloChange(ploIdx, cloIdx, 'kode', e.target.value)}
                                                            className="mt-0.5 w-full border border-gray-200 rounded px-1.5 py-0.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#801720]/20"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="text-[8px] font-bold text-gray-400 uppercase">Deskripsi CLO</label>
                                                        <textarea
                                                            value={cloItem.deskripsi}
                                                            onChange={e => handleCloChange(ploIdx, cloIdx, 'deskripsi', e.target.value)}
                                                            rows={2}
                                                            className="mt-0.5 w-full border border-gray-200 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#801720]/20 resize-none"
                                                            placeholder="Deskripsi CLO..."
                                                        />
                                                    </div>
                                                    <div className="w-20">
                                                        <label className="text-[8px] font-bold text-gray-400 uppercase">Bobot LO</label>
                                                        <input
                                                            type="text"
                                                            value={cloItem.bobot_lo}
                                                            onChange={e => handleCloChange(ploIdx, cloIdx, 'bobot_lo', e.target.value)}
                                                            placeholder="e.g. 20%"
                                                            className="mt-0.5 w-full border border-gray-200 rounded px-1.5 py-0.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-[#801720]/20 font-semibold"
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeClo(ploIdx, cloIdx)}
                                                        className="p-1 text-red-500 hover:bg-red-50 rounded mt-4 transition-colors"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}

                                            {ploItem.clo.length === 0 && (
                                                <p className="text-[10px] text-gray-400 italic py-1">Belum ada CLO di PLO ini.</p>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {formData.plo.length === 0 && (
                                    <p className="text-xs text-gray-400 text-center py-4">Belum ada PLO. Klik tambah di kanan atas.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Live High-Fidelity Preview (xl:span-7) */}
                    <div className="xl:col-span-7 space-y-4">
                        
                        {/* Sticky Action Panel inside preview column */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sticky top-3 z-10">
                            <div>
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cetak Dokumen Lembar Soal</h3>
                                <p className="text-[10px] text-gray-400">Pastikan total bobot LO adalah 100% sebelum mencetak.</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleExport('docx')}
                                    disabled={isExporting}
                                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                                >
                                    <Download className="w-3.5 h-3.5" /> {isExporting ? 'Proses...' : 'Ekspor DOCX'}
                                </button>
                                <button
                                    onClick={() => handleExport('pdf')}
                                    disabled={isExporting}
                                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#801720] hover:bg-[#6a1219] text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                                >
                                    <FileText className="w-3.5 h-3.5" /> {isExporting ? 'Proses...' : 'Ekspor PDF'}
                                </button>
                            </div>
                        </div>

                        {/* A4 Container Box */}
                        <div className="bg-[#E2E8F0] p-6 rounded-2xl border border-gray-200 shadow-inner max-h-[80vh] overflow-y-auto flex justify-center items-start">
                            
                            {/* A4 Paper mockup */}
                            <div className="w-[21cm] bg-white shadow-xl p-[1.5cm] box-border text-black select-none font-serif text-[11px] relative leading-relaxed" style={{ fontFamily: 'Arial, sans-serif' }}>
                                
                                {/* Form No (Top Left) */}
                                <div className="text-[9.5px] text-left mb-1.5">
                                    Form No : {formData.form_no}
                                </div>

                                {/* Header Table */}
                                <table className="w-full border-collapse border-[1.5px] border-black text-[10px]">
                                    <tbody>
                                        <tr>
                                            {/* Logo Column */}
                                            <td rowSpan={4} className="border-[1.5px] border-black p-2 text-center align-middle w-[22%]">
                                                <img
                                                    src="/images/logo-telkom.png"
                                                    alt="Logo Telkom"
                                                    className="max-h-[42px] max-w-full mx-auto block"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.insertAdjacentHTML('afterend', '<strong style="font-size:11px;">Telkom<br>University</strong>');
                                                    }}
                                                />
                                            </td>
                                            {/* Lembar Soal Title */}
                                            <td colSpan={4} className="border-[1.5px] border-black p-2 text-center align-middle font-bold text-[13px] uppercase tracking-wide bg-gray-50/50">
                                                LEMBAR SOAL
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border-[1.5px] border-black px-2 py-1 w-[16%] font-normal text-gray-700 bg-gray-50/30">Nama Evaluasi</td>
                                            <td className="border-[1.5px] border-black px-2 py-1 w-[32%]">{formData.nama_evaluasi}</td>
                                            <td className="border-[1.5px] border-black px-2 py-1 w-[14%] font-normal text-gray-700 bg-gray-50/30">Kode dosen</td>
                                            <td className="border-[1.5px] border-black px-2 py-1 w-[16%]">{formData.kode_dosen || '-'}</td>
                                        </tr>
                                        <tr>
                                            <td className="border-[1.5px] border-black px-2 py-1 font-normal text-gray-700 bg-gray-50/30">Kode/Nama MK</td>
                                            <td className="border-[1.5px] border-black px-2 py-1">{formData.kode_nama_mk}</td>
                                            <td className="border-[1.5px] border-black px-2 py-1 font-normal text-gray-700 bg-gray-50/30">Tipe Ujian</td>
                                            <td className="border-[1.5px] border-black px-2 py-1">{formData.tipe_ujian}</td>
                                        </tr>
                                        <tr>
                                            <td className="border-[1.5px] border-black px-2 py-1 font-normal text-gray-700 bg-gray-50/30">Tanggal Evaluasi</td>
                                            <td className="border-[1.5px] border-black px-2 py-1">{formData.tanggal_evaluasi}</td>
                                            <td className="border-[1.5px] border-black px-2 py-1 font-normal text-gray-700 bg-gray-50/30">Tipe Soal</td>
                                            <td className="border-[1.5px] border-black px-2 py-1 font-bold">{formData.tipe_soal}</td>
                                        </tr>
                                    </tbody>
                                </table>

                                {/* Petunjuk Box */}
                                <table className="w-full border-collapse border-[1.5px] border-black mt-2.5 text-[10px]">
                                    <tbody>
                                        <tr>
                                            <td className="border-[1.5px] border-black p-2 text-center align-middle font-bold w-[22%] bg-gray-50/50 leading-normal">
                                                Petunjuk<br />Pengerjaan
                                            </td>
                                            <td className="border-[1.5px] border-black p-2 align-middle">
                                                {formData.petunjuk_pengerjaan.map((item, idx) => (
                                                    <div key={idx} className="mb-0.5">
                                                        ({idx + 1}) {item || '...'}
                                                    </div>
                                                ))}
                                                {formData.petunjuk_pengerjaan.length === 0 && (
                                                    <div className="text-gray-400 italic">Belum ada petunjuk pengerjaan.</div>
                                                )}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>

                                {/* Reset counter for sequential question area tags globally in preview */}
                                {(() => { previewQuestionIndex = 1; return null; })()}

                                {/* Loop PLOs */}
                                {formData.plo.map((ploItem, ploIdx) => (
                                    <div key={ploIdx} className="mt-2.5 select-none">
                                        
                                        {/* PLO Row */}
                                        <table className="w-full border-collapse border-[1.5px] border-black text-[10px]">
                                            <tbody>
                                                <tr>
                                                    <td className="border-[1.5px] border-black p-2 text-center align-middle font-bold w-[22%] bg-gray-50/50 leading-normal">
                                                        Program<br />Learning<br />Outcomes
                                                    </td>
                                                    <td className="border-[1.5px] border-black p-2 align-middle font-bold">
                                                        {ploItem.kode} – {ploItem.deskripsi || '...'}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>

                                        {/* Loop CLOs inside PLO */}
                                        {ploItem.clo.map((cloItem, cloIdx) => {
                                            const currentQuestionNum = previewQuestionIndex;
                                            previewQuestionIndex++; // Increment globally

                                            return (
                                                <div key={cloIdx} className="mt-2.5 select-none">
                                                    
                                                    {/* CLO Header & Weight */}
                                                    <table className="w-full border-collapse border-[1.5px] border-black text-[10px]">
                                                        <thead>
                                                            <tr className="bg-gray-50/50 font-bold">
                                                                <th className="border-[1.5px] border-black p-1.5 text-left w-[85%]">Course Learning outcomes</th>
                                                                <th className="border-[1.5px] border-black p-1.5 text-right w-[15%]">Bobot LO</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            <tr>
                                                                <td className="border-[1.5px] border-black p-2 align-middle">
                                                                    <span className="font-bold mr-3">{cloItem.kode}</span>
                                                                    <span>{cloItem.deskripsi || '...'}</span>
                                                                </td>
                                                                <td className="border-[1.5px] border-black p-2 text-right font-bold align-middle">
                                                                    {cloItem.bobot_lo}
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>

                                                    {/* Question area title */}
                                                    <div className="text-center my-2">
                                                        <span className="bg-yellow-300 border border-black/10 px-2 py-0.5 text-[10px] font-bold">
                                                            Soal LO{currentQuestionNum}
                                                        </span>
                                                    </div>

                                                    {/* Bordered Question space */}
                                                    <div className="border-[1.5px] border-black h-[140px] flex items-center justify-center text-gray-300 font-sans text-[11px] italic bg-gray-50/10">
                                                        [ AREA SOAL UNTUK {cloItem.kode} ]
                                                    </div>

                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}

                                {formData.plo.length === 0 && (
                                    <div className="text-center text-gray-400 italic py-8 border border-dashed border-gray-300 mt-2.5 rounded-lg">
                                        Belum ada PLO &amp; CLO yang ditambahkan. Silakan tambahkan pada editor form di sebelah kiri.
                                    </div>
                                )}

                                {/* Footer (Bottom Left layout mock) */}
                                <div className="border-t border-gray-100 mt-8 pt-2 text-[9px] text-gray-400 font-sans select-none">
                                    Fakultas Rekayasa Industri – S1 Sistem Informasi
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
