import React, { useState, useEffect } from "react";
import { Link, usePage, router } from "@inertiajs/react";
import {
    LayoutDashboard,
    Users,
    BookOpen,
    Target,
    Activity,
    Clock,
    FileCheck,
    FileText,
    LogOut,
    Menu,
    X,
    FolderKanban,
    Bell,
    PanelLeftClose,
    PanelLeftOpen,
    UserCircle2,
    ShieldCheck,
    Sparkles,
} from "lucide-react";
import { showToast, showConfirm } from "@/Utils/sweetalert";
import NotificationDropdown from "@/Components/NotificationDropdown";
import MustChangePasswordModal from "@/Components/MustChangePasswordModal";

function getNavSections(user, pathname = "") {
    if (!user) return [];

    if (user.role === "SUPER_ADMIN") {
        return [
            { type: "item", label: "Dashboard", href: "/superadmin/dashboard", icon: LayoutDashboard },
            { type: "divider", label: "Master Data" },
            { type: "item", label: "Periode Verifikasi", href: "/superadmin/periode", icon: Clock },
            { type: "item", label: "Mata Kuliah", href: "/superadmin/mata-kuliah", icon: BookOpen },
            { type: "item", label: "PLO", href: "/superadmin/plo", icon: Target },
            { type: "item", label: "CLO", href: "/superadmin/clo", icon: Activity },
            { type: "item", label: "Dosen", href: "/superadmin/dosen", icon: Users },
            { type: "divider", label: "Penugasan" },
            { type: "item", label: "Kelompok Verifikasi", href: "/superadmin/kelompok-verifikasi", icon: FolderKanban },
        ];
    }

    const isDualRole = user.has_dual_role || (user.is_koordinator && user.is_verifikator);
    const noAssignment = user.has_no_assignment;

    if (isDualRole) {
        let activeRole = "koordinator";
        if (pathname.startsWith("/verifikator")) {
            activeRole = "verifikator";
            if (typeof window !== "undefined") {
                sessionStorage.setItem("active_dual_role", "verifikator");
            }
        } else if (pathname.startsWith("/koordinator")) {
            activeRole = "koordinator";
            if (typeof window !== "undefined") {
                sessionStorage.setItem("active_dual_role", "koordinator");
            }
        } else if (typeof window !== "undefined") {
            const savedRole = sessionStorage.getItem("active_dual_role");
            if (savedRole) activeRole = savedRole;
        }

        if (activeRole === "verifikator") {
            return [
                { type: "item", label: "Dashboard", href: "/verifikator/dashboard", icon: LayoutDashboard },
                { type: "divider", label: "Verifikator Soal" },
                { type: "item", label: "Verifikasi Soal", href: "/verifikator/soal", icon: FileCheck },
                { type: "item", label: "Berita Acara", href: "/verifikator/berita-acara", icon: FileText },
            ];
        }

        return [
            { type: "item", label: "Dashboard", href: "/koordinator/dashboard", icon: LayoutDashboard },
            { type: "divider", label: "Koordinator MK" },
            { type: "item", label: "Upload Soal", href: "/koordinator/soal", icon: FileText },
        ];
    }

    if (user.is_verifikator || user.role === "VERIFIKATOR") {
        return [
            { type: "item", label: "Dashboard", href: "/verifikator/dashboard", icon: LayoutDashboard },
            { type: "divider", label: "Verifikator Soal" },
            { type: "item", label: "Verifikasi Soal", href: "/verifikator/soal", icon: FileCheck },
            { type: "item", label: "Berita Acara", href: "/verifikator/berita-acara", icon: FileText },
        ];
    }

    // Default Koordinator (may have no assignment)
    return [
        { type: "item", label: "Dashboard", href: "/koordinator/dashboard", icon: LayoutDashboard },
        { type: "divider", label: "Koordinator MK" },
        { type: "item", label: "Upload Soal", href: "/koordinator/soal", icon: FileText },
    ];
}

function isPathActive(item) {
    if (!item) return false;
    const href = typeof item === "string" ? item : item.href;
    const matchPaths = item?.matchPaths;

    if (typeof window === "undefined") return false;
    const path = window.location.pathname;

    if (matchPaths && Array.isArray(matchPaths)) {
        if (matchPaths.includes(path)) return true;
    }

    if (!href || href === "#") return false;
    if (["/superadmin/dashboard", "/koordinator/dashboard", "/verifikator/dashboard", "/profile"].includes(href)) {
        return path === href;
    }
    return path === href || path.startsWith(href + "/");
}

