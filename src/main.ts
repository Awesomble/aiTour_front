import 'reset-css'
import './assets/css/mobiscroll.javascript.min.css'
import 'swiper/css'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import 'vue-toastification/dist/index.css'
import './assets/scss/main.scss'

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => registration.unregister())
  })
}

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

Amplify.configure(amplifyConfig)
const app = createApp(App)
const toastOptions = {
  position: 'bottom-center',
  timeout: 3000,
  closeOnClick: true,
  pauseOnFocusLoss: false,
  pauseOnHover: true,
  draggable: false,
  draggablePercent: 0.6,
  showCloseButtonOnHover: true,
  hideProgressBar: false,
  closeButton: 'button',
  icon: true,
  rtl: false,
  transition: 'Vue-Toastification__bounce',
  maxToasts: 3,
  newestOnTop: true,
  containerClassName: 'toast-container-compact',
  toastClassName: 'toast-compact',
  containerStyle: {
    bottom: '70px'
  }
}
app.use(router)
app.use(vuetify)
app.use(pinia)
app.use(i18n)
app.use(Toast, toastOptions)
app.component('QuillEditor', QuillEditor)

app.mount('#app')
