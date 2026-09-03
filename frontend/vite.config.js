import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import fs from 'fs';

const removeHotFile = () => {
    const hotPath = path.resolve(import.meta.dirname, '../backend/public/hot');
    if (fs.existsSync(hotPath)) {
        try {
            fs.unlinkSync(hotPath);
        } catch (e) {}
    }
};

export default defineConfig({
    plugins: [
        {
            name: 'clean-hot-file',
            buildStart() {
                removeHotFile();
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
});
