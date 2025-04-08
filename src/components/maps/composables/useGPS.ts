import { ref, onBeforeUnmount } from 'vue'
import Cookies from 'js-cookie'
import { useGlobalStore } from '@/store'

export function useGPS() {
  const globalStore = useGlobalStore()
  const GPS_UPDATE_INTERVAL = 300
  const GPSInter = ref<number | null>(null)

  const setGPS = () => {
    const lat = Cookies.get('lat') || 37.5663
    const long = Cookies.get('long') || 126.9779
    const bearing = Cookies.get('bearing') || 90
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