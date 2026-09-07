import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',

      includeAssets: [
        'branding/bross-logo.jpg',
        'icons/favicon-32.png',
        'icons/apple-touch-icon.png',
      ],

      manifest: {
        id: '/',

        name: 'Bross Work OS',
        short_name: 'Bross',

        description:
          'Bross Solutions internal work and organization management system',

        start_url: '/',
        scope: '/',

        display: 'standalone',

        background_color: '#f4f5f6',
        theme_color: '#202124',

        orientation: 'any',

        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },

          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },

          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },

      workbox: {
        cleanupOutdatedCaches: true,
      },

      devOptions: {
        enabled: true,
      },
    }),
  ],
})