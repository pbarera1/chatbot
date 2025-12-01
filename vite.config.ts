import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    css: {
        postcss: './postcss.config.cjs',
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
