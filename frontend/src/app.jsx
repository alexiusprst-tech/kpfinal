import './bootstrap';
import './css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { Chart as ChartJS } from 'chart.js';

// Default Chart.js typography across entire app to Inter
if (ChartJS?.defaults?.font) {
    ChartJS.defaults.font.family = "'Inter', system-ui, sans-serif";
}

const appName = window.document.getElementsByTagName('title')[0]?.innerText || 'Sistem Verifikasi Soal';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(<App {...props} />);
    },
    progress: {
        color: '#CD202E',
    },
});
