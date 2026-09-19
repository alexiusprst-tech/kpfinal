import React, { useState, useEffect, useRef } from "react";
import { Link, usePage } from "@inertiajs/react";
import {
    UserCircle2,
    LogOut,
    ShieldCheck,
    BookOpen,
    ChevronDown
} from "lucide-react";
import { showConfirm } from "@/Utils/sweetalert";

export default function ProfileDropdown({
    align = "right",
    placement = "bottom",
    compact = false,
    showDivider = true,
    variant = "default",
    sidebarCollapsed = false,
    className = "",
}) {
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
            confirmButtonColor: "#9E1B28",
        });
        if (result.isConfirmed) {
            window.location.href = "/logout";
        }
    };

    const isSidebar = variant === "sidebar";

    return (
        <div className={`relative ${isSidebar ? "w-full" : "inline-flex items-center text-left"} ${className}`} ref={dropdownRef}>
            {/* Vertical Divider matching header screenshot */}
            {showDivider && !compact && !isSidebar && (
                <div className="h-6 w-px bg-slate-300/80 mr-2 sm:mr-3 hidden sm:block" aria-hidden="true" />
            )}

            {isSidebar ? (
                /* Sidebar Trigger */
                sidebarCollapsed ? (
                    <button
                        type="button"
                        onClick={() => setOpen(!open)}
                        className="w-full flex items-center justify-center p-1.5 rounded-[6px] hover:bg-slate-100 transition-colors duration-150 cursor-pointer select-none group focus:outline-hidden"
                        title={`Profil: ${userName} (${roleLabel})`}
                        aria-label="Menu profil pengguna"
                        aria-expanded={open}
                        aria-haspopup="true"
                    >
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center flex-shrink-0 group-hover:ring-slate-300 transition-all">
                            {user?.avatar && !imgError ? (
                                <img
                                    src={user.avatar}
                                    alt={userName}
                                    className="w-full h-full object-cover rounded-full"
                                    onError={() => setImgError(true)}
                                />
                            ) : (
                                <span className="text-slate-700 font-semibold text-xs tracking-tight select-none">
                                    {initials}
                                </span>
                            )}
                        </div>
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => setOpen(!open)}
                        className="w-full flex items-center justify-between p-2 rounded-[6px] hover:bg-slate-100/80 transition-colors duration-150 cursor-pointer select-none group text-left border border-slate-200/90 bg-slate-50/60"
                        title={`Profil: ${userName}`}
                        aria-label="Menu profil pengguna"
                        aria-expanded={open}
                        aria-haspopup="true"
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 ring-1 ring-slate-300 flex items-center justify-center flex-shrink-0">
                                {user?.avatar && !imgError ? (
                                    <img
                                        src={user.avatar}
                                        alt={userName}
                                        className="w-full h-full object-cover rounded-full"
                                        onError={() => setImgError(true)}
                                    />
                                ) : (
                                    <span className="text-slate-700 font-semibold text-xs tracking-tight select-none">
                                        {initials}
                                    </span>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
                                    {userName}
                                </p>
                                <p className="text-[10px] text-slate-500 font-normal truncate mt-0.5">
                                    {roleLabel}
                                </p>
                            </div>
                        </div>
                        <ChevronDown
                            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 flex-shrink-0 ml-1 ${
                                open ? "rotate-180 text-slate-600" : "group-hover:text-slate-600"
                            }`}
                        />
                    </button>
                )
            ) : (
                /* Header / Topbar Trigger */
                <button
                    type="button"
                    onClick={() => setOpen(!open)}
                    className="inline-flex items-center gap-1.5 p-1 rounded-full hover:bg-slate-100 transition-colors duration-150 cursor-pointer select-none group focus:outline-hidden"
                    title={`Profil Akun: ${userName}`}
                    aria-label="Menu profil pengguna"
                    aria-expanded={open}
                    aria-haspopup="true"
                >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-[#E8EDF5] ring-1 ring-slate-200 shadow-2xs flex items-center justify-center flex-shrink-0 group-hover:ring-slate-300 transition-all">
                        {user?.avatar && !imgError ? (
                            <img
                                src={user.avatar}
                                alt={userName}
                                className="w-full h-full object-cover rounded-full"
                                onError={() => setImgError(true)}
                            />
                        ) : (
                            <span className="text-[#475569] font-semibold text-xs tracking-tight select-none">
                                {initials}
                            </span>
                        )}
                    </div>
                    <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-150 flex-shrink-0 ${
                            open ? "rotate-180 text-slate-800" : "group-hover:text-slate-700"
                        }`}
                    />
                </button>
            )}

            {open && (
                <div
                    className={
                        isSidebar
                            ? sidebarCollapsed
                                ? "absolute z-50 bottom-0 left-full ml-3 w-64 bg-white rounded-[8px] shadow-lg border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                                : "absolute z-50 bottom-full mb-2 left-0 right-0 w-full min-w-[240px] bg-white rounded-[8px] shadow-lg border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                            : `absolute z-50 ${placement === "top" ? "bottom-full mb-2" : "mt-2 top-full"} w-64 sm:w-72 bg-white rounded-[8px] shadow-lg border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
                                  align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left"
                              }`
                    }
                    role="menu"
                >
                    {/* Header info */}
                    <div className="p-3.5 bg-white border-b border-slate-100 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 ring-1 ring-slate-200 flex-shrink-0 flex items-center justify-center">
                            {user?.avatar && !imgError ? (
                                <img
                                    src={user.avatar}
                                    alt={userName}
                                    className="w-full h-full object-cover rounded-full"
                                    onError={() => setImgError(true)}
                                />
                            ) : (
                                <div className="w-full h-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center">
                                    {initials}
                                </div>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 truncate leading-tight" title={userName}>
                                {userName}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate font-normal mt-0.5" title={user?.email}>
                                {user?.email || "user@telkomuniversity.ac.id"}
                            </p>
                            <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-[4px] bg-[#9E1B28]/10 text-[#9E1B28] text-[9px] font-semibold tracking-wide uppercase">
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
                    <div className="p-1.5 space-y-0.5">
                        <Link
                            href="/profile"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2.5 px-2.5 py-2 rounded-[6px] text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors group cursor-pointer"
                            role="menuitem"
                        >
                            <div className="w-7 h-7 rounded-[4px] bg-slate-100 group-hover:bg-[#9E1B28]/10 text-slate-500 group-hover:text-[#9E1B28] flex items-center justify-center transition-colors flex-shrink-0">
                                <UserCircle2 className="w-3.5 h-3.5" />
                            </div>
                            <div>
                                <span className="block font-semibold text-slate-900 leading-tight">Profil Saya</span>
                                <span className="block text-[10px] text-slate-500 font-normal mt-0.5">Kelola data akun & keamanan</span>
                            </div>
                        </Link>
                    </div>

                    {/* Logout Footer */}
                    <div className="p-1.5 border-t border-slate-100 bg-slate-50/70">
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[6px] text-xs font-medium text-red-700 hover:bg-red-50 transition-colors group cursor-pointer"
                            role="menuitem"
                        >
                            <div className="w-7 h-7 rounded-[4px] bg-red-100 text-red-700 flex items-center justify-center transition-colors flex-shrink-0">
                                <LogOut className="w-3.5 h-3.5" />
                            </div>
                            <div className="text-left">
                                <span className="block font-semibold text-red-800 leading-tight">Keluar</span>
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
