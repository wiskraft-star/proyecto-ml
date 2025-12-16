import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Vercel serverless functions are in the /api directory
  // We need to make sure they are not treated as client-side code by Vite
  server: {
    proxy: {
      '/api': 'http://localhost:3000' // During `vercel dev`, functions are served at the root. No proxy needed.
    }
  }
})
