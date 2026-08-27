import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { 
    BookOpen, Trash2, ChevronRight, ChevronDown, Info, 
    ArrowLeft, Check, AlertCircle, Settings, Search, Save,
    Plus, Activity, Target, HelpCircle
} from 'lucide-react';

export default function Show({ mataKuliah, allPlo, allClo, allMataKuliah = [] }) {
    // Active sub-tab: 'plo' or 'clo'
    const [activeTab, setActiveTab] = useState('plo');

    // Selection states (local copies until clicking "Simpan Pemetaan")
    const [selectedPloIds, setSelectedPloIds] = useState(
        mataKuliah.plo ? mataKuliah.plo.map(p => p.id) : []
    );
    const [selectedCloIds, setSelectedCloIds] = useState(
        mataKuliah.clo ? mataKuliah.clo.map(c => c.id) : []
    );

    // Search filters
    const [ploSearch, setPloSearch] = useState('');
    const [cloSearch, setCloSearch] = useState('');

    // Update local state when course prop changes
    useEffect(() => {
        setSelectedPloIds(mataKuliah.plo ? mataKuliah.plo.map(p => p.id) : []);
        setSelectedCloIds(mataKuliah.clo ? mataKuliah.clo.map(c => c.id) : []);
    }, [mataKuliah]);

    // Handle course switcher dropdown
    const handleCourseChange = (id) => {
        router.visit(`/superadmin/mata-kuliah/${id}`);
    };

    // Toggle PLO checkbox
    const togglePlo = (id) => {
        if (selectedPloIds.includes(id)) {
            setSelectedPloIds(selectedPloIds.filter(ploId => ploId !== id));
        } else {
            setSelectedPloIds([...selectedPloIds, id]);
        }
    };

    // Toggle CLO checkbox (otomatis update PLO terkait)
    const toggleClo = (id) => {
        const nextCloIds = selectedCloIds.includes(id)
            ? selectedCloIds.filter(cloId => cloId !== id)
            : [...selectedCloIds, id];
        setSelectedCloIds(nextCloIds);

        const derivedPloIds = allClo
            .filter(c => nextCloIds.includes(c.id))
            .flatMap(c => (c.plo ? c.plo.map(p => p.id) : []))
            .filter((pid, idx, self) => self.indexOf(pid) === idx);
        setSelectedPloIds(derivedPloIds);
    };

    // Remove PLO mapping from right-side table
    const removePlo = (id) => {
        setSelectedPloIds(selectedPloIds.filter(ploId => ploId !== id));
    };

    // Remove CLO mapping from right-side table (otomatis update PLO terkait)
    const removeClo = (id) => {
        const nextCloIds = selectedCloIds.filter(cloId => cloId !== id);
        setSelectedCloIds(nextCloIds);

        const derivedPloIds = allClo
            .filter(c => nextCloIds.includes(c.id))
            .flatMap(c => (c.plo ? c.plo.map(p => p.id) : []))
            .filter((pid, idx, self) => self.indexOf(pid) === idx);
        setSelectedPloIds(derivedPloIds);
    };

    // Save mapping state to server
    const [isSaving, setIsSaving] = useState(false);
    const handleSavePemetaan = () => {
        setIsSaving(true);
        router.put(`/superadmin/mata-kuliah/${mataKuliah.id}`, {
            kode_mk: mataKuliah.kode_mk,
            nama_mk: mataKuliah.nama_mk,
            nama_mk_en: mataKuliah.nama_mk_en || '',
            sks: mataKuliah.sks,
            semester: mataKuliah.semester,
            status: mataKuliah.status,
            plo_ids: selectedPloIds,
            clo_ids: selectedCloIds
        }, {
            onFinish: () => setIsSaving(false)
        });
    };

    // Filter PLOs
    const filteredPlos = allPlo.filter(p => 
        p.kode_plo.toLowerCase().includes(ploSearch.toLowerCase()) ||
        p.deskripsi.toLowerCase().includes(ploSearch.toLowerCase())
    );

    // Filter CLOs
    const filteredClos = allClo.filter(c => 
        c.kode_clo.toLowerCase().includes(cloSearch.toLowerCase()) ||
        c.deskripsi.toLowerCase().includes(cloSearch.toLowerCase())
    );

    // Get active/selected PLOs & CLOs for detail listing
    const selectedPlosDetails = allPlo.filter(p => selectedPloIds.includes(p.id));
    const selectedClosDetails = allClo.filter(c => selectedCloIds.includes(c.id));

    // Dynamic Bobot LO evenly distributed out of 100%
    const cloWeights = selectedClosDetails.length > 0 ? (() => {
        const base = Math.floor(100 / selectedClosDetails.length);
        const remainder = 100 % selectedClosDetails.length;
        return selectedClosDetails.map((c, i) => i === 0 ? base + remainder : base);
    })() : [];



    return (
        <AuthenticatedLayout title="Pemetaan PLO & CLO">
            <Head title="Pemetaan PLO & CLO Mata Kuliah" />

            {/* Breadcrumbs */}
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold mb-5">
                <Link href="/dashboard" className="hover:text-slate-800 transition-colors">Dashboard</Link>
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <Link href="/superadmin/mata-kuliah" className="hover:text-slate-800 transition-colors">Mata Kuliah</Link>
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <span className="text-slate-800 font-bold">Pemetaan PLO & CLO</span>
            </div>

            {/* Heading section */}
            <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-extrabold text-[#1E293B] tracking-tight">Pemetaan PLO & CLO - Mata Kuliah</h1>
                    <p className="text-xs sm:text-sm text-[#64748B] font-medium mt-0.5">
                        Kelola pemetaan Capaian Pembelajaran Lulusan (PLO) dan Capaian Pembelajaran Mata Kuliah (CLO) untuk setiap mata kuliah.
                    </p>
                </div>
                <a
                    href="/docs/buku-kurikulum-2024.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 shadow-xs transition-all cursor-pointer"
                    title="Buka Buku Kurikulum 2024 (Panduan Pemetaan)"
                >
                    <BookOpen className="w-4 h-4 text-[#801720]" />
                    <span>Panduan Pemetaan</span>
                </a>
            </div>

            {/* Top Selector Card */}
            <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-xs mb-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                    {/* Course Selector Dropdown */}
                    <div className="lg:col-span-4">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Pilih Mata Kuliah</label>
                        <select
                            value={mataKuliah.id}
                            onChange={(e) => handleCourseChange(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-355 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#801720] cursor-pointer"
                        >
                            {allMataKuliah.map((mk) => (
                                <option key={mk.id} value={mk.id}>
                                    {mk.kode_mk} - {mk.nama_mk}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Stats Display */}
                    <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Program Studi</span>
                            <span className="text-xs font-bold text-slate-700">Sistem Informasi</span>
                        </div>
                        <div>
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Semester</span>
                            <span className="text-xs font-bold text-slate-700">{mataKuliah.semester}</span>
                        </div>
                        <div>
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">SKS</span>
                            <span className="text-xs font-bold text-slate-700">{mataKuliah.sks}</span>
                        </div>
                        <div>
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</span>
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                                mataKuliah.status === 'ACTIVE'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-150'
                                    : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}>
                                {mataKuliah.status === 'ACTIVE' ? 'Aktif' : 'Non-Aktif'}
                            </span>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="lg:col-span-2 flex flex-col items-end justify-center">
                        <button
                            onClick={handleSavePemetaan}
                            disabled={isSaving}
                            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#801720] hover:bg-[#9B1724] text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            <span>{isSaving ? 'Menyimpan...' : 'Simpan Pemetaan'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab Menus */}
            <div className="flex border-b border-slate-200 mb-6">
                <button
                    onClick={() => setActiveTab('plo')}
                    className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer relative ${
                        activeTab === 'plo'
                            ? 'border-[#801720] text-[#801720]'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    Pemetaan PLO
                </button>
                <button
                    onClick={() => setActiveTab('clo')}
                    className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer relative ${
                        activeTab === 'clo'
                            ? 'border-[#801720] text-[#801720]'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    Pemetaan CLO
                </button>
            </div>

            {/* Tab Content Panels */}
            {activeTab === 'plo' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    {/* Left Panel: Select PLO */}
                    <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/70 p-5 shadow-xs flex flex-col h-full">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xs font-extrabold text-slate-800">PLO (Program Learning Outcome)</h2>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                {selectedPloIds.length} dipilih
                            </span>
                        </div>

                        {/* Search bar */}
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={ploSearch}
                                onChange={(e) => setPloSearch(e.target.value)}
                                placeholder="Cari PLO..."
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#801720]"
                            />
                        </div>

                        {/* Scrollable PLO list */}
                        <div className="space-y-2 flex-1 max-h-[480px] min-h-[380px] overflow-y-auto pr-1">
                            {filteredPlos.length > 0 ? (
                                filteredPlos.map((plo) => {
                                    const isSelected = selectedPloIds.includes(plo.id);
                                    return (
                                        <div
                                            key={plo.id}
                                            onClick={() => togglePlo(plo.id)}
                                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                                                isSelected
                                                    ? 'border-[#801720] bg-[#801720]/5 shadow-xs'
                                                    : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                readOnly
                                                className="mt-0.5 w-4 h-4 text-[#801720] border-slate-350 rounded focus:ring-[#801720]/20 cursor-pointer accent-[#801720]"
                                            />
                                            <div className="flex-1 flex items-start gap-2.5">
                                                <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] flex-shrink-0 ${
                                                    isSelected ? 'bg-[#801720] text-white' : 'bg-slate-100 text-slate-650'
                                                 }`}>
                                                    {plo.kode_plo}
                                                </span>
                                                <p className="text-xs font-semibold text-slate-605 leading-relaxed pr-1">{plo.deskripsi}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-xs text-center py-6 text-slate-400 font-semibold">Tidak ada PLO yang cocok.</p>
                            )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold mt-4 pt-3 border-t border-slate-100">
                            Menampilkan {filteredPlos.length} dari {allPlo.length} data
                        </div>
                    </div>

                    {/* Right Panel: Selected PLO Table */}
                    <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/70 p-5 shadow-xs flex flex-col h-full">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xs font-extrabold text-slate-800">PLO yang Dipilih untuk Mata Kuliah Ini</h2>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                {selectedPloIds.length} item
                            </span>
                        </div>

                        <div className="flex-1 overflow-x-auto max-h-[480px] min-h-[380px] overflow-y-auto pr-1">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-20">Kode PLO</th>
                                        <th className="py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deskripsi PLO</th>
                                        <th className="py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-16 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {selectedPlosDetails.length > 0 ? (
                                        selectedPlosDetails.map((plo) => (
                                            <tr key={plo.id} className="hover:bg-slate-50/40 transition-colors">
                                                <td className="py-3 pr-2 align-top">
                                                    <span className="px-2 py-0.5 rounded bg-[#801720]/5 text-[#801720] border border-[#801720]/10 font-bold text-[10px]">
                                                        {plo.kode_plo}
                                                    </span>
                                                </td>
                                                <td className="py-3 pr-4 text-xs font-semibold text-slate-600 leading-relaxed align-top">
                                                    {plo.deskripsi}
                                                </td>
                                                <td className="py-3 text-center align-top">
                                                    <button
                                                        onClick={() => removePlo(plo.id)}
                                                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="py-8 text-center text-slate-400 text-xs font-bold italic">
                                                Belum ada PLO yang dipilih. Centang daftar di sebelah kiri.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold mt-4 pt-3 border-t border-slate-100">
                            Menampilkan {selectedPlosDetails.length} dari {selectedPloIds.length} data terpilih
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    {/* Left Panel: Select CLO */}
                    <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/70 p-5 shadow-xs flex flex-col h-full">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xs font-extrabold text-slate-800">CLO (Course Learning Outcome)</h2>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                {selectedCloIds.length} dipilih
                            </span>
                        </div>

                        {/* Search bar */}
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={cloSearch}
                                onChange={(e) => setCloSearch(e.target.value)}
                                placeholder="Cari CLO..."
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#801720]"
                            />
                        </div>

                        {/* Scrollable CLO list */}
                        <div className="space-y-2 flex-1 max-h-[480px] min-h-[380px] overflow-y-auto pr-1">
                            {filteredClos.length > 0 ? (
                                filteredClos.map((clo) => {
                                    const isSelected = selectedCloIds.includes(clo.id);
                                    // Global mapped PLO codes
                                    const mappedPlos = clo.plo ? clo.plo.map(p => p.kode_plo).join(', ') : '-';

                                    return (
                                        <div
                                            key={clo.id}
                                            onClick={() => toggleClo(clo.id)}
                                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                                                isSelected
                                                    ? 'border-[#801720] bg-[#801720]/5 shadow-xs'
                                                    : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                readOnly
                                                className="mt-0.5 w-4 h-4 text-[#801720] border-slate-355 rounded focus:ring-[#801720]/20 cursor-pointer accent-[#801720]"
                                            />
                                            <div className="flex-1 flex items-start gap-2.5">
                                                <div className="flex flex-col gap-1.5 flex-shrink-0">
                                                    <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] self-start ${
                                                        isSelected ? 'bg-[#801720] text-white' : 'bg-slate-100 text-slate-650'
                                                    }`}>
                                                        {clo.kode_clo}
                                                    </span>
                                                    {mappedPlos !== '-' && (
                                                        <span className="text-[8px] font-bold text-slate-405 uppercase tracking-wide">
                                                            Peta: {mappedPlos}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs font-semibold text-slate-600 leading-relaxed pr-1 mt-0.5">{clo.deskripsi}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-xs text-center py-6 text-slate-400 font-semibold">Tidak ada CLO yang cocok.</p>
                            )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold mt-4 pt-3 border-t border-slate-100">
                            Menampilkan {filteredClos.length} dari {allClo.length} data
                        </div>
                    </div>

                    {/* Right Panel: Selected CLO Table */}
                    <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/70 p-5 shadow-xs flex flex-col h-full">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xs font-extrabold text-slate-800">CLO yang Dipilih untuk Mata Kuliah Ini</h2>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                {selectedCloIds.length} item
                            </span>
                        </div>

                        <div className="flex-1 overflow-x-auto max-h-[480px] min-h-[380px] overflow-y-auto pr-1">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-20">Kode CLO</th>
                                        <th className="py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deskripsi CLO</th>
                                        <th className="py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-24">Bobot LO</th>
                                        <th className="py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-28">Mapping ke PLO</th>
                                        <th className="py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-16 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {selectedClosDetails.length > 0 ? (
                                        selectedClosDetails.map((clo, index) => {
                                            const mappedPlos = clo.plo ? clo.plo.map(p => p.kode_plo).join(', ') : '-';
                                            return (
                                                <tr key={clo.id} className="hover:bg-slate-50/40 transition-colors">
                                                    <td className="py-3 pr-2 align-top">
                                                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-150 font-bold text-[10px]">
                                                            {clo.kode_clo}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 pr-4 text-xs font-semibold text-slate-600 leading-relaxed align-top">
                                                        {clo.deskripsi}
                                                    </td>
                                                    <td className="py-3 pr-2 font-extrabold text-xs text-slate-700 align-top">
                                                        {cloWeights[index]}%
                                                    </td>
                                                    <td className="py-3 pr-2 align-top">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                            {mappedPlos}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-center align-top">
                                                        <button
                                                            onClick={() => removeClo(clo.id)}
                                                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="py-8 text-center text-slate-400 text-xs font-bold italic">
                                                Belum ada CLO yang dipilih. Centang daftar di sebelah kiri.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Note block at bottom of CLO table */}
                        {selectedClosDetails.length > 0 && (
                            <div className="mt-4 mb-2 flex items-start gap-2 bg-[#FFFBEB] p-2.5 rounded-xl border border-amber-200">
                                <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                <div className="text-[10px] leading-relaxed text-amber-700 font-bold">
                                    Catatan: Bobot LO menunjukkan kontribusi setiap CLO terhadap evaluasi. Total bobot LO dihitung merata agar berjumlah tepat 100%.
                                </div>
                            </div>
                        )}

                        <div className="text-[10px] text-slate-400 font-bold mt-4 pt-3 border-t border-slate-100">
                            Menampilkan {selectedClosDetails.length} dari {selectedCloIds.length} data terpilih
                        </div>
                    </div>
                </div>
            )}

            {/* Catatan Pemetaan bottom info box */}
            <div className="mt-6 bg-slate-50 border border-slate-200/60 p-4 rounded-2xl flex items-start gap-3 shadow-xs">
                <BookOpen className="w-5 h-5 text-[#801720] mt-0.5 flex-shrink-0" />
                <div className="space-y-0.5">
                    <h4 className="text-xs font-extrabold text-slate-800">Catatan Pemetaan</h4>
                    <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                        Pastikan pemetaan PLO dan CLO sesuai dengan kurikulum dan RPS mata kuliah. Pemetaan yang baik akan membantu proses evaluasi capaian pembelajaran.
                    </p>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
