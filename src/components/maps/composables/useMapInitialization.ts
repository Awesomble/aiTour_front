import { ref, onMounted } from 'vue'
import type { MapInfo, MapProps } from '@/types/map'
import { useGlobalStore } from '@/store'

export function useMapInitialization(props: MapProps, emit: any, onMapInfoUpdated?: any) {
  const map = ref<any>(null)
  const center = ref(props.initialCenter)
  const zoom = ref(props.initialZoom)
  const iamMarker = ref<any>(null)
  const mapInfo = ref<MapInfo>({
    lat: null,
    lng: null,
    lat_min: null,
    lat_max: null,
    lng_min: null,
    lng_max: null
  })

  const initializeMap = async () => {
    try {
      if (!google?.maps) {
        console.error('Google Maps가 올바르게 로드되지 않았습니다.')
        return
      }

      // geometry 라이브러리 로드
      await google.maps.importLibrary('geometry')

      const { Map } = await google.maps.importLibrary('maps')
      const mapInstance = new Map(document.getElementById('instMap'), {
        mapId: 'c8495523c4cf0dd7',
        center: center.value,
        zoom: zoom.value,
        disableDefaultUI: true,
        gestureHandling: 'greedy'
      })

      map.value = mapInstance

      // Advanced marker implementation for user location
      const { AdvancedMarkerElement } = await google.maps.importLibrary('marker')

      // Override default map methods
      overrideMapMethods(mapInstance)

      // Initial map setup
      google.maps.event.addListenerOnce(mapInstance, 'idle', () => {
        updateMapInfo()
        emit('map-loaded', mapInstance)
      })
      const iamMarkerHTML = document.createElement('div')
      iamMarkerHTML.className = 'iam'

      iamMarker.value = new AdvancedMarkerElement({
        map: mapInstance,
        position: center.value,
        content: iamMarkerHTML
      })
console.log('++++', mapInstance, center.value)
      return mapInstance
    } catch (err) {
      console.error('Map initialization error:', err)
    }
  }

  const overrideMapMethods = (mapInstance: any) => {
    const originalPanTo = mapInstance.panTo
    mapInstance.panTo = function (latLng: any, opts: any) {
      originalPanTo.call(this, latLng, opts)

      const panCompleteListener = google.maps.event.addListenerOnce(mapInstance, 'idle', () => {
        updateMapInfo()
        google.maps.event.removeListener(panCompleteListener)
      })
    }
  }

  const updateMapInfo = () => {
    const bounds = map.value?.getBounds()
    const currentCenter = map.value?.getCenter()

    if (bounds && currentCenter) {
      const northEast = bounds.getNorthEast()
      const southWest = bounds.getSouthWest()

      mapInfo.value = {
        lat: currentCenter.lat(),
        lng: currentCenter.lng(),
        lat_min: southWest.lat(),
        lat_max: northEast.lat(),
        lng_min: southWest.lng(),
        lng_max: northEast.lng()
      }
      console.log(mapInfo.value)
      // 콜백 함수 호출 - 외부에서 주입
      if (onMapInfoUpdated) {
        onMapInfoUpdated(mapInfo.value)
      }

    }
  }

  const panToLocation = (lat: number, lng: number, newZoom?: number) => {
    if (!map.value) return

    const location = { lat, lng }
    map.value.panTo(location)

    if (newZoom) {
      map.value.setZoom(newZoom)
    }
  }

  const myLocationCall = () => {
    const globalStore = useGlobalStore()
    if (globalStore.lat && globalStore.lng && map.value) {
      center.value = { lat: globalStore.lat, lng: globalStore.lng }
      // zoom.value = 15

      // map.value.panTo(center.value)
      // map.value.setZoom(zoom.value)
    }
  }

  return {
    map,
    center,
    zoom,
    mapInfo,
    iamMarker,
    initializeMap,
    updateMapInfo,
    panToLocation,
    myLocationCall
  }
}