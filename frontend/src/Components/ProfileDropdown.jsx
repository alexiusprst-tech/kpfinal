import React, { useState, useEffect, useRef } from "react";
import { Link, usePage } from "@inertiajs/react";
import {
    UserCircle2,
    LogOut,
    ShieldCheck,
    BookOpen,
    FileCheck,
    ChevronDown,
} from "lucide-react";
import { showConfirm } from "@/Utils/sweetalert";

export default function ProfileDropdown({ align = "right", compact = false, showDivider = true, className = "" }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const [open, setOpen] = useState(false);
    const [imgError, setImgError] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        setImgError(false);
    }, [user?.avatar]);

    const userName = user?.name || "Pengguna";

    const initials = user?.name
        ? user.name
              .trim()
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((n) => n[0])
              .join("")
              .toUpperCase()
        : "U";

    const getRoleLabel = () => {
        if (user?.role === "SUPER_ADMIN") return "Super Administrator";
        if (user?.has_dual_role) {
            if (typeof window !== "undefined" && window.location.pathname.startsWith("/verifikator")) {
                return "Dosen Verifikator";
            }
            return "Koordinator MK";
        }
        if (user?.is_verifikator || user?.role === "VERIFIKATOR") return "Dosen Verifikator";
        if (user?.is_koordinator || user?.role === "KOORDINATOR") return "Koordinator MK";
        return user?.role || "Pengguna";
    };

    const roleLabel = getRoleLabel();

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };

        const handleKeyDown = (e) => {
            if (e.key === "Escape") setOpen(false);
        };

        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open]);

    const handleLogout = async (e) => {
        if (e) e.preventDefault();
        setOpen(false);
        const result = await showConfirm({
            title: "Konfirmasi Keluar",
            text: "Apakah Anda yakin ingin keluar dari sistem verifikasi?",
            icon: "question",
            confirmButtonText: "Ya, Keluar",
            cancelButtonText: "Batal",
            confirmButtonColor: "#801720",
        });
        if (result.isConfirmed) {
            window.location.href = "/logout";
        }
    };

    return (
        <div className={`relative inline-flex items-center text-left ${className}`} ref={dropdownRef}>
            {/* Vertical Divider matching user screenshot | */}
            {showDivider && !compact && (
                <div className="h-6 w-px bg-slate-300/80 mr-2 sm:mr-3 hidden sm:block" aria-hidden="true" />
            )}

            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="inline-flex items-center gap-1.5 p-1 rounded-full hover:bg-slate-100/80 transition-all duration-200 cursor-pointer select-none group focus:outline-hidden"
                title={`Profil Akun: ${userName}`}
                aria-label="Menu profil pengguna"
                aria-expanded={open}
                aria-haspopup="true"
            >
                {/* Circular Avatar Photo / Initials matching reference image */}
                <div className="w-9 h-9 rounded-full overflow-hidden bg-[#E8EDF5] ring-1 ring-slate-200/90 shadow-2xs flex items-center justify-center flex-shrink-0 group-hover:ring-slate-300 transition-all">
                    {user?.avatar && !imgError ? (
                        <img
                            src={user.avatar}
                            alt={userName}
                            className="w-full h-full object-cover rounded-full"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <span className="text-[#475569] font-bold text-xs tracking-tight select-none">
                            {initials}
                        </span>
                    )}
                </div>

                {/* Chevron Down Icon (v) matching reference */}
                <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 flex-shrink-0 ${
                        open ? "rotate-180 text-slate-800" : "group-hover:text-slate-700"
                    }`}
                />
            </button>

            {open && (
                <div
                    className={`absolute z-50 mt-2 w-64 sm:w-72 bg-white rounded-2xl shadow-[0_15px_40px_-5px_rgba(0,0,0,0.18)] border border-slate-200/90 overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
                        align === "right" ? "right-0 origin-top-right top-full" : "left-0 origin-top-left top-full"
                    }`}
                    role="menu"
                >
                    {/* Header info */}
                    <div className="p-4 bg-white border-b border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-[#E8EDF5] ring-2 ring-slate-200 shadow-xs flex-shrink-0 flex items-center justify-center">
                            {user?.avatar && !imgError ? (
                                <img
                                    src={user.avatar}
                                    alt={userName}
                                    className="w-full h-full object-cover rounded-full"
                                    onError={() => setImgError(true)}
                                />
                            ) : (
                                <div className="w-full h-full bg-[#E8EDF5] text-[#475569] font-bold text-sm flex items-center justify-center">
                                    {initials}
                                </div>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-black text-slate-800 truncate leading-tight" title={userName}>
                                {userName}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate font-medium mt-0.5" title={user?.email}>
                                {user?.email || "user@telkomuniversity.ac.id"}
                            </p>
                            <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-[#801720]/10 text-[#801720] text-[9px] font-black tracking-wide uppercase">
                                {user?.role === "SUPER_ADMIN" ? (
                                    <ShieldCheck className="w-3 h-3" />
                                ) : (
                                    <BookOpen className="w-3 h-3" />
                                )}
                                <span>{roleLabel}</span>
                            </div>
                        </div>
                    </div>

                    {/* Menu links */}
                    <div className="p-2 space-y-1">
                        <Link
                            href="/profile"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-[#801720]/5 hover:text-[#801720] transition-colors group cursor-pointer"
                            role="menuitem"
                        >
                            <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-[#801720]/10 text-slate-500 group-hover:text-[#801720] flex items-center justify-center transition-colors flex-shrink-0">
                                <UserCircle2 className="w-4 h-4" />
                            </div>
                            <div>
                                <span className="block font-black text-slate-800 group-hover:text-[#801720] leading-tight">Profil Saya</span>
                                <span className="block text-[10px] text-slate-400 font-medium mt-0.5">Kelola data akun & keamanan</span>
                            </div>
                        </Link>
                    </div>

                    {/* Logout Footer */}
                    <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors group cursor-pointer"
                            role="menuitem"
                        >
                            <div className="w-8 h-8 rounded-lg bg-red-100/70 text-red-600 flex items-center justify-center transition-colors flex-shrink-0">
                                <LogOut className="w-4 h-4" />
                            </div>
                            <div className="text-left">
                                <span className="block font-black text-red-700 leading-tight">Keluar</span>
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
