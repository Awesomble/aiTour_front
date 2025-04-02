import { ref, onMounted, onBeforeUnmount } from 'vue'
import Cookies from 'js-cookie'
import { useGlobalStore } from '@/store'

export function useGPS() {
  const globalStore = useGlobalStore()
  const GPS_UPDATE_INTERVAL = 100
  const GPSInter = ref<number | null>(null)
  let bbb = 0
  const setGPS = () => {
    const lat = Cookies.get('lat')
    const long = Cookies.get('long')
    const bearing = Cookies.get('bearing')
    if (!bearing) {
      bbb+= 3
      if (bbb > 360) bbb = 0
      globalStore.setGPS(37.5663, 126.9779, bbb)
    }
    if (lat && long) {
      globalStore.setGPS(Number(lat), Number(long), bearing)
    }
  }

  const initGPS = () => {
    setGPS()
    GPSInter.value = window.setInterval(setGPS, GPS_UPDATE_INTERVAL)
  }

  const cleanupGPS = () => {
    if (GPSInter.value) {
      clearInterval(GPSInter.value)
      GPSInter.value = null
    }
  }

  onBeforeUnmount(() => {
    cleanupGPS()
  })

  return {
    initGPS,
    cleanupGPS,
    setGPS
  }
}