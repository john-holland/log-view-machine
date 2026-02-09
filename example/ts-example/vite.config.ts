import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'spa-fallback',
      configureServer(server) {
        const handler = (req: any, res: any, next: () => void) => {
          const url = req.url ?? '';
          const isViteInternal = url.startsWith('/@') || url.startsWith('/node_modules');
          const isAsset = url.includes('.');
          if (
            req.method === 'GET' &&
            !url.startsWith('/api') &&
            !isViteInternal &&
            !isAsset &&
            url !== '/'
          ) {
            req.url = '/index.html';
          }
          next();
        };
        (server.middlewares as any).stack.unshift({ route: '', handle: handler });
      },
    },
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
}); 