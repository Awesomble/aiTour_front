// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import tsconfigPaths from 'vite-tsconfig-paths'

// ESM에서 __dirname 사용 설정
const __filename = fileURLToPath(import.meta?.url)
const __dirname = dirname(__filename)

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
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
    tsconfigPaths()
  ],
  define: { 'process.env': {} },
  server: {
    port: 9000
  },
  build: {
    target: 'es2015',
    minify: 'terser',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'vuetify': ['vuetify']
        }
      }
    }
  }
})