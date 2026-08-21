import React, { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
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
    Bell,
    Sparkles,
} from 'lucide-react';
import { showToast, showConfirm } from '@/Utils/sweetalert';


// Sidebar navigation according to role & DESIGN.md.
// A "group" renders as a collapsible section with an uppercase label
// (Master Data, Penugasan); a plain item renders directly (e.g. Dashboard).
function getNavSections(role) {
    if (role === 'SUPER_ADMIN') {
        return [
            { type: 'item', label: 'Dashboard', href: '/superadmin/dashboard', icon: LayoutDashboard },
            {
                type: 'group', label: 'Master Data', items: [
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
                    { label: 'Kelompok Verifikasi', href: '/superadmin/kelompok-verifikasi', icon: FolderKanban },
                ],
            },
        ];
    }

    if (role === 'KOORDINATOR' || role === 'DOSEN') {
        return [
            { type: 'item', label: 'Dashboard', href: '/koordinator/dashboard', icon: LayoutDashboard },
            {
                type: 'group', label: 'Lembar Soal', items: [
                    { label: 'Daftar Lembar Soal',    href: '/koordinator/soal',           icon: FileText },
                ],
            },
        ];
    }

    if (role === 'VERIFIKATOR') {
        return [
            { type: 'item', label: 'Dashboard',       href: '/verifikator/dashboard', icon: LayoutDashboard },
            { type: 'item', label: 'Verifikasi Soal', href: '/verifikator/soal',      icon: FileCheck },
            { type: 'item', label: 'Berita Acara',    href: '/verifikator/berita-acara', icon: FileText },
        ];
    }

    return [];
}

function isPathActive(href) {
    if (href === '#' || !href) return false;
    if (href === '/superadmin/dashboard' || href === '/koordinator/dashboard' || href === '/verifikator/dashboard') {
        return window.location.pathname === href;
    }
    return window.location.pathname === href || window.location.pathname.startsWith(href + '/');
}

