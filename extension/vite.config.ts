import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
  ],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../../shared'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Give the content script a stable, predictable filename
        chunkFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'index.ts' && chunkInfo.facadeModuleId?.includes('content-scripts')) {
            return 'assets/content-script.js';
          }
          return 'assets/[name]-[hash].js';
        },
      },
    },
  },
});
