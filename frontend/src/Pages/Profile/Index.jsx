import React, { useState, useRef } from "react";
import { useForm, usePage, router } from "@inertiajs/react";
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
    Camera,
} from "lucide-react";
import { showToast, showConfirm } from "@/Utils/sweetalert";

/* ── Helpers ──────────────────────────────────────────────────── */
function TabButton({ id, icon: Icon, label, active, onClick }) {
    return (
        <button
            type="button"
            onClick={() => onClick(id)}
            className={[
                "flex items-center gap-2.5 px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200 whitespace-nowrap",
                active
                    ? "bg-[#801720] text-white shadow-md"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
            ].join(" ")}
        >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
        </button>
    );
}

function FieldLabel({ children }) {
    return (
        <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
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
                    "w-full rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800",
                    "focus:outline-none focus:ring-2 focus:ring-[#801720]/30 focus:border-[#801720] transition-all",
                    "py-2.5 pr-4",
                    Icon ? "pl-10" : "px-4",
                    props.disabled ? "opacity-60 cursor-not-allowed" : "",
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
                    "w-full rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800",
                    "focus:outline-none focus:ring-2 focus:ring-[#801720]/30 focus:border-[#801720] transition-all appearance-none",
                    "py-2.5 pr-4",
                    Icon ? "pl-10" : "px-4",
                    props.disabled ? "opacity-60 cursor-not-allowed" : "",
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

/* ── Tab 1: Data Diri ──────────────────────────────────────────── */
function TabDataDiri({ user, dosen }) {
    const { data, setData, put, processing, errors, reset } = useForm({
        name:           user?.name || "",
        kode_dosen:     dosen?.kode_dosen || "",
        email_dosen:    dosen?.email || "",
        kategori_dosen: dosen?.kategori_dosen || "",
    });

    const submit = (e) => {
        e.preventDefault();
        put("/profile", {
            preserveScroll: true,
            onSuccess: () => showToast("success", "Profil berhasil diperbarui."),
        });
    };

    const isDosen = !!dosen;

    return (
        <form onSubmit={submit} className="space-y-6">
            {/* Info card */}
            <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-[#801720]/5 to-slate-50 rounded-2xl border border-[#801720]/10">
                <div className="w-16 h-16 rounded-2xl bg-[#801720]/10 flex items-center justify-center flex-shrink-0 border-2 border-[#801720]/20">
                    <span className="text-2xl font-black text-[#801720]">
                        {user?.name ? user.name.substring(0, 2).toUpperCase() : "U"}
                    </span>
                </div>
                <div>
                    <p className="font-black text-slate-800 text-lg">{user?.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#801720]/10 text-[#801720]">
                            <BadgeCheck className="w-3 h-3" /> {user?.role}
                        </span>
                        {isDosen && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                <BookOpen className="w-3 h-3" /> {dosen.kategori_dosen || "Dosen"}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Fields */}
            <div className="grid md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                    <FieldLabel>Nama Lengkap</FieldLabel>
                    <InputField
                        icon={User}
                        type="text"
                        value={data.name}
                        onChange={e => setData("name", e.target.value)}
                        placeholder="Nama lengkap"
                    />
                    <ErrorMsg message={errors.name} />
                </div>

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
                            <FieldLabel>Email Dosen</FieldLabel>
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

                {/* Read-only info */}
                <div>
                    <FieldLabel>Email Akun</FieldLabel>
                    <InputField icon={Mail} type="email" value={user?.email || ""} disabled />
                    <p className="text-[10px] text-slate-400 mt-1">Email akun tidak dapat diubah melalui profil.</p>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#801720] text-white text-sm font-bold rounded-xl hover:bg-[#681219] disabled:opacity-60 transition-all shadow-md shadow-[#801720]/20 cursor-pointer"
                >
                    <Save className="w-4 h-4" />
                    {processing ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
            </div>
        </form>
    );
}

/* ── Tab 2: Ganti Password ─────────────────────────────────────── */
function TabPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        current_password: "",
        password:         "",
        password_confirmation: "",
    });
    const [show, setShow] = useState({ current: false, new: false, confirm: false });

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
            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-700"
        >
            {show[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
    );

    return (
        <form onSubmit={submit} className="space-y-6 max-w-lg">
            {/* Security info */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-bold text-blue-800">Keamanan Kata Sandi</p>
                    <p className="text-xs text-blue-600 mt-0.5">
                        Gunakan minimal 8 karakter, gabungan huruf besar, kecil, dan angka.
                    </p>
                </div>
            </div>

            <div>
                <FieldLabel>Password Saat Ini</FieldLabel>
                <div className="relative">
                    <InputField
                        icon={Lock}
                        type={show.current ? "text" : "password"}
                        value={data.current_password}
                        onChange={e => setData("current_password", e.target.value)}
                        placeholder="Masukkan password saat ini"
                        className="pr-10"
                    />
                    <ToggleBtn field="current" />
                </div>
                <ErrorMsg message={errors.current_password} />
            </div>

            <div>
                <FieldLabel>Password Baru</FieldLabel>
                <div className="relative">
                    <InputField
                        icon={Lock}
                        type={show.new ? "text" : "password"}
                        value={data.password}
                        onChange={e => setData("password", e.target.value)}
                        placeholder="Password baru (min. 8 karakter)"
                        className="pr-10"
                    />
                    <ToggleBtn field="new" />
                </div>
                <ErrorMsg message={errors.password} />
            </div>

            <div>
                <FieldLabel>Konfirmasi Password Baru</FieldLabel>
                <div className="relative">
                    <InputField
                        icon={Lock}
                        type={show.confirm ? "text" : "password"}
                        value={data.password_confirmation}
                        onChange={e => setData("password_confirmation", e.target.value)}
                        placeholder="Ulangi password baru"
                        className="pr-10"
                    />
                    <ToggleBtn field="confirm" />
                </div>
                {/* Password match indicator */}
                {data.password && data.password_confirmation && (
                    <p className={`flex items-center gap-1.5 text-xs font-semibold mt-1.5 ${data.password === data.password_confirmation ? "text-emerald-600" : "text-red-600"}`}>
                        {data.password === data.password_confirmation
                            ? <><CheckCircle className="w-3.5 h-3.5" /> Password cocok</>
                            : <><AlertCircle className="w-3.5 h-3.5" /> Password tidak cocok</>
                        }
                    </p>
                )}
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#801720] text-white text-sm font-bold rounded-xl hover:bg-[#681219] disabled:opacity-60 transition-all shadow-md shadow-[#801720]/20 cursor-pointer"
                >
                    <ShieldCheck className="w-4 h-4" />
                    {processing ? "Memperbarui..." : "Perbarui Password"}
                </button>
            </div>
        </form>
    );
}

/* ── Tab 3: Tanda Tangan ───────────────────────────────────────── */
function TabTandaTangan({ dosen }) {
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
                showToast("success", "Tanda tangan berhasil diperbarui.");
            },
            onError: (errs) => showToast("error", errs.tanda_tangan || "Gagal mengunggah."),
            onFinish: () => setUploading(false),
        });
    };

    const handleDelete = async () => {
        const result = await showConfirm({
            title: "Hapus Tanda Tangan?",
            text: "Tanda tangan yang sudah terhapus tidak dapat dikembalikan.",
            icon: "warning",
            confirmButtonText: "Ya, Hapus",
            cancelButtonText: "Batal",
            confirmButtonColor: "#801720",
        });
        if (!result.isConfirmed) return;
        setDeleting(true);
        router.delete("/profile/signature", {
            preserveScroll: true,
            onSuccess: () => showToast("success", "Tanda tangan berhasil dihapus."),
            onError: () => showToast("error", "Gagal menghapus tanda tangan."),
            onFinish: () => setDeleting(false),
        });
    };

    if (!isDosen) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <Camera className="w-12 h-12 text-slate-200 mb-3" />
                <p className="text-sm font-bold text-slate-500">Fitur tanda tangan hanya tersedia untuk dosen.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-xl">
            {/* Info */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <PenLine className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-bold text-amber-800">Informasi Tanda Tangan</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                        Tanda tangan akan otomatis ditampilkan pada dokumen <strong>Berita Acara</strong> dan <strong>Laporan PDF</strong>.
                        Gunakan gambar dengan latar belakang transparan (PNG) untuk hasil terbaik.
                    </p>
                </div>
            </div>

            {/* Current signature */}
            {currentSignature && !preview && (
                <div>
                    <FieldLabel>Tanda Tangan Saat Ini</FieldLabel>
                    <div className="relative rounded-2xl border-2 border-slate-200 bg-slate-50 p-6 flex flex-col items-center gap-4">
                        {/* Checkered background for transparency */}
                        <div
                            className="w-full max-w-xs h-40 rounded-xl flex items-center justify-center overflow-hidden"
                            style={{ background: "repeating-conic-gradient(#e5e7eb 0% 25%, #f9fafb 0% 50%) 0 0/20px 20px" }}
                        >
                            <img
                                src={currentSignature}
                                alt="Tanda tangan"
                                className="max-h-full max-w-full object-contain drop-shadow-sm"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold rounded-xl transition-all border border-red-200 cursor-pointer disabled:opacity-60"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            {deleting ? "Menghapus..." : "Hapus Tanda Tangan"}
                        </button>
                    </div>
                </div>
            )}

            {/* Upload area */}
            <div>
                <FieldLabel>{currentSignature ? "Ganti Tanda Tangan" : "Upload Tanda Tangan"}</FieldLabel>
                <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); }}
                    onClick={() => fileInputRef.current?.click()}
                    className={[
                        "relative rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 p-8",
                        "flex flex-col items-center justify-center gap-3 text-center",
                        dragOver
                            ? "border-[#801720] bg-[#801720]/5 scale-[1.01]"
                            : preview
                                ? "border-emerald-400 bg-emerald-50"
                                : "border-slate-300 bg-slate-50 hover:border-[#801720]/50 hover:bg-[#801720]/5",
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
                        <div className="flex flex-col items-center gap-3">
                            <div
                                className="w-48 h-32 rounded-xl flex items-center justify-center overflow-hidden border border-slate-200"
                                style={{ background: "repeating-conic-gradient(#e5e7eb 0% 25%, #f9fafb 0% 50%) 0 0/16px 16px" }}
                            >
                                <img src={preview} alt="Preview" className="max-h-full max-w-full object-contain" />
                            </div>
                            <p className="text-xs font-bold text-emerald-700">✓ {file?.name}</p>
                            <p className="text-[10px] text-slate-500">Klik untuk ganti file</p>
                        </div>
                    ) : (
                        <>
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                                <Upload className="w-6 h-6 text-slate-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-700">Seret & lepas gambar di sini</p>
                                <p className="text-xs text-slate-500 mt-0.5">atau klik untuk memilih file</p>
                            </div>
                            <p className="text-[10px] text-slate-400 font-semibold">PNG, JPG — Maks. 2 MB</p>
                        </>
                    )}
                </div>
            </div>

            {preview && (
                <div className="flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={() => { setFile(null); setPreview(null); }}
                        className="px-4 py-2.5 text-sm text-slate-600 border border-slate-300 rounded-xl hover:bg-slate-100 font-semibold transition-all cursor-pointer"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleUpload}
                        disabled={uploading}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#801720] text-white text-sm font-bold rounded-xl hover:bg-[#681219] disabled:opacity-60 transition-all shadow-md shadow-[#801720]/20 cursor-pointer"
                    >
                        <Upload className="w-4 h-4" />
                        {uploading ? "Mengunggah..." : "Upload Tanda Tangan"}
                    </button>
                </div>
            )}
        </div>
    );
}

