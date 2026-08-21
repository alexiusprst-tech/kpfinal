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
    }, [flash?.success, flash?.error, flash?.info, flash?.warning]);

    return null;
}
