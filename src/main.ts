import './assets/scss/main.scss'

import { createApp } from 'vue'
import { vuetify } from './plugins/vuetify'
import pinia from './store'
import i18n from './plugins/i18n'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(router)
app.use(vuetify)
app.use(pinia)
app.use(i18n)

app.mount('#app')
