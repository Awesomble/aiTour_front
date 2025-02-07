// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'url'
import { dirname, join, resolve } from 'path'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import tsconfigPaths from 'vite-tsconfig-paths'
import { VitePWA } from 'vite-plugin-pwa'

// ESM에서 __dirname 사용 설정
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  resolve: {
    alias: {
      '@': join(__dirname, 'src'),
      dayjs: resolve(__dirname, 'node_modules/dayjs')
    }
  },
  envPrefix: 'VITE_',
  plugins: [
    vue({
      template: { transformAssetUrls }
    }),
    VueI18nPlugin({
      include: resolve(__dirname, 'locales/**')
    }),
    vuetify({
      autoImport: true,
      styles: {
        configFile: 'src/assets/scss/settings.scss'
      }
    }),
    tsconfigPaths(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'safari-pinned-tab.svg'],
      manifest: {
        name: 'ViteTemplate',
        short_name: 'ViteTemplate',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  define: { 'process.env': {} },
  server: {
    port: 3333
  }
})