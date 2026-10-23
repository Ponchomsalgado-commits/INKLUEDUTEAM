import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Un solo .env para todo el monorepo: se lee el de la raíz
  envDir: '..',
  server: {
    // En desarrollo, /api se reenvía al backend (en servidor lo hace Nginx, ver nginx.conf)
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
