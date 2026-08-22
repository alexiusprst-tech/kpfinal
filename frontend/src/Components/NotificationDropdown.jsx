import React, { useState, useRef, useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import { Bell, Check, CheckCheck, Inbox, Clock, Sparkles, X, ChevronRight, Mail } from 'lucide-react';

function timeAgo(dateString) {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const diffSeconds = Math.floor((now - date) / 1000);
    if (diffSeconds < 60) return 'Baru saja';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} m lalu`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} j lalu`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays} h lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

const AVATAR_GRADIENTS = [
    'from-pink-400 to-rose-500 text-white',
    'from-indigo-400 to-purple-600 text-white',
    'from-blue-400 to-cyan-500 text-white',
    'from-amber-400 to-orange-500 text-white',
    'from-emerald-400 to-teal-500 text-white',
];

export default function NotificationDropdown({ align = 'right', className = '' }) {
    const { auth, notifications } = usePage().props;
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);

    const notifList = notifications?.list || [];
    const notifCount = notifications?.count || 0;
    const unreadList = notifList.filter(n => !n.is_read);

    // Handle outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };

        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open]);

    // Listen to global open event
    useEffect(() => {
        const handleGlobalOpen = () => setOpen(prev => !prev);
        window.addEventListener('open-notifications', handleGlobalOpen);
        return () => window.removeEventListener('open-notifications', handleGlobalOpen);
    }, []);

    const handleReadAll = (e) => {
        e.stopPropagation();
        router.post('/notifications/read-all', {}, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const handleReadSingle = (id, e) => {
        if (e) e.stopPropagation();
        router.post(`/notifications/${id}/read`, {}, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const getAvatarInitials = (title = '') => {
        const words = title.trim().split(' ');
        if (words.length >= 2) {
            return (words[0][0] + words[1][0]).toUpperCase();
        }
        return title.substring(0, 2).toUpperCase() || 'NT';
    };

    return (
        <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
            {/* Bell Trigger Button */}
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={`relative p-2.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    open
                        ? 'bg-slate-100 border-slate-300 text-slate-900 shadow-inner'
                        : 'bg-white border-slate-200 shadow-xs hover:bg-slate-50 hover:border-slate-300 text-slate-700'
                }`}
                title="Notifikasi"
                aria-expanded={open}
            >
                <Bell className="w-5 h-5 text-slate-700" />
                {notifCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-[#801720] text-white rounded-full text-[10px] font-extrabold flex items-center justify-center border-2 border-white shadow-xs animate-pulse">
                        {notifCount > 99 ? '99+' : notifCount}
                    </span>
                )}
            </button>

            {/* Floating Popover Menu */}
            {open && (
                <div
                    className={`absolute z-50 mt-3 w-80 sm:w-96 md:w-[410px] bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] border border-slate-200/90 overflow-visible animate-in fade-in zoom-in-95 duration-150 ${
                        align === 'right'
                            ? 'right-0 origin-top-right'
                            : 'left-0 origin-top-left'
                    }`}
                >
                    {/* Top Pointer Arrow */}
                    <div
                        className={`absolute -top-2 w-4 h-4 bg-white rotate-45 border-t border-l border-slate-200/90 z-20 ${
                            align === 'right' ? 'right-4 sm:right-5' : 'left-4 sm:left-5'
                        }`}
                    />

                    <div className="relative z-10 flex flex-col max-h-[540px] bg-white rounded-3xl overflow-hidden">
                        {/* Header */}
                        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                                    Notifikasi
                                </h2>
                                {unreadList.length > 0 && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#801720] text-white">
                                        {unreadList.length} baru
                                    </span>
                                )}
                            </div>
                            {unreadList.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleReadAll}
                                    className="text-xs font-semibold text-slate-500 hover:text-[#801720] transition-colors cursor-pointer"
                                >
                                    Tandai semua dibaca
                                </button>
                            )}
                        </div>

                        {/* Notifications List */}
                        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                            {notifList.length === 0 ? (
                                <div className="py-12 px-6 flex flex-col items-center justify-center text-center">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                                        <Inbox className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-700">
                                        Tidak ada notifikasi
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
                                        Pemberitahuan aktivitas verifikasi & penugasan akan tampil di sini.
                                    </p>
                                </div>
                            ) : (
                                notifList.map((notif, index) => {
                                    const gradClass = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
                                    const initials = getAvatarInitials(notif.title);

                                    return (
                                        <div
                                            key={notif.id}
                                            onClick={() => !notif.is_read && handleReadSingle(notif.id)}
                                            className={`p-4 flex items-start gap-3.5 transition-colors cursor-pointer ${
                                                !notif.is_read
                                                    ? 'bg-slate-50/50 hover:bg-slate-100/60'
                                                    : 'bg-white hover:bg-slate-50/70'
                                            }`}
                                        >
                                            {/* Message Icon with Status Dot */}
                                            <div className="relative flex-shrink-0">
                                                <div
                                                    className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${gradClass} flex items-center justify-center shadow-xs`}
                                                >
                                                    <Mail className="w-4.5 h-4.5 text-white" />
                                                </div>
                                                <span
                                                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                                                        !notif.is_read ? 'bg-emerald-500' : 'bg-slate-300'
                                                    }`}
                                                />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-baseline justify-between gap-1">
                                                    <p className="text-xs text-slate-800 leading-snug">
                                                        <span className="font-bold text-slate-900">{notif.title}</span>{' '}
                                                        <span className="text-slate-600 font-medium">{notif.message}</span>
                                                    </p>
                                                </div>

                                                {/* Meta Info */}
                                                <p className="text-[11px] text-slate-400 font-semibold mt-1">
                                                    {timeAgo(notif.created_at)} • Sistem Verifikasi
                                                </p>
                                            </div>

                                            {/* Unread Purple/Maroon Dot Indicator */}
                                            {!notif.is_read && (
                                                <div className="flex flex-col items-center justify-center pt-1.5 flex-shrink-0">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED] ring-4 ring-purple-100" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Bottom Actions */}
                        {notifList.length > 0 && (
                            <div className="p-3 bg-slate-50/80 border-t border-slate-100 text-center">
                                <span className="text-[11px] font-semibold text-slate-400">
                                    Menampilkan {notifList.length} notifikasi terbaru
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
