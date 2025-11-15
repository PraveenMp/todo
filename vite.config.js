import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/todo/', // Replace 'todo' with your GitHub repo name
  build: {
    outDir: 'dist',
  }
})
