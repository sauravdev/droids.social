import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  ...(mode === 'development' && {
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      cors: {
        origin: ['https://socialdroids.wisedroids.ai', 'https://your-ngrok-url.ngrok-free.app'],
        credentials: true,
      },
      allowedHosts: ['socialdroids.wisedroids.ai', 'your-ngrok-url.ngrok-free.app', 'droids.social'],
    }
  })
}));
