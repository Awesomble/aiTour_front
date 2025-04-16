// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      dayjs: path.resolve(__dirname, 'node_modules/dayjs')
    }
  },
  envPrefix: 'VITE_',
  plugins: [
    vue({
      template: { transformAssetUrls }
    }),
    VueI18nPlugin({
      include: path.resolve(__dirname, 'locales/**')
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
    port: 9000,
    watch: {
      usePolling: true
    }
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