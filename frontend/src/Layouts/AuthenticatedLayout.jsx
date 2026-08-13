import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    Users,
    BookOpen,
    Target,
    Activity,
    Calendar,
    Clock,
    FileCheck,
    FileText,
    LogOut,
    Menu,
    X,
    Shield,
    FolderKanban,
    ChevronDown,
    LifeBuoy,
} from 'lucide-react';

// Sidebar navigation according to role & DESIGN.md.
// A "group" renders as a collapsible section with an uppercase label
// (Master Data, Penugasan); a plain item renders directly (e.g. Dashboard).
function getNavSections(role) {
    if (role === 'SUPER_ADMIN') {
        return [
            { type: 'item', label: 'Dashboard', href: '/superadmin/dashboard', icon: LayoutDashboard },
            {
                type: 'group', label: 'Master Data', items: [
                    { label: 'Kategori Soal',      href: '/superadmin/kategori-soal', icon: FolderKanban },
                    { label: 'Tahun Ajaran',       href: '/superadmin/tahun-ajaran',  icon: Calendar },
                    { label: 'Periode Verifikasi', href: '/superadmin/periode',       icon: Clock },
                    { label: 'Mata Kuliah',        href: '/superadmin/mata-kuliah',   icon: BookOpen },
                    { label: 'PLO',                href: '/superadmin/plo',           icon: Target },
                    { label: 'CLO',                href: '/superadmin/clo',           icon: Activity },
                    { label: 'Dosen',              href: '/superadmin/dosen',         icon: Users },
                ],
            },
            {
                type: 'group', label: 'Penugasan', items: [
                    { label: 'Penugasan Koordinator', href: '/superadmin/penugasan-koordinator', icon: FileCheck },
                    { label: 'Penugasan Verifikator',  href: '/superadmin/penugasan-verifikator', icon: Shield },
                ],
            },
        ];
    }

    if (role === 'KOORDINATOR') {
        return [
            { type: 'item', label: 'Dashboard',        href: '/koordinator/dashboard', icon: LayoutDashboard },
            { type: 'item', label: 'Kelola Soal Saya', href: '/koordinator/soal',      icon: FileText },
        ];
    }

    if (role === 'VERIFIKATOR') {
        return [
            { type: 'item', label: 'Dashboard',       href: '/verifikator/dashboard', icon: LayoutDashboard },
            { type: 'item', label: 'Verifikasi Soal', href: '/verifikator/soal',      icon: FileCheck },
        ];
    }

    return [];
}

function isPathActive(href) {
    return href !== '#' && window.location.pathname === href;
}

function NavLink({ item }) {
    const Icon = item.icon;
    const active = isPathActive(item.href);
    return (
        <a
            href={item.href}
            className={`
                flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200
                ${active
                    ? 'bg-[#801720] text-white shadow-md shadow-[#801720]/25 scale-[1.02]'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:translate-x-1'
                }
            `}
        >
            <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : 'text-slate-500'}`} />
            <span className="tracking-tight">{item.label}</span>
        </a>
    );
}

function NavGroup({ group }) {
    const hasActiveChild = group.items.some(i => isPathActive(i.href));
    const [open, setOpen] = useState(true);

    return (
        <div>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 hover:text-slate-600 transition-colors"
            >
                <span>{group.label}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? '' : '-rotate-90'} ${hasActiveChild ? 'text-[#801720]' : ''}`} />
            </button>
            {open && (
                <div className="space-y-1 mt-1">
                    {group.items.map((item, idx) => <NavLink key={idx} item={item} />)}
                </div>
            )}
        </div>
    );
}

export default function AuthenticatedLayout({ children, title = 'Dashboard' }) {
    const { auth, activePeriod } = usePage().props;
    const user = auth?.user;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navSections = getNavSections(user?.role);

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
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-all text-slate-700"
                >
                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* SIDEBAR (Wider w-72 (288px), Clean White BG with Maroon Active Items) */}
            <aside className={`
                fixed inset-y-0 left-0 z-40 w-72 bg-white text-slate-800 flex flex-col justify-between p-6 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto border-r border-slate-200/80 shadow-lg lg:shadow-none flex-shrink-0
                ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="flex flex-col h-full justify-between overflow-y-auto">
                    <div>
                        {/* Brand Section */}
                        <div className="flex items-center gap-3.5 px-2 py-3 mb-6 border-b border-slate-100">
                            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm flex-shrink-0 p-2 border border-slate-200/80">
                                <img src="/images/logo-telkom.png" alt="Telkom Logo" className="h-full w-auto object-contain" />
                            </div>
                            <div>
                                <h1 className="font-black text-base leading-tight tracking-tight text-[#801720]">Sistem Verifikasi</h1>
                                <p className="text-xs text-slate-500 font-bold tracking-wide">Telkom University</p>
                            </div>
                        </div>

                        {/* Navigation Menu */}
                        <nav className="space-y-4">
                            {navSections.map((section, idx) => (
                                section.type === 'group'
                                    ? <NavGroup key={idx} group={section} />
                                    : <NavLink key={idx} item={section} />
                            ))}
                        </nav>
                    </div>

                    {/* Footer: Help, User & Period Card */}
                    <div className="pt-5 border-t border-slate-100 space-y-3 mt-6">
                        <a
                            href="#"
                            className="flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all"
                        >
                            <LifeBuoy className="w-4.5 h-4.5 flex-shrink-0 text-slate-400" />
                            Pusat Bantuan
                        </a>

                        {/* Active Period Indicator */}
                        <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 text-xs">
                            <div className="text-[10px] uppercase font-extrabold text-slate-400 mb-1 tracking-wider">Periode Aktif</div>
                            <div className="flex items-center gap-2 font-extrabold text-slate-800 text-sm">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="truncate">{activePeriod?.nama || 'Tidak ada periode'}</span>
                            </div>
                        </div>

                        {/* User Profile */}
                        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 transition-all border border-slate-200/80">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-9 h-9 rounded-full bg-[#801720]/10 text-[#801720] font-black text-sm flex items-center justify-center flex-shrink-0 border border-[#801720]/20">
                                    {user?.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm font-extrabold text-slate-800 truncate leading-tight">{user?.name || 'User'}</p>
                                    <p className="text-xs text-slate-500 truncate font-semibold">{user?.role}</p>
                                </div>
                            </div>
                            <a
                                href="/logout"
                                className="p-2 rounded-xl bg-slate-100 hover:bg-red-600 hover:text-white text-slate-500 transition-all flex-shrink-0 shadow-xs"
                                title="Keluar"
                            >
                                <LogOut className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
