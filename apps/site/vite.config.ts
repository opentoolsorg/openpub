import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'

export default defineConfig({
  server: { port: 8000 },
  plugins: [
    tanstackStart({ prerender: { enabled: true, crawlLinks: false }, pages: [{ path: '/' }] }),
    react(),
    nitro(),
  ],
})
