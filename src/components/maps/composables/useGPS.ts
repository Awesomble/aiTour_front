import { onBeforeUnmount } from 'vue'
import Cookies from 'js-cookie'
import { useGlobalStore } from '@/store'

export function useGPS() {
  const globalStore = useGlobalStore()
  const GPS_UPDATE_INTERVAL = 300
  let GPSInter: any = null

  const setGPS = () => {
    const lat = Cookies.get('lat')
    const long = Cookies.get('long')
    const bearing = Cookies.get('bearing')
    if (lat && long) {
      globalStore.setGPS(Number(lat), Number(long), bearing)
    }
  }

  const initGPS = () => {
    setGPS()
    if (GPSInter) cleanupGPS()
    GPSInter = window.setInterval(setGPS, GPS_UPDATE_INTERVAL)
  }

  const cleanupGPS = () => {
    if (GPSInter) {
      clearInterval(GPSInter)
      GPSInter = null
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