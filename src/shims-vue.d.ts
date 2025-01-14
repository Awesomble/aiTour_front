declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}
declare module 'vue3-markdown-it'
declare module 'vue3-google-map'
