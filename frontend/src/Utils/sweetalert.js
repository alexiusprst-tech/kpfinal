import Swal from 'sweetalert2';

/**
 * Toast Mixin configured with modern aesthetics matching Telkom University theme
 */
export const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3500,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
    },
    customClass: {
        popup: 'swal2-custom-toast',
    }
});

const TOAST_ICONS = {
    success: `
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#15803d" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" stroke="#86efac" stroke-width="2" fill="#dcfce7"/>
            <path d="m8.5 12.5 2.5 2.5 5-5"/>
        </svg>
    `,
    error: `
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" stroke="#fca5a5" stroke-width="2" fill="#fee2e2"/>
            <path d="m15 9-6 6M9 9l6 6"/>
        </svg>
    `,
    warning: `
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b45309" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" stroke="#fcd34d" stroke-width="2" fill="#fef3c7"/>
            <path d="M12 8v4M12 16h.01"/>
        </svg>
    `,
    info: `
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" stroke="#93c5fd" stroke-width="2" fill="#dbeafe"/>
            <path d="M12 16v-4M12 8h.01"/>
        </svg>
    `,
};

let lastToast = { message: '', time: 0 };

/**
 * Helper to show toast notification
 * @param {'success' | 'error' | 'warning' | 'info'} icon 
 * @param {string} title 
 */
export const showToast = (icon = 'success', title = '') => {
    if (!title) return;
    const now = Date.now();
    if (lastToast.message === title && (now - lastToast.time) < 500) {
        return;
    }
    lastToast = { message: title, time: now };

    const iconHtml = TOAST_ICONS[icon] || TOAST_ICONS.success;
    const toastClass = `swal2-toast-${icon}`;

    return Toast.fire({
        icon,
        iconHtml,
        title,
        customClass: {
            popup: `swal2-custom-toast ${toastClass}`,
            icon: 'swal2-custom-toast-icon',
            title: 'swal2-custom-toast-title',
            timerProgressBar: `swal2-custom-progress-${icon}`,
        }
    });
};




/**
 * Helper to show standard alert modal
 */
export const showAlert = ({
    title = '',
    text = '',
    html = '',
    icon = 'info',
    confirmButtonText = 'Mengerti',
} = {}) => {
    return Swal.fire({
        title,
        text,
        html,
        icon,
        width: '23rem',
        confirmButtonText,
        confirmButtonColor: '#801720',
        customClass: {
            popup: 'swal2-custom-popup',
            title: 'swal2-custom-title',
            htmlContainer: 'swal2-custom-html',
            confirmButton: 'swal2-custom-confirm-btn',
            actions: 'swal2-custom-actions',
            icon: 'swal2-custom-icon',
        }
    });
};

/**
 * Helper for confirmation dialog (returns Promise with result.isConfirmed)
 */
export const showConfirm = ({
    title = 'Apakah Anda yakin?',
    text = 'Tindakan ini tidak dapat dibatalkan.',
    icon = 'warning',
    confirmButtonText = 'Ya, Lanjutkan',
    cancelButtonText = 'Batal',
    confirmButtonColor = '#801720',
    cancelButtonColor = '#64748B',
} = {}) => {
    return Swal.fire({
        title,
        text,
        icon,
        width: '23rem',
        showCancelButton: true,
        confirmButtonText,
        cancelButtonText,
        confirmButtonColor,
        cancelButtonColor,
        reverseButtons: true,
        customClass: {
            popup: 'swal2-custom-popup',
            title: 'swal2-custom-title',
            htmlContainer: 'swal2-custom-html',
            confirmButton: 'swal2-custom-confirm-btn',
            cancelButton: 'swal2-custom-cancel-btn',
            actions: 'swal2-custom-actions',
            icon: 'swal2-custom-icon',
        }
    });
};


export default Swal;
