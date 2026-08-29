import React, { useState, useRef, useEffect } from "react";
import { useForm, usePage, router, Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    User,
    Lock,
    PenLine,
    CheckCircle,
    AlertCircle,
    Eye,
    EyeOff,
    Upload,
    Trash2,
    Save,
    ShieldCheck,
    BadgeCheck,
    Mail,
    Hash,
    BookOpen,
    Shield,
    KeyRound,
    Calendar,
    Layers,
    CheckCheck,
    FileCheck,
} from "lucide-react";
import { showToast, showConfirm } from "@/Utils/sweetalert";
import FlashAlert from "@/Components/FlashAlert";

function FieldLabel({ children }) {
    return (
        <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
            {children}
        </label>
    );
}

function InputField({ icon: Icon, ...props }) {
    return (
        <div className="relative">
            {Icon && (
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <Icon className="w-4 h-4 text-slate-400" />
                </div>
            )}
            <input
                {...props}
                className={[
                    "w-full rounded-xl border border-slate-200 bg-slate-50/70 text-sm font-semibold text-slate-800",
                    "focus:outline-none focus:ring-2 focus:ring-[#801720]/25 focus:border-[#801720] focus:bg-white transition-all",
                    "py-2.5 pr-4",
                    Icon ? "pl-10" : "px-4",
                    props.disabled ? "opacity-60 cursor-not-allowed bg-slate-100" : "",
                    props.className || "",
                ].join(" ")}
            />
        </div>
    );
}

function SelectField({ icon: Icon, children, ...props }) {
    return (
        <div className="relative">
            {Icon && (
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <Icon className="w-4 h-4 text-slate-400" />
                </div>
            )}
            <select
                {...props}
                className={[
                    "w-full rounded-xl border border-slate-200 bg-slate-50/70 text-sm font-semibold text-slate-800",
                    "focus:outline-none focus:ring-2 focus:ring-[#801720]/25 focus:border-[#801720] focus:bg-white transition-all appearance-none",
                    "py-2.5 pr-4",
                    Icon ? "pl-10" : "px-4",
                    props.disabled ? "opacity-60 cursor-not-allowed bg-slate-100" : "",
                ].join(" ")}
            >
                {children}
            </select>
        </div>
    );
}

function ErrorMsg({ message }) {
    if (!message) return null;
    return (
        <p className="flex items-center gap-1.5 text-xs text-red-600 font-semibold mt-1.5">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {message}
        </p>
    );
}

