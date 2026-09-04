/// <reference types="vitest/config" />
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // Injected at build time; the client reads process.env.*.
        // No key => the app falls back to the offline pattern generator.
        'process.env.API_KEY': JSON.stringify(env.API_KEY || env.LLM_API_KEY || env.GLM_API_KEY || env.VITE_API_KEY || ''),
        'process.env.LLM_BASE_URL': JSON.stringify(env.LLM_BASE_URL || ''),
        'process.env.LLM_MODEL': JSON.stringify(env.LLM_MODEL || ''),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      test: {
        environment: 'jsdom',
        setupFiles: './test/setup.ts',
        globals: true,
      },
    };
});
