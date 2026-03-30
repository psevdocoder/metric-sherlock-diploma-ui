import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const apiProxyTarget = env.VITE_API_PROXY_TARGET?.trim();

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 4500,
      proxy: apiProxyTarget
        ? {
            '/api': {
              target: apiProxyTarget,
              changeOrigin: true,
            },
          }
        : undefined,
    },
    preview: {
      host: '0.0.0.0',
      port: 4500,
    },
  };
});
