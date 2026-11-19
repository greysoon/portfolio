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
      target: 'es2022',
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            const normalized = id.replace(/\\/g, '/');
            if (normalized.includes('/node_modules/three/')) {
              return 'three';
            }
            if (
              normalized.includes('/node_modules/antd/') ||
              normalized.includes('/node_modules/@ant-design/') ||
              normalized.includes('/node_modules/rc-') ||
              normalized.includes('/node_modules/@rc-component/') ||
              normalized.includes('/node_modules/dayjs/')
            ) {
              return 'antd';
            }
            if (normalized.includes('/node_modules/posthog-js/dist/posthog-recorder')) {
              return 'recorder';
            }
            if (normalized.includes('/node_modules/posthog-js/')) {
              return 'posthog';
            }
            if (
              normalized.includes('/node_modules/react/') ||
              normalized.includes('/node_modules/react-dom/') ||
              normalized.includes('/node_modules/scheduler/')
            ) {
              return 'vendor';
            }
          },
        },
      },
    },
  };
});
