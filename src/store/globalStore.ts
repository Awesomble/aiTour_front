import { ref, type Ref } from 'vue'
import { defineStore } from 'pinia'

const useGlobalStore = defineStore('global', () => {
  const isNavigation: Ref<boolean> = ref(false)
  const lat: Ref<number | null> = ref(null)
  const lng: Ref<number | null> = ref(null)
  const bearing: Ref<number | null> = ref(null) // null을 허용하도록 타입 변경
  const useGPS: Ref<boolean> = ref(false)

  function setNavi(display: boolean): void {
    isNavigation.value = display
  }

  function setGPS(latitude: number, longitude: number, bearingValue?: number, use: boolean = false): void {
    lat.value = latitude
    lng.value = longitude
    bearing.value = bearingValue ? Number(bearingValue) : null
    useGPS.value = use
  }

  return { setNavi, isNavigation, setGPS, lat, lng, bearing, useGPS }
})

export default useGlobalStore