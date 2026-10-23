import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()], esbuild: { legalComments: 'inline' }, server: { port: 5173, strictPort: true, proxy: { '/api': 'http://127.0.0.1:3001' } }, build: { outDir: 'dist', rollupOptions: { output: { banner: '/*! @license Third-party software notices: /THIRD_PARTY_NOTICES.txt */' } } } });
