import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',

      includeAssets: [
        'branding/product/white-short.png',
        'branding/product/black-short.png',
        'icons/favicon-32.png',
        'icons/apple-touch-icon.png',
      ],

      manifest: {
        id: '/',

        name: 'Project Management System',
        short_name: 'Workspace',

        description:
          'Project, people, and organization management workspace',

        start_url: '/',
        scope: '/',

        display: 'standalone',

        background_color: '#f5f6f8',
        theme_color: '#245cff',

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