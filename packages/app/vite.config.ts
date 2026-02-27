import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import { resolve } from 'node:path';

export default defineConfig({
  root: resolve(__dirname, 'src/renderer'),
  base: './',
  build: {
    outDir: resolve(__dirname, 'dist/renderer'),
    emptyOutDir: true,
  },
  plugins: [
    react(),
    electron([
      {
        // Main process
        entry: 'src/main/index.ts',
        vite: {
          build: {
            outDir: 'dist/main',
            sourcemap: true,
            rollupOptions: {
              external: ['electron', '@flint/core', '@flint/mcp'],
              output: { format: 'cjs' },
            },
          },
        },
      },
      {
        // Preload
        entry: 'src/preload/index.ts',
        onstart(options) {
          options.reload();
        },
        vite: {
          build: {
            outDir: 'dist/preload',
            sourcemap: 'inline',
            rollupOptions: {
              external: ['electron'],
              output: { format: 'cjs' },
            },
          },
        },
      },
    ]),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer'),
    },
  },
});
