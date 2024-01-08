import { createPinia, type Pinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import useGlobalStore from '@/store/globalStore'

// pinia persist
const pinia : Pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

export default pinia
export { useGlobalStore }