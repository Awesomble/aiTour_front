import { createI18n } from 'vue-i18n'

import kr from '../locales/kr.json'
import en from '../locales/en.json'

export default createI18n({
    locale: 'kr',
    fallbackLocale: 'kr',
    messages: {
        kr,
        en,
    },
})