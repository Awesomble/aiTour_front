import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { ko } from 'vuetify/locale'

export const vuetify = createVuetify({
    components,
    directives,
    theme: {
        themes: {
            light: {
                colors: {
                    primary: '#41b883',
                    background: '#fff',
                    error: '#d63031',
                    info: '#0984e3',
                    secondary: '#fdcb6e',
                    success: '#00cec9',
                    surface: '#6c5ce7',
                    warning: '#2d3436',
                },
                dark: false,
                variables: {},
            },
        },
    },
    locale: {
        locale: 'ko',
        fallback: 'ko',
        messages: { ko },
    },
})