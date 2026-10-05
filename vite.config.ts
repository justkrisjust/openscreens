import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Use relative base so assets load correctly on GitHub Pages (/openscreens/) or any static subpath
  base: './',
  plugins: [
    react(),
    tailwindcss(),
  ],
})
