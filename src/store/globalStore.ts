import { ref, type Ref } from 'vue'
import { defineStore } from 'pinia'
import VueCookies from 'vue-cookies'

const useGlobalStore = defineStore('global', () => {
  const isNavigation: Ref<boolean> = ref(false)
  const lat: Ref<number> = ref(37.5663)
  const long: Ref<number> = ref(126.9779)

  function setNavi(display: boolean): void {
    isNavigation.value = display
  }
  function setGPS(latitude: number, longitude: number): void {
    lat.value = latitude
    long.value = longitude
  }
  return { setNavi, isNavigation, setGPS, lat, long }
})

export default useGlobalStore
