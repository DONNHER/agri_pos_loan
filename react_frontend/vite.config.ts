import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(({ mode }) => {
  const isPos = mode === 'pos';

  return {
    plugins: [react(), tailwindcss()],
    publicDir: 'frontend/public',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'frontend/loan'),
        '@pos': path.resolve(__dirname, 'frontend/pos'),
      },
    },
    build: {
      outDir: isPos ? 'dist/pos' : 'dist/loan',
      rollupOptions: {
        input: path.resolve(__dirname, isPos ? 'pos.html' : 'index.html'),
      },
    },
    server: {
      port: isPos ? 3002 : 3001,
      open: isPos ? '/pos.html' : '/',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
