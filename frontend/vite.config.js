import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import fs from 'fs';

const removeHotFile = () => {
    const hotPath = path.resolve(import.meta.dirname, '../backend/public/hot');
    if (fs.existsSync(hotPath)) {
        try { fs.unlinkSync(hotPath); } catch (e) {}
    }
};

/** Hapus seluruh folder build sebelum proses build agar tidak ada file lama tersisa */
const cleanBuildDir = () => {
    const buildDir = path.resolve(import.meta.dirname, '../backend/public/build');
    if (fs.existsSync(buildDir)) {
        try {
            fs.rmSync(buildDir, { recursive: true, force: true });
            console.log('\n[clean] Build directory cleared.');
        } catch (e) {
            console.warn('[clean] Could not clear build dir:', e.message);
        }
    }
};

export default defineConfig({
    plugins: [
        {
            name: 'clean-and-hot',
            buildStart() {
                removeHotFile();
                cleanBuildDir();
            },
            closeBundle() {
                removeHotFile();
            },
        },
        laravel({
            input: ['src/css/app.css', 'src/app.jsx'],
            refresh: true,
            publicDirectory: '../backend/public',
            buildDirectory: 'build',
        }),
        react(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(import.meta.dirname, './src'),
        },
    },
    server: {
        host: 'localhost',
        port: 5173,
        strictPort: true,
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
    build: {
        cssCodeSplit: true,
        chunkSizeWarningLimit: 700,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    // React + react-dom + scheduler (core runtime)
                    if (
                        id.includes('node_modules/react/') ||
                        id.includes('node_modules/react-dom/') ||
                        id.includes('node_modules/scheduler/')
                    ) {
                        return 'vendor-react';
                    }
                    // Inertia.js + router
                    if (id.includes('node_modules/@inertiajs/')) {
                        return 'vendor-inertia';
                    }
                    // Lucide icons — shared across many pages
                    if (id.includes('node_modules/lucide-react/')) {
                        return 'vendor-icons';
                    }
                    // SweetAlert2 — already lazy loaded in sweetalert.js
                    if (id.includes('node_modules/sweetalert2/')) {
                        return 'vendor-swal';
                    }
                    // NOTE: axios, chart.js, docx-preview are intentionally NOT
                    // placed here so rolldown bundles them only into the pages
                    // that actually use them (lazy dynamic imports).
                },
            },
        },
    },
});
