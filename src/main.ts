import 'reset-css'
import './assets/css/mobiscroll.javascript.min.css'
import 'swiper/css'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import 'vue-toastification/dist/index.css'
import './assets/scss/main.scss'

import { createApp } from 'vue'
import { vuetify } from './plugins/vuetify'
import pinia from './store'
import i18n from './plugins/i18n'
import App from './App.vue'
import router from './router'
import { QuillEditor } from '@vueup/vue-quill'
import Toast from 'vue-toastification'
import { Amplify } from 'aws-amplify'
import amplifyConfig from './configs/amplify-config'
import { toastOptions } from '@/plugins/toast'

Amplify.configure(amplifyConfig  as any)
const app = createApp(App)

app.use(router)
app.use(vuetify)
app.use(pinia)
app.use(i18n)
app.use(Toast, toastOptions)
app.component('QuillEditor', QuillEditor)

app.mount('#app')
