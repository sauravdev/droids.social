import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react' , 'ngrok'],
  },
  server: {
    host: '0.0.0.0', // Allow external connections (not just localhost)
    port: 5173, // Use the same port as your Vite server
    strictPort: true, // Ensure the server uses the exact specified port
    cors: {
      origin: ['https://socialdroids.wisedroids.ai', 'https://4b5b-2401-4900-b98-a3ce-3817-5ce2-2074-47c7.ngrok-free.app/'],
      credentials: true, // Allow cookies if needed
    },
    allowedHosts: ['socialdroids.wisedroids.ai', '.ngrok-free.app'], // Explicitly allow these hosts
  }

});
