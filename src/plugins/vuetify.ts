import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { en } from 'vuetify/locale'

export const vuetify = createVuetify({
    components,
    directives,
    theme: {
        defaultTheme: 'aitour',
        themes: {
            aitour: {
                colors: {
                    primary: '#1483C2',
                    secondary: '#fdcb6e',
                    success: '#00cec9',
                    warning: '#2d3436',
                    background: '#fff',
                    error: '#d63031',
                    info: '#0984e3',
                    gray: '#A0AEB5',
                    white: '#ffffff',
                    black: '#000000',
                },
                dark: false,
                variables: {},
            },
        },
    },
    locale: {
        locale: 'en',
        fallback: 'en',
        messages: { en },
    },
})