function NavLink({ item, collapsed }) {
    const Icon = item.icon;
    const active = isPathActive(item);

    if (item.disabled) {
        return (
            <div
                title={collapsed ? item.label : "Belum ada penugasan aktif"}
                className={[
                    "flex items-center gap-3.5 rounded-2xl text-sm font-bold transition-all duration-200 group relative",
                    collapsed ? "justify-center p-3" : "px-3 py-2.5",
                    "text-slate-300 cursor-not-allowed opacity-60 select-none",
                ].join(" ")}
            >
                <Icon className="w-5 h-5 flex-shrink-0 text-slate-300" />
                {!collapsed && (
                    <span className="tracking-tight truncate flex items-center gap-1.5">
                        {item.label}
                        <span className="text-[9px] font-extrabold uppercase bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-md border border-amber-200">Terkunci</span>
                    </span>
                )}
                {collapsed && (
                    <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-lg">
                        {item.label} (Belum ada penugasan)
                    </span>
                )}
            </div>
        );
    }

    return (
        <Link
            href={item.href}
            title={collapsed ? item.label : undefined}
            className={[
                "flex items-center gap-3.5 rounded-2xl text-sm font-bold transition-all duration-200 group relative",
                collapsed ? "justify-center p-3" : "px-3 py-2.5",
                active
                    ? "bg-[#801720] text-white shadow-md shadow-[#801720]/25"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            ].join(" ")}
        >
            <Icon className={`w-5 h-5 flex-shrink-0 ${active ? "text-white" : "text-slate-500 group-hover:text-slate-900"}`} />
            {!collapsed && <span className="tracking-tight truncate">{item.label}</span>}
            {collapsed && (
                <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-lg">
                    {item.label}
                </span>
            )}
        </Link>
    );
}

