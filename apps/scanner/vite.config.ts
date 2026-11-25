import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
      },
      includeAssets: ['pwa-192x192.png', 'pwa-512x512.png', 'logo-dark.png'],
      manifest: {
        name: 'Scanner by Hectix',
        short_name: 'Hectix Scan',
        description: 'Aplikasi pemindai tiket & gelang event Hectix',
        theme_color: '#0C2D57',
        background_color: '#F8FAFC',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/uploads\//],
      },
    }),
  ],
  server: {
    port: 3003,
    allowedHosts: ['localhost', 'scanner-dev.hectix.id'],
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        headers: {
          'X-Forwarded-Host': 'scanner-dev.hectix.id',
        },
      },
    },
  },
})
