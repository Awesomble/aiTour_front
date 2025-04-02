import { ref, onMounted, watch } from 'vue'
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
  const globalStore = useGlobalStore()

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

      // 사용자 위치 마커에 방향 표시기 추가
      const iamMarkerHTML = document.createElement('div')
      iamMarkerHTML.className = 'iam'

      // 방향 표시기 추가
      const directionIndicator = document.createElement('div')
      directionIndicator.className = 'direction-indicator'
      iamMarkerHTML.appendChild(directionIndicator)

      iamMarker.value = new AdvancedMarkerElement({
        map: mapInstance,
        position: center.value,
        content: iamMarkerHTML
      })

      // bearing 값 변경 감지
      watch(() => globalStore.bearing, (newBearing) => {
        updateMarkerDirection(newBearing)
      })

      console.log('++++', mapInstance, center.value)
      return mapInstance
    } catch (err) {
      console.error('Map initialization error:', err)
    }
  }

  // 마커 방향 업데이트 함수
// 마커 방향 업데이트 함수
  const updateMarkerDirection = (bearing: number | null) => {
    if (!iamMarker.value) return

    const markerElement = iamMarker.value.content
    if (!markerElement) return

    const directionIndicator = markerElement.querySelector('.direction-indicator')
    if (!directionIndicator) return

    if (bearing !== null && bearing !== undefined) {
      // bearing 값이 있으면 방향 표시기 표시 및 회전
      directionIndicator.style.opacity = '1'

      // 회전 적용 - 중심을 기준으로 회전하도록 transform 설정
      // rotate 외에 다른 transform 속성은 유지
      directionIndicator.style.transform = `rotate(${bearing}deg)`;
    } else {
      // bearing 값이 없으면 방향 표시기 숨김
      directionIndicator.style.opacity = '0'
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
    if (globalStore.lat && globalStore.lng && map.value) {
      center.value = { lat: globalStore.lat, lng: globalStore.lng }

      if (iamMarker.value) {
        iamMarker.value.position = center.value
      }

      map.value.panTo(center.value)

      // bearing 값에 따라 마커 방향 업데이트
      updateMarkerDirection(globalStore.bearing)
    }
  }

  // 위치 업데이트 함수
  const updateUserLocation = (lat: number, lng: number, bearing: number | null = null) => {
    if (!map.value || !iamMarker.value) return

    const newPosition = { lat, lng }
    iamMarker.value.position = newPosition

    // bearing 값에 따라 마커 방향 업데이트
    updateMarkerDirection(bearing)
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
    myLocationCall,
    updateUserLocation
  }
}