function NavLink({ item }) {
    const Icon = item.icon;
    const active = isPathActive(item.href);
    return (
        <Link
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
        </Link>
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
    const { auth, activePeriod, notifications, flash } = usePage().props;
    const user = auth?.user;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showDrawer, setShowDrawer] = useState(false);

    const notifList = notifications?.list || [];
    const notifCount = notifications?.count || 0;

    // Trigger SweetAlert2 toast when flash message exists
    useEffect(() => {
        if (!flash) return;
        const message = flash.success || flash.error || flash.warning || flash.info;
        if (message) {
            const icon = flash.success ? 'success' : flash.error ? 'error' : flash.warning ? 'warning' : 'info';
            showToast(icon, message);
        }
    }, [flash?.success, flash?.error, flash?.warning, flash?.info]);

    useEffect(() => {
        const handleOpen = () => setShowDrawer(true);

        window.addEventListener('open-notifications', handleOpen);
        return () => window.removeEventListener('open-notifications', handleOpen);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (auth?.user) {
                router.reload({
                    only: ['notifications'],
                    preserveScroll: true,
                    preserveState: true,
                });
            }
        }, 15000);

        return () => clearInterval(interval);
    }, [auth?.user]);

    const handleReadAll = () => {
        router.post('/notifications/read-all', {}, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const handleReadSingle = (id) => {
        router.post(`/notifications/${id}/read`, {}, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const handleLogout = async (e) => {
        e.preventDefault();
        const result = await showConfirm({
            title: 'Konfirmasi Keluar',
            text: 'Apakah Anda yakin ingin keluar dari sistem verifikasi?',
            icon: 'question',
            confirmButtonText: 'Ya, Keluar',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#801720',
        });
        if (result.isConfirmed) {
            window.location.href = '/logout';
        }
    };

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
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowDrawer(true)}
                        className="relative p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-all text-slate-700"
                        title="Notifikasi"
                    >
                        <Bell className="w-5 h-5" />
                        {notifCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white animate-pulse">
                                {notifCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-all text-slate-700"
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* SIDEBAR (Wider w-72 (288px), Clean White BG with Maroon Active Items) */}
            <aside className={`
                fixed inset-y-0 left-0 z-40 w-72 bg-white text-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen border-r border-slate-200/80 shadow-lg lg:shadow-none flex-shrink-0
                ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="flex flex-col h-full justify-between overflow-y-auto p-6 lg:p-8 lg:pt-10">
                    <div>
                        {/* Brand Section */}
                        <div className="flex items-center gap-3.5 px-2 pb-5 mb-8 border-b border-slate-100">
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

                    {/* Footer: User & Period Card */}
                    <div className="pt-5 border-t border-slate-100 space-y-3 mt-6">
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
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="p-2 rounded-xl bg-slate-100 hover:bg-red-600 hover:text-white text-slate-500 transition-all flex-shrink-0 shadow-xs cursor-pointer"
                                title="Keluar"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>

                        </div>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                {children}
            </main>

            {/* NOTIFICATION DRAWER */}
            {showDrawer && (
                <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
                    <div className="absolute inset-0 overflow-hidden">
                        <div 
                            className="absolute inset-0 bg-slate-600/30 backdrop-blur-xs transition-opacity" 
                            onClick={() => setShowDrawer(false)}
                        />

                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                            <div className="pointer-events-auto w-screen max-w-md transform bg-white shadow-2xl transition-all duration-300 ease-in-out">
                                <div className="flex h-full flex-col overflow-y-scroll bg-white py-6 shadow-xl">
                                    {/* Header */}
                                    <div className="px-6 flex items-center justify-between border-b border-slate-100 pb-4">
                                        <div className="flex items-center gap-2">
                                            <Bell className="w-5 h-5 text-[#801720]" />
                                            <h2 className="text-lg font-extrabold text-slate-800" id="slide-over-title">Notifikasi</h2>
                                            {notifCount > 0 && (
                                                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                                    {notifCount} baru
                                                </span>
                                            )}
                                        </div>
                                        <button 
                                            type="button" 
                                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-500 transition-all cursor-pointer"
                                            onClick={() => setShowDrawer(false)}
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Actions */}
                                    {notifList.length > 0 && (
                                        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center text-xs">
                                            <span className="text-slate-500 font-semibold">Tampilkan {notifList.length} terbaru</span>
                                            <button 
                                                onClick={handleReadAll}
                                                className="text-[#801720] hover:text-[#6a1219] font-extrabold transition-colors cursor-pointer"
                                            >
                                                Tandai Semua Dibaca
                                            </button>
                                        </div>
                                    )}

                                    {/* Notification List */}
                                    <div className="relative mt-2 flex-1 px-4 sm:px-6">
                                        {notifList.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                                                <Bell className="w-12 h-12 text-slate-200 mb-3" />
                                                <p className="text-sm font-bold">Tidak ada notifikasi baru</p>
                                                <p className="text-xs text-slate-400 mt-1">Anda akan menerima pemberitahuan di sini saat ada pembaruan penugasan atau verifikasi soal.</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-slate-100">
                                                {notifList.map((notif) => (
                                                    <div 
                                                        key={notif.id} 
                                                        className={`py-4 px-2 rounded-xl transition-colors flex items-start justify-between gap-3 ${notif.is_read ? 'hover:bg-slate-50/50' : 'bg-rose-50/40 hover:bg-rose-50/70'}`}
                                                    >
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                {!notif.is_read && <span className="w-1.5 h-1.5 bg-red-600 rounded-full flex-shrink-0 animate-pulse" />}
                                                                <p className="text-sm font-bold text-slate-800 leading-snug">{notif.title}</p>
                                                            </div>
                                                            <p className="text-xs text-slate-600 font-semibold mt-1 leading-relaxed">{notif.message}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold mt-2">
                                                                {new Date(notif.created_at).toLocaleString('id-ID', {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </p>
                                                        </div>
                                                        {!notif.is_read && (
                                                            <button
                                                                onClick={() => handleReadSingle(notif.id)}
                                                                className="text-[10px] bg-white border border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-300 font-bold px-2 py-1 rounded-lg transition-all flex-shrink-0 cursor-pointer shadow-xs"
                                                                title="Tandai dibaca"
                                                            >
                                                                Tandai dibaca
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