/* ── Section 1: Data Diri ──────────────────────────────────────── */
function SectionDataDiri({ user, dosen }) {
    const isSuperAdmin = user?.role === "SUPER_ADMIN" || user?.role === "SUPERADMIN";
    const isDosen = !!dosen;

    const { data, setData, put, processing, errors } = useForm({
        name:           user?.name || "",
        kode_dosen:     dosen?.kode_dosen || "",
        email_dosen:    dosen?.email || "",
        kategori_dosen: dosen?.kategori_dosen || "",
    });

    const submit = (e) => {
        e.preventDefault();
        put("/profile", {
            preserveScroll: true,
            onSuccess: () => showToast("success", "Profil data diri berhasil diperbarui."),
        });
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-7">
            <div className="flex items-center justify-between gap-3 pb-5 mb-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#801720]/10 text-[#801720] flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-extrabold text-slate-800">Data Diri & Akun</h2>
                        <p className="text-xs text-slate-400 font-medium">Informasi identitas dan rincian profil akun Anda.</p>
                    </div>
                </div>
            </div>

            <form onSubmit={submit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                        <FieldLabel>Nama Lengkap <span className="text-red-500">*</span></FieldLabel>
                        <InputField
                            icon={User}
                            type="text"
                            value={data.name}
                            onChange={e => setData("name", e.target.value)}
                            placeholder="Nama lengkap"
                            required
                        />
                        <ErrorMsg message={errors.name} />
                    </div>

                    <div>
                        <FieldLabel>Email Akun</FieldLabel>
                        <InputField icon={Mail} type="email" value={user?.email || ""} disabled />
                        <p className="text-[11px] text-slate-400 mt-1">Email utama login ke dalam sistem.</p>
                    </div>

                    {isSuperAdmin && !isDosen && (
                        <div>
                            <FieldLabel>Peran / Role Otoritas</FieldLabel>
                            <InputField icon={Shield} type="text" value="Super Administrator (Sistem)" disabled />
                            <p className="text-[11px] text-slate-400 mt-1">Hak akses penuh pengelola aplikasi.</p>
                        </div>
                    )}

                    {isDosen && (
                        <>
                            <div>
                                <FieldLabel>Kode Dosen</FieldLabel>
                                <InputField
                                    icon={Hash}
                                    type="text"
                                    value={data.kode_dosen}
                                    onChange={e => setData("kode_dosen", e.target.value)}
                                    placeholder="Contoh: DSN001"
                                />
                                <ErrorMsg message={errors.kode_dosen} />
                            </div>
                            <div>
                                <FieldLabel>Email Dosen (Institusi)</FieldLabel>
                                <InputField
                                    icon={Mail}
                                    type="email"
                                    value={data.email_dosen}
                                    onChange={e => setData("email_dosen", e.target.value)}
                                    placeholder="email@telkomuniversity.ac.id"
                                />
                                <ErrorMsg message={errors.email_dosen} />
                            </div>
                            <div>
                                <FieldLabel>Kategori Dosen</FieldLabel>
                                <SelectField
                                    icon={BookOpen}
                                    value={data.kategori_dosen}
                                    onChange={e => setData("kategori_dosen", e.target.value)}
                                >
                                    <option value="">— Pilih kategori —</option>
                                    <option value="TETAP">Dosen Tetap</option>
                                    <option value="LUAR_BIASA">Dosen Luar Biasa</option>
                                </SelectField>
                                <ErrorMsg message={errors.kategori_dosen} />
                            </div>
                        </>
                    )}
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#801720] text-white text-xs font-bold rounded-xl hover:bg-[#681219] disabled:opacity-60 transition-all shadow-sm shadow-[#801720]/20 cursor-pointer"
                    >
                        <Save className="w-4 h-4" />
                        {processing ? "Menyimpan..." : "Simpan Data Diri"}
                    </button>
                </div>
            </form>
        </div>
    );
}

/* ── Section 2: Keamanan Akun ──────────────────────────────────── */
function SectionPassword({ mustChange }) {
    const passwordCardRef = useRef(null);
    const { data, setData, post, processing, errors, reset } = useForm({
        current_password: "",
        password:         "",
        password_confirmation: "",
    });
    const [show, setShow] = useState({ current: false, new: false, confirm: false });

    useEffect(() => {
        if (mustChange && passwordCardRef.current) {
            passwordCardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [mustChange]);

    const submit = (e) => {
        e.preventDefault();
        post("/profile/password", {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                showToast("success", "Password berhasil diperbarui.");
            },
        });
    };

    const ToggleBtn = ({ field }) => (
        <button
            type="button"
            onClick={() => setShow(s => ({ ...s, [field]: !s[field] }))}
            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-700 cursor-pointer"
        >
            {show[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
    );

    return (
        <div
            ref={passwordCardRef}
            id="password-section"
            className={[
                "bg-white rounded-2xl border transition-all p-6 sm:p-7",
                mustChange ? "border-amber-400 ring-4 ring-amber-500/20 shadow-xl" : "border-slate-200/80 shadow-sm"
            ].join(" ")}
        >
            <div className="flex items-center justify-between gap-3 pb-5 mb-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <Lock className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-extrabold text-slate-800">Keamanan & Kata Sandi</h2>
                        <p className="text-xs text-slate-400 font-medium">Perbarui kata sandi akun Anda secara berkala.</p>
                    </div>
                </div>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <div className="flex items-start gap-3 p-3.5 bg-blue-50/60 rounded-xl border border-blue-100/80 text-xs">
                    <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-blue-700 font-medium leading-relaxed">
                        Gunakan minimal <strong>8 karakter</strong> kombinasi huruf besar, huruf kecil, dan angka untuk keamanan akun Anda.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <FieldLabel>Password Saat Ini <span className="text-red-500">*</span></FieldLabel>
                        <div className="relative">
                            <InputField
                                icon={Lock}
                                type={show.current ? "text" : "password"}
                                value={data.current_password}
                                onChange={e => setData("current_password", e.target.value)}
                                placeholder="Password saat ini"
                                className="pr-10"
                                required
                            />
                            <ToggleBtn field="current" />
                        </div>
                        <ErrorMsg message={errors.current_password} />
                    </div>

                    <div>
                        <FieldLabel>Password Baru <span className="text-red-500">*</span></FieldLabel>
                        <div className="relative">
                            <InputField
                                icon={Lock}
                                type={show.new ? "text" : "password"}
                                value={data.password}
                                onChange={e => setData("password", e.target.value)}
                                placeholder="Password baru"
                                className="pr-10"
                                required
                            />
                            <ToggleBtn field="new" />
                        </div>
                        <ErrorMsg message={errors.password} />
                    </div>

                    <div>
                        <FieldLabel>Konfirmasi Password <span className="text-red-500">*</span></FieldLabel>
                        <div className="relative">
                            <InputField
                                icon={Lock}
                                type={show.confirm ? "text" : "password"}
                                value={data.password_confirmation}
                                onChange={e => setData("password_confirmation", e.target.value)}
                                placeholder="Ulangi password"
                                className="pr-10"
                                required
                            />
                            <ToggleBtn field="confirm" />
                        </div>
                        {data.password && data.password_confirmation && (
                            <p className={`flex items-center gap-1 text-[11px] font-bold mt-1.5 ${data.password === data.password_confirmation ? "text-emerald-600" : "text-red-600"}`}>
                                {data.password === data.password_confirmation
                                    ? <><CheckCircle className="w-3 h-3" /> Password cocok</>
                                    : <><AlertCircle className="w-3 h-3" /> Password tidak cocok</>
                                }
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-all shadow-sm cursor-pointer"
                    >
                        <ShieldCheck className="w-4 h-4" />
                        {processing ? "Memperbarui..." : "Perbarui Password"}
                    </button>
                </div>
            </form>
        </div>
    );
}

/* ── Section 3: Tanda Tangan Digital ───────────────────────────── */
function SectionTandaTangan({ dosen, isSuperAdmin }) {
    const fileInputRef = useRef(null);
    const [dragOver, setDragOver]   = useState(false);
    const [preview,  setPreview]    = useState(null);
    const [file,     setFile]       = useState(null);
    const [uploading, setUploading] = useState(false);
    const [deleting,  setDeleting]  = useState(false);

    const currentSignature = dosen?.tanda_tangan || null;
    const isDosen = !!dosen;

    const handleFile = (f) => {
        if (!f) return;
        if (!["image/png", "image/jpeg", "image/jpg"].includes(f.type)) {
            showToast("error", "Format file harus PNG atau JPG.");
            return;
        }
        if (f.size > 2 * 1024 * 1024) {
            showToast("error", "Ukuran file maksimal 2 MB.");
            return;
        }
        setFile(f);
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target.result);
        reader.readAsDataURL(f);
    };

    const handleUpload = () => {
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append("tanda_tangan", file);
        router.post("/profile/signature", formData, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                setFile(null);
                setPreview(null);
                showToast("success", "Tanda tangan digital berhasil disimpan.");
            },
            onError: (errs) => showToast("error", errs.tanda_tangan || "Gagal mengunggah."),
            onFinish: () => setUploading(false),
        });
    };

    const handleDelete = async () => {
        const result = await showConfirm({
            title: "Hapus Tanda Tangan?",
            text: "Tanda tangan digital yang sudah terhapus tidak dapat dikembalikan.",
            icon: "warning",
            confirmButtonText: "Ya, Hapus",
            cancelButtonText: "Batal",
            confirmButtonColor: "#801720",
        });
        if (!result.isConfirmed) return;
        setDeleting(true);
        router.delete("/profile/signature", {
            preserveScroll: true,
            onSuccess: () => showToast("success", "Tanda tangan digital berhasil dihapus."),
            onError: () => showToast("error", "Gagal menghapus tanda tangan."),
            onFinish: () => setDeleting(false),
        });
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between gap-3 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                        <PenLine className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-extrabold text-slate-800">Tanda Tangan Digital</h2>
                        <p className="text-xs text-slate-400 font-medium">Otomatis disematkan pada Berita Acara & Laporan Verifikasi.</p>
                    </div>
                </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 bg-amber-50/70 rounded-xl border border-amber-100 text-xs">
                <PenLine className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-amber-800 font-medium leading-relaxed">
                    Gunakan file gambar berformat <strong>PNG transparan</strong> agar hasil cetak Berita Acara dan dokumen lembar soal presisi.
                </p>
            </div>

            {/* Signature Preview if exists */}
            {currentSignature && !preview && (
                <div>
                    <FieldLabel>Tanda Tangan Aktif</FieldLabel>
                    <div className="relative rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col items-center gap-3">
                        <div
                            className="w-full max-w-[240px] h-32 rounded-xl flex items-center justify-center overflow-hidden border border-slate-200/80 bg-white"
                            style={{ background: "repeating-conic-gradient(#f1f5f9 0% 25%, #ffffff 0% 50%) 0 0/16px 16px" }}
                        >
                            <img
                                src={currentSignature}
                                alt="Tanda tangan digital"
                                className="max-h-full max-w-full object-contain drop-shadow-xs"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold rounded-xl transition-all border border-red-200 cursor-pointer disabled:opacity-60"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            {deleting ? "Menghapus..." : "Hapus Tanda Tangan"}
                        </button>
                    </div>
                </div>
            )}

            {/* Upload Box if Dosen or Admin with Dosen */}
            {isDosen ? (
                <>
                    <div>
                        <FieldLabel>{currentSignature ? "Ganti Tanda Tangan" : "Upload Tanda Tangan Baru"}</FieldLabel>
                        <div
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); }}
                            onClick={() => fileInputRef.current?.click()}
                            className={[
                                "relative rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 p-6",
                                "flex flex-col items-center justify-center gap-2.5 text-center",
                                dragOver
                                    ? "border-[#801720] bg-[#801720]/5 scale-[1.01]"
                                    : preview
                                        ? "border-emerald-400 bg-emerald-50/50"
                                        : "border-slate-300 bg-slate-50/60 hover:border-[#801720]/50 hover:bg-[#801720]/5",
                            ].join(" ")}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".png,.jpg,.jpeg"
                                className="hidden"
                                onChange={e => handleFile(e.target.files?.[0])}
                            />

                            {preview ? (
                                <div className="flex flex-col items-center gap-2.5">
                                    <div
                                        className="w-40 h-28 rounded-xl flex items-center justify-center overflow-hidden border border-slate-200 bg-white"
                                        style={{ background: "repeating-conic-gradient(#f1f5f9 0% 25%, #ffffff 0% 50%) 0 0/14px 14px" }}
                                    >
                                        <img src={preview} alt="Preview Tanda Tangan" className="max-h-full max-w-full object-contain" />
                                    </div>
                                    <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                                        <CheckCircle className="w-3.5 h-3.5" /> {file?.name}
                                    </p>
                                    <p className="text-[10px] text-slate-400">Klik untuk ganti file</p>
                                </div>
                            ) : (
                                <>
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                        <Upload className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-700">Pilih atau seret gambar ke sini</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">PNG atau JPG (Maks. 2 MB)</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {preview && (
                        <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => { setFile(null); setPreview(null); }}
                                className="px-3.5 py-2 text-xs text-slate-600 border border-slate-300 rounded-xl hover:bg-slate-100 font-semibold transition-all cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleUpload}
                                disabled={uploading}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#801720] text-white text-xs font-bold rounded-xl hover:bg-[#681219] disabled:opacity-60 transition-all shadow-sm cursor-pointer"
                            >
                                <Upload className="w-3.5 h-3.5" />
                                {uploading ? "Mengunggah..." : "Simpan Tanda Tangan"}
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 text-center space-y-2">
                    <CheckCheck className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">Otoritas Administratif Pusat</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                        Akun Super Admin memiliki kewenangan penuh mengelola seluruh data verifikasi dan mengesahkan konfigurasi sistem secara otomatis.
                    </p>
                </div>
            )}
        </div>
    );
}

/* ── Section 4: Hak Akses & Ringkasan Otoritas ─────────────────── */
function SectionHakAkses({ user, isDosen }) {
    const isSuperAdmin = user?.role === "SUPER_ADMIN" || user?.role === "SUPERADMIN";

    return (
        <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-800 font-bold">
                    <Shield className="w-4 h-4 text-[#801720]" />
                    <span>Hak Akses & Otoritas Sistem</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#801720]/10 text-[#801720]">
                    {user?.role || "USER"}
                </span>
            </div>

            {isSuperAdmin ? (
                <div className="space-y-2 text-slate-600">
                    <p className="leading-relaxed">
                        Anda memiliki hak akses <strong>Super Administrator</strong> dengan wewenang mengelola:
                    </p>
                    <ul className="space-y-1.5 pl-1">
                        <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#801720]" />
                            <span>Tahun Ajaran, Periode & Kelompok Verifikasi</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#801720]" />
                            <span>Master Data (Dosen, Mata Kuliah, CLO, PLO)</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#801720]" />
                            <span>Monitoring Bank Soal & Berita Acara</span>
                        </li>
                    </ul>
                </div>
            ) : (
                <div className="space-y-2 text-slate-600">
                    <p className="leading-relaxed">
                        Role akun Anda disinkronisasi secara otomatis berdasarkan penugasan aktif (Koordinator MK / Verifikator Soal) pada periode verifikasi yang sedang berjalan.
                    </p>
                </div>
            )}
        </div>
    );
}

/* ── Main Single Page ──────────────────────────────────────────── */
export default function ProfileIndex({ user, dosen }) {
    const { flash } = usePage().props;
    const isSuperAdmin = user?.role === "SUPER_ADMIN" || user?.role === "SUPERADMIN";
    const isDosen = !!dosen;
    const mustChange = !!user?.must_change_password;

    return (
        <AuthenticatedLayout title="Profil Saya">
            <Head title="Profil Saya" />
            <FlashAlert type="toast" flash={flash} />

            <div className="max-w-6xl mx-auto space-y-6">
                {mustChange && (
                    <div className="bg-amber-500 text-white rounded-3xl p-5 sm:p-6 shadow-xl shadow-amber-500/20 flex items-start gap-4 border border-amber-400">
                        <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <h3 className="font-extrabold text-sm uppercase tracking-wider">Perhatian: Wajib Ubah Password Login Pertama</h3>
                            <p className="text-xs font-semibold text-amber-50 leading-relaxed">
                                Demi keamanan akun Anda, silakan ubah password default pada form <strong>Keamanan & Kata Sandi</strong> di bawah ini. Anda baru dapat mengakses menu aplikasi lainnya setelah memperbarui password.
                            </p>
                        </div>
                    </div>
                )}

                {/* Header Banner Card */}
                <div className="bg-gradient-to-br from-white via-slate-50 to-slate-100 rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-96 h-96 bg-[#801720]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-4 sm:gap-5">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#801720] text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#801720]/20 border-2 border-white">
                                <span className="text-2xl sm:text-3xl font-black tracking-wider">
                                    {user?.name ? user.name.substring(0, 2).toUpperCase() : "U"}
                                </span>
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-tight">
                                        {user?.name}
                                    </h1>
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#801720]/10 text-[#801720] border border-[#801720]/20">
                                        <BadgeCheck className="w-3.5 h-3.5" /> {isSuperAdmin ? "SUPER ADMIN" : user?.role || "DOSEN"}
                                    </span>
                                    {isDosen && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                            <BookOpen className="w-3.5 h-3.5" /> {dosen.kategori_dosen === "TETAP" ? "Dosen Tetap" : dosen.kategori_dosen === "LUAR_BIASA" ? "Dosen Luar Biasa" : "Dosen"}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs sm:text-sm text-slate-500 font-medium flex items-center gap-2">
                                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {user?.email}
                                    {dosen?.kode_dosen && (
                                        <span className="text-slate-400">· Kode: <strong className="text-slate-700">{dosen.kode_dosen}</strong></span>
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-center bg-white px-3.5 py-2 rounded-2xl border border-slate-200 shadow-xs">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-extrabold text-slate-700">Akun Aktif</span>
                        </div>
                    </div>
                </div>

                {/* Unified 2-Column Responsive Layout for All Roles */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column (7 cols): Data Diri & Keamanan Kata Sandi */}
                    <div className="lg:col-span-7 space-y-6">
                        <SectionDataDiri user={user} dosen={dosen} />
                        <SectionPassword mustChange={mustChange} />
                    </div>

                    {/* Right Column (5 cols): Tanda Tangan Digital & Info Hak Akses */}
                    <div className="lg:col-span-5 space-y-6">
                        <SectionTandaTangan dosen={dosen} isSuperAdmin={isSuperAdmin} />
                        <SectionHakAkses user={user} isDosen={isDosen} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
