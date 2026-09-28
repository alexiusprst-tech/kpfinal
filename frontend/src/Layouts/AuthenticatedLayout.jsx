
import React, { useState, useEffect } from "react";
import { Link, usePage, router } from "@inertiajs/react";
import {
    LayoutDashboard,
    Users,
    BookOpen,
    Target,
    Activity,
    Clock,
    History,
    FileCheck,
    FileText,
    Menu,
    X,
    FolderKanban,
    PanelLeftClose,
    PanelLeftOpen
} from "lucide-react";
import { showToast } from "@/Utils/sweetalert";
import NotificationDropdown from "@/Components/NotificationDropdown";
import ProfileDropdown from "@/Components/ProfileDropdown";
import MustChangePasswordModal from "@/Components/MustChangePasswordModal";

function getNavSections(user, pathname = "") {
    if (!user) return [];

    if (user.role === "SUPER_ADMIN") {
        return [
            { type: "item", label: "Beranda", href: "/superadmin/dashboard", icon: LayoutDashboard },
            { type: "divider", label: "Data Master" },
            { type: "item", label: "Periode Verifikasi", href: "/superadmin/periode", icon: Clock },
            { type: "item", label: "Mata Kuliah", href: "/superadmin/mata-kuliah", icon: BookOpen },
            { type: "item", label: "PLO", href: "/superadmin/plo", icon: Target },
            { type: "item", label: "CLO", href: "/superadmin/clo", icon: Activity },
            { type: "item", label: "Dosen", href: "/superadmin/dosen", icon: Users },
            { type: "divider", label: "Penugasan" },
            { type: "item", label: "Kelompok Verifikasi", href: "/superadmin/kelompok-verifikasi", icon: FolderKanban },
            { type: "divider", label: "Sistem" },
            { type: "item", label: "Log Aktivitas", href: "/superadmin/aktivitas", icon: History },
        ];
    }

    const isDualRole = user.has_dual_role || (user.is_koordinator && user.is_verifikator);

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
                { type: "item", label: "Beranda", href: "/verifikator/dashboard", icon: LayoutDashboard },
                { type: "divider", label: "Verifikator Soal" },
                { type: "item", label: "Verifikasi Soal", href: "/verifikator/soal", icon: FileCheck },
                { type: "item", label: "Berita Acara", href: "/verifikator/berita-acara", icon: FileText },
            ];
        }

        return [
            { type: "item", label: "Beranda", href: "/koordinator/dashboard", icon: LayoutDashboard },
            { type: "divider", label: "Koordinator MK" },
            { type: "item", label: "Kelompok Verifikasi", href: "/koordinator/kelompok-verifikasi", icon: FolderKanban },
            { type: "item", label: "Upload Soal", href: "/koordinator/soal", icon: FileText },
        ];
    }

    if (user.is_verifikator || user.role === "VERIFIKATOR") {
        return [
            { type: "item", label: "Beranda", href: "/verifikator/dashboard", icon: LayoutDashboard },
            { type: "divider", label: "Verifikator Soal" },
            { type: "item", label: "Verifikasi Soal", href: "/verifikator/soal", icon: FileCheck },
            { type: "item", label: "Berita Acara", href: "/verifikator/berita-acara", icon: FileText },
        ];
    }

    // Default Koordinator (may have no assignment)
    return [
        { type: "item", label: "Beranda", href: "/koordinator/dashboard", icon: LayoutDashboard },
        { type: "divider", label: "Koordinator MK" },
        { type: "item", label: "Kelompok Verifikasi", href: "/koordinator/kelompok-verifikasi", icon: FolderKanban },
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
                    "flex items-center gap-3 rounded-[6px] text-[14px] font-medium transition-colors duration-150 group relative",
                    collapsed ? "justify-center p-2.5" : "px-3 py-2.5",
                    "text-slate-300 cursor-not-allowed select-none",
                ].join(" ")}
            >
                <Icon className="w-4.5 h-4.5 flex-shrink-0 text-slate-300" />
                {!collapsed && (
                    <span className="tracking-tight truncate flex items-center gap-1.5">
                        {item.label}
                        <span className="text-[9px] font-bold uppercase bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-[4px] border border-slate-200">Terkunci</span>
                    </span>
                )}
                {collapsed && (
                    <span className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-[4px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-md">
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
                "flex items-center gap-3 rounded-[6px] text-[14px] transition-colors duration-150 group relative",
                collapsed ? "justify-center p-2.5" : "px-3 py-2.5",
                active
                    ? "bg-[#9E1B28]/8 text-[#9E1B28] font-semibold border-r-2 border-[#9E1B28]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium",
            ].join(" ")}
        >
            <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${active ? "text-[#9E1B28]" : "text-slate-400 group-hover:text-slate-600"}`} />
            {!collapsed && <span className="tracking-tight truncate">{item.label}</span>}
            {collapsed && (
                <span className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-[4px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-md">
                    {item.label}
                </span>
            )}
        </Link>
    );
}

export default function AuthenticatedLayout({ children, title = "Beranda" }) {
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

    // Polling notifikasi setiap 30 detik untuk non-admin (Koordinator & Verifikator)
    useEffect(() => {
        if (!user || user.role === 'SUPER_ADMIN') return;
        const interval = setInterval(() => {
            router.reload({ only: ['notifications'] });
        }, 30000);
        return () => clearInterval(interval);
    }, [user?.id, user?.role]);

    const pathname = typeof window !== "undefined" ? window.location.pathname : "";
    const navSections = getNavSections(user, pathname);
    const homeItem = navSections.find((item) => item.type === "item") || navSections[0];
    const homeHref = homeItem?.href || "/dashboard";

    return (
        <div className="min-h-screen bg-[#F4F6FA] flex flex-col lg:flex-row font-sans">

            {/* MOBILE TOPBAR */}
            <div className="lg:hidden bg-white text-slate-900 border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-50 shadow-2xs">
                <Link href={homeHref} className="flex items-center gap-2.5 cursor-pointer">
                    <img src="/images/logo-telkom.png" alt="Logo Telkom" className="h-11 w-auto object-contain flex-shrink-0" />
                    <span className="font-bold text-base text-[#9E1B28] tracking-tight">Verifikasi Soal</span>
                </Link>
                <div className="flex items-center gap-2">
                    {user?.role !== "SUPER_ADMIN" && (
                        <NotificationDropdown align="right" />
                    )}
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 rounded-[6px] bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors text-slate-700 cursor-pointer"
                        aria-label={mobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
                        aria-expanded={mobileMenuOpen}
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* SIDEBAR */}
            <aside className={[
                "fixed inset-y-0 left-0 z-40 bg-white text-slate-800 flex flex-col",
                "transition-all duration-300 ease-in-out",
                "border-r border-slate-200 shadow-sm lg:shadow-none flex-shrink-0",
                "lg:sticky lg:top-0 lg:h-screen",
                mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
                sidebarCollapsed ? "w-[72px]" : "w-64",
            ].join(" ")}>

                <div className="flex flex-col h-full justify-between py-5 px-3">

                    {/* Top */}
                    <div className="flex flex-col min-h-0 flex-1">
                        {/* Brand + Toggle */}
                        <div className={`flex items-center mb-5 pb-4 border-b border-slate-100 flex-shrink-0 ${sidebarCollapsed ? "justify-center" : "justify-between px-1"}`}>
                            {!sidebarCollapsed ? (
                                <Link href={homeHref} className="flex items-center gap-3 min-w-0 cursor-pointer select-none">
                                    <img src="/images/logo-telkom.png" alt="Logo Telkom" className="h-14 w-auto object-contain flex-shrink-0" />
                                    <div className="min-w-0">
                                        <h1 className="font-bold text-[15px] leading-tight tracking-tight text-slate-900 truncate">Sistem Verifikasi</h1>
                                        <p className="text-xs text-slate-500 font-medium tracking-wide">Telkom University</p>
                                    </div>
                                </Link>
                            ) : (
                                <Link href={homeHref} className="cursor-pointer select-none flex items-center justify-center" title="Beranda">
                                    <img src="/images/logo-telkom.png" alt="Logo Telkom" className="h-11 w-auto object-contain" />
                                </Link>
                            )}
                            <button
                                type="button"
                                onClick={() => setSidebarCollapsed(c => !c)}
                                className="hidden lg:flex p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors flex-shrink-0 cursor-pointer"
                                title={sidebarCollapsed ? "Buka sidebar" : "Tutup sidebar"}
                                aria-label={sidebarCollapsed ? "Buka sidebar" : "Tutup sidebar"}
                            >
                                {sidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
                            </button>
                        </div>

                        {/* Nav */}
                        <nav className="space-y-0.5 overflow-y-auto overflow-x-hidden flex-1 pr-1">
                            {navSections.map((section, idx) => {
                                if (section.type === "divider") {
                                    return sidebarCollapsed
                                        ? <div key={idx} className="my-2 mx-2 border-t border-slate-100" />
                                        : (
                                            <div key={idx} className="pt-4 pb-1 px-2">
                                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{section.label}</span>
                                            </div>
                                        );
                                }
                                return <NavLink key={idx} item={section} collapsed={sidebarCollapsed} />;
                            })}
                        </nav>
                    </div>

                    {/* Bottom Sidebar - Fitur Profile */}
                    <div className="pt-3 mt-3 border-t border-slate-100 flex-shrink-0">
                        <ProfileDropdown
                            variant="sidebar"
                            sidebarCollapsed={sidebarCollapsed}
                        />
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className={`flex-1 min-w-0 p-4 sm:p-6 lg:p-8 ${user?.must_change_password_enforced ? 'overflow-hidden pointer-events-none select-none' : 'overflow-y-auto'}`}>
                {children}
            </main>

            {/* MUST CHANGE PASSWORD POP-UP MODAL */}
            <MustChangePasswordModal open={!!user?.must_change_password_enforced} />
        </div>
    );
}
