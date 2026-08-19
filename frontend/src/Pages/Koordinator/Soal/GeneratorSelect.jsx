import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { BookOpen, ArrowRight, Sparkles } from 'lucide-react';

export default function GeneratorSelect({ assignments, activePeriode }) {
    return (
        <AuthenticatedLayout title="Pilih Mata Kuliah">
            <Head title="Pilih Mata Kuliah" />

            <div className="max-w-2xl mx-auto space-y-6 pt-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h1 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#801720]" /> Generator Lembar Soal
                    </h1>
                    <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                        Pilih salah satu mata kuliah yang Anda ampu pada periode aktif <strong>{activePeriode?.nama || '-'}</strong> untuk memulai generator template lembar soal.
                    </p>
                </div>

                <div className="grid gap-3">
                    {assignments.map(a => (
                        <Link
                            key={a.id}
                            href={`/koordinator/soal/create?mata_kuliah_id=${a.id}&tab=generator`}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between hover:border-[#801720]/30 hover:shadow-md transition-all duration-200 group cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[#801720]/10 flex items-center justify-center text-[#801720] flex-shrink-0 group-hover:bg-[#801720]/20 transition-colors">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-extrabold text-slate-800 group-hover:text-[#801720] transition-colors">{a.nama_mk}</p>
                                    <p className="text-xs text-slate-400 mt-0.5 font-semibold">{a.kode_mk}</p>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-[#801720] group-hover:translate-x-1.5 transition-all duration-200" />
                        </Link>
                    ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
