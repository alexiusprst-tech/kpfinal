import React, { useEffect } from 'react';
import { showToast } from '@/Utils/sweetalert';

/**
 * Reusable Flash Alert Component
 * Automatically triggers SweetAlert2 toast notification and renders nothing in the inline page layout
 * @param {Object} props
 * @param {Object} props.flash - The flash object from usePage().props (contains success, error, info, warning)
 */
export default function FlashAlert({ flash }) {
    useEffect(() => {
        if (!flash) return;
        const message = flash.success || flash.error || flash.warning || flash.info;
        if (!message) return;

        const icon = flash.success ? 'success' : flash.error ? 'error' : flash.warning ? 'warning' : 'info';
        showToast(icon, message);

        // Inertia caches this page's props (including flash) in window.history.state.page
        // so a browser "back" navigation restores them without a server round-trip,
        // which would otherwise re-trigger this same toast every time. Strip the flash
        // from the cached history entry once it has been shown.
        const historyPage = window.history.state?.page;
        if (historyPage?.props?.flash) {
            window.history.replaceState(
                {
                    ...window.history.state,
                    page: {
                        ...historyPage,
                        props: { ...historyPage.props, flash: {} },
                    },
                },
                ''
            );
        }
    }, [flash?.success, flash?.error, flash?.info, flash?.warning]);

    return null;
}
