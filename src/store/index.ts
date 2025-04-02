import { createPinia, type Pinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import useGlobalStore from '@/store/globalStore'
import useAuthStore from '@/store/authStore'
import useUserStore from '@/store/userStore'
import useMapStore from '@/store/mapStore'
import {useInventoryStore} from '@/store/inventoryStore'
import {useDialogStore} from '@/store/dialogStore'

// pinia persist
const pinia : Pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

export default pinia
export { useGlobalStore, useAuthStore, useUserStore, useDialogStore, useInventoryStore, useMapStore }