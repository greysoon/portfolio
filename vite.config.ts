import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { dashboardLocalApiPlugin } from './tools/dashboardLocalApi.mjs';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), dashboardLocalApiPlugin(env)],
    server: {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      },
    },
    preview: {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            three: ['three'],
            antd: ['antd', '@ant-design/icons'],
            vendor: ['react', 'react-dom', 'dayjs', 'posthog-js'],
            recorder: ['posthog-js/dist/posthog-recorder'],
          },
        },
      },
    },
  };
});
