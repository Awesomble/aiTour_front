import { ref, type Ref } from 'vue'
import { defineStore } from 'pinia'

const useGlobalStore = defineStore('global', () => {
  const isNavigation: Ref<boolean> = ref(false)
  const lat: Ref<number> = ref(37.5663)
  const lng: Ref<number> = ref(126.9779)
  const bearing: Ref<number | null> = ref(null) // null을 허용하도록 타입 변경

  function setNavi(display: boolean): void {
    isNavigation.value = display
  }

  function setGPS(latitude: number, longitude: number, bearingValue?: number): void {
    lat.value = latitude
    lng.value = longitude
    bearing.value = bearingValue !== undefined ? Number(bearingValue) : null
  }

  return { setNavi, isNavigation, setGPS, lat, lng, bearing }
})

export default useGlobalStore