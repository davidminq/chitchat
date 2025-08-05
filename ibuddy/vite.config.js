import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/ibuddy/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000
  }
});