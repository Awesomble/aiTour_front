import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import tsconfigPaths from 'vite-tsconfig-paths'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

import { join, resolve } from 'node:path'
export default defineConfig({
  mode: 'development',
  resolve: {
    alias: {
      '@': join(__dirname, './src'),
      dayjs: path.resolve(__dirname, 'node_modules/dayjs'),
      'maska/vue': path.resolve(__dirname, 'node_modules/maska/vue'),
    }
  },
  envPrefix: 'VITE_',
  plugins: [
    vue({
      template: {
        // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin#image-loading
        transformAssetUrls
      }
    }),
    VueI18nPlugin({
      include: resolve(__dirname, './locales/**')
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
  css: {},
  server: {
    port: 3333
  },
  optimizeDeps: {
    include: ['maska'],
  }
  // optimizeDeps: {
  //   include: ['dayjs'],
  // },
  // build: {
  //   rollupOptions: {
  //     external: ['dayjs'], // dayjs를 외부화
  //   },
  // },
})
