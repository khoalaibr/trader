import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/trader/',
  build: {
    outDir: 'docs', // Si estás usando 'docs' para GitHub Pages
  },
})
