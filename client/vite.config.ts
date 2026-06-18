import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Proxy: any request to /api from React gets forwarded to the Express server.
    // This means in React you write fetch('/api/habits') — not fetch('http://localhost:5000/api/habits').
    // This also avoids CORS issues during development.
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