/* ── Main Page ─────────────────────────────────────────────────── */
const TABS = [
    { id: "data-diri",     icon: User,     label: "Data Diri" },
    { id: "password",      icon: Lock,     label: "Ganti Password" },
    { id: "tanda-tangan",  icon: PenLine,  label: "Tanda Tangan" },
];

export default function ProfileIndex({ user, dosen }) {
    const [activeTab, setActiveTab] = useState("data-diri");

    return (
        <AuthenticatedLayout title="Profil Saya">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Profil Saya</h1>
                    <p className="text-sm text-slate-500 mt-1">Kelola data diri, keamanan akun, dan tanda tangan digital Anda.</p>
                </div>

                {/* Tab bar */}
                <div className="bg-white rounded-2xl border border-slate-200 p-1.5 flex gap-1 overflow-x-auto">
                    {TABS.map(t => (
                        <TabButton
                            key={t.id}
                            id={t.id}
                            icon={t.icon}
                            label={t.label}
                            active={activeTab === t.id}
                            onClick={setActiveTab}
                        />
                    ))}
                </div>

                {/* Tab content */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8">
                    {activeTab === "data-diri"    && <TabDataDiri user={user} dosen={dosen} />}
                    {activeTab === "password"     && <TabPassword />}
                    {activeTab === "tanda-tangan" && <TabTandaTangan dosen={dosen} />}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