export default function AuthenticatedLayout({ children, title = "Dashboard" }) {
    const { auth, activePeriod, flash } = usePage().props;
    const user = auth?.user;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        if (!flash) return;
        const message = flash.success || flash.error || flash.warning || flash.info;
        if (message) {
            const icon = flash.success ? "success" : flash.error ? "error" : flash.warning ? "warning" : "info";
            showToast(icon, message);
        }
    }, [flash?.success, flash?.error, flash?.warning, flash?.info]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (auth?.user) {
                router.reload({ only: ["notifications"], preserveScroll: true, preserveState: true });
            }
        }, 15000);
        return () => clearInterval(interval);
    }, [auth?.user]);

    const handleLogout = async (e) => {
        e.preventDefault();
        const result = await showConfirm({
            title: "Konfirmasi Keluar",
            text: "Apakah Anda yakin ingin keluar dari sistem verifikasi?",
            icon: "question",
            confirmButtonText: "Ya, Keluar",
            cancelButtonText: "Batal",
            confirmButtonColor: "#801720",
        });
        if (result.isConfirmed) window.location.href = "/logout";
    };

    const pathname = typeof window !== "undefined" ? window.location.pathname : "";
    const navSections = getNavSections(user, pathname);

    return (
        <div className="min-h-screen bg-[#F0F3F8] flex flex-col lg:flex-row font-sans">

            {/* MOBILE TOPBAR */}
            <div className="lg:hidden bg-white text-slate-900 border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center p-1.5 flex-shrink-0 border border-slate-200">
                        <img src="/images/logo-telkom.png" alt="Telkom Logo" className="h-full w-auto object-contain" />
                    </div>
                    <span className="font-extrabold text-sm text-[#801720] tracking-tight">Verifikasi Soal</span>
                </div>
                <div className="flex items-center gap-2">
                    <NotificationDropdown align="right" />
                    <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 transition-all text-slate-700 cursor-pointer">
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* SIDEBAR */}
            <aside className={[
                "fixed inset-y-0 left-0 z-40 bg-white text-slate-800 flex flex-col",
                "transition-all duration-300 ease-in-out",
                "border-r border-slate-200/80 shadow-lg lg:shadow-none flex-shrink-0",
                "lg:sticky lg:top-0 lg:h-screen",
                mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
                sidebarCollapsed ? "w-[72px]" : "w-72",
            ].join(" ")}>

                <div className="flex flex-col h-full justify-between overflow-y-auto overflow-x-hidden py-6 px-3">

                    {/* Top */}
                    <div>
                        {/* Brand + Toggle */}
                        <div className={`flex items-center mb-8 pb-5 border-b border-slate-100 ${sidebarCollapsed ? "justify-center" : "justify-between px-1"}`}>
                            {!sidebarCollapsed && (
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm flex-shrink-0 p-1.5 border border-slate-200/80">
                                        <img src="/images/logo-telkom.png" alt="Telkom Logo" className="h-full w-auto object-contain" />
                                    </div>
                                    <div className="min-w-0">
                                        <h1 className="font-black text-sm leading-tight tracking-tight text-[#801720] truncate">Sistem Verifikasi</h1>
                                        <p className="text-[11px] text-slate-500 font-bold tracking-wide">Telkom University</p>
                                    </div>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => setSidebarCollapsed(c => !c)}
                                className="hidden lg:flex p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all flex-shrink-0"
                                title={sidebarCollapsed ? "Buka sidebar" : "Tutup sidebar"}
                            >
                                {sidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
                            </button>
                        </div>

                        {/* Nav */}
                        <nav className="space-y-0.5">
                            {navSections.map((section, idx) => {
                                if (section.type === "divider") {
                                    return sidebarCollapsed
                                        ? <div key={idx} className="my-3 mx-2 border-t border-slate-100" />
                                        : (
                                            <div key={idx} className="pt-5 pb-1.5 px-2">
                                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{section.label}</span>
                                            </div>
                                        );
                                }
                                return <NavLink key={idx} item={section} collapsed={sidebarCollapsed} />;
                            })}
                        </nav>
                    </div>

                    {/* Bottom */}
                    <div className="pt-5 border-t border-slate-100 space-y-2 mt-6">
                        {!sidebarCollapsed && (
                            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 text-xs">
                                <div className="text-[10px] uppercase font-extrabold text-slate-400 mb-1 tracking-wider">Periode Aktif</div>
                                <div className="flex items-center gap-2 font-extrabold text-slate-800 text-sm">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                                    <span className="truncate">{activePeriod?.nama || "Tidak ada periode"}</span>
                                </div>
                            </div>
                        )}

                        {sidebarCollapsed ? (
                            <div className="flex flex-col items-center gap-2">
                                <Link
                                    href="/profile"
                                    className={`w-9 h-9 rounded-full ${isPathActive('/profile') ? 'bg-[#801720] text-white shadow-md shadow-[#801720]/25 ring-2 ring-[#801720]' : 'bg-[#801720]/10 text-[#801720] hover:bg-[#801720]/20'} font-black text-sm flex items-center justify-center border border-[#801720]/20 transition-all group relative cursor-pointer`}
                                    title={`Profil Saya: ${user?.name}`}
                                >
                                    {user?.name ? user.name.substring(0, 2).toUpperCase() : "U"}
                                    <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-lg">
                                        Profil Saya
                                    </span>
                                </Link>
                                <button type="button" onClick={handleLogout} className="p-2 rounded-xl bg-slate-50 hover:bg-red-50 hover:text-red-600 text-slate-500 transition-all border border-slate-200/80 cursor-pointer" title="Keluar">
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className={`flex items-center justify-between p-2 rounded-2xl ${isPathActive('/profile') ? 'bg-[#801720]/10 border-[#801720]/30 shadow-xs' : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200/80'} transition-all border gap-2`}>
                                <Link
                                    href="/profile"
                                    className="flex items-center gap-2.5 overflow-hidden flex-1 min-w-0 group py-0.5 px-1 rounded-xl transition-all cursor-pointer"
                                    title="Buka Profil Saya"
                                >
                                    <div className={`w-8 h-8 rounded-full ${isPathActive('/profile') ? 'bg-[#801720] text-white' : 'bg-[#801720]/10 text-[#801720] group-hover:bg-[#801720] group-hover:text-white'} font-black text-sm flex items-center justify-center flex-shrink-0 border border-[#801720]/20 transition-colors`}>
                                        {user?.name ? user.name.substring(0, 2).toUpperCase() : "U"}
                                    </div>
                                    <div className="overflow-hidden min-w-0 flex-1">
                                        <p className={`text-xs font-extrabold ${isPathActive('/profile') ? 'text-[#801720]' : 'text-slate-800 group-hover:text-[#801720]'} truncate leading-tight transition-colors`}>
                                            {user?.name || "User"}
                                        </p>
                                        <p className="text-[10px] text-slate-500 truncate font-semibold">
                                            {user?.has_dual_role
                                                ? (pathname.startsWith("/verifikator") ? "Dosen Verifikator" : "Koordinator MK")
                                                : (user?.role || "User")}
                                        </p>
                                    </div>
                                </Link>
                                <button type="button" onClick={handleLogout} className="p-1.5 rounded-xl bg-slate-100 hover:bg-red-600 hover:text-white text-slate-500 transition-all flex-shrink-0 cursor-pointer" title="Keluar">
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                {children}
            </main>

            {/* MUST CHANGE PASSWORD POP-UP MODAL */}
            <MustChangePasswordModal open={!!user?.must_change_password_enforced} />
        </div>
    );
}
