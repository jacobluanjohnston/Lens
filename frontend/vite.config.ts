import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In Docker the frontend container reaches the backend via the service name.
// Outside Docker (local npm run dev) it falls back to localhost.
const apiTarget = process.env.VITE_API_TARGET ?? 'http://localhost:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/incidents': apiTarget,
      '/categories': apiTarget,
      '/health':    apiTarget,
    },
  },
})

// https://vitejs.dev/config