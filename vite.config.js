import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';


import path from 'path';

export default defineConfig({
    publicDir: 'public',
    build: {
        assetsInlineLimit: 0,
    },
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            refresh: true,
        }),
        react(),
    ],
    define: {
        'import.meta.env.VITE_PUSHER_APP_KEY': JSON.stringify(process.env.VITE_PUSHER_APP_KEY),
        'import.meta.env.VITE_PUSHER_APP_CLUSTER': JSON.stringify(process.env.VITE_PUSHER_APP_CLUSTER),
    },
    resolve: {
        alias: {
            '@': '/resources/js',
            '@storage': '/storage/app/public'
        }
    }
});
