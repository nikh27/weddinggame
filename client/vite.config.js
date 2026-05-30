import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,           // expose on LAN so phone can access
    proxy: {
      // proxy /api and /photos through to the game server
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/photos': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
