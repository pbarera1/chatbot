import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    css: {
        postcss: './postcss.config.cjs',
    },
    define: {
        // Replace process.env.NODE_ENV with a literal string for browser builds
        // This prevents "process is not defined" errors in the browser
        'process.env.NODE_ENV': JSON.stringify('production'),
    },
    build: {
        lib: {
            entry: './src/embed/index.tsx',
            name: 'Chatbot',
            fileName: 'chatbot',
            formats: ['iife'],
        },
        rollupOptions: {
            output: {
                inlineDynamicImports: true,
            },
        },
        outDir: 'dist/embed',
        emptyOutDir: true,
        cssCodeSplit: false,
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
