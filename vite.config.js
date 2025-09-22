import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'robots.txt'
      ],
      manifest: {
        name: 'Fishmap AI',
        short_name: 'Fishmap',
        description: 'Aplikasi monitoring ikan & cuaca untuk nelayan',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/diiki.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon2.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icons/diiki.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
});
