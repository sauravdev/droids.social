import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: '0.0.0.0', // Allow external connections (not just localhost)
    port: 5173, // Use the same port as your Vite server
    strictPort: true, // Ensure the server uses the exact specified port
    cors: {
      origin: ['https://socialdroids.wisedroids.ai', 'https://your-ngrok-url.ngrok-free.app'],
      credentials: true, // Allow cookies if needed
    },
    allowedHosts: ['socialdroids.wisedroids.ai', 'your-ngrok-url.ngrok-free.app' , "droids.social"],
  }
});