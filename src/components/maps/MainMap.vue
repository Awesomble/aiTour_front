<script setup lang="ts">
import { onActivated, onMounted, ref, onBeforeUnmount, defineProps, defineEmits, watch } from 'vue'
import Cookies from 'js-cookie'
import { useGlobalStore, useMapStore } from '@/store'
import { getPlacesListAPI } from '@/network/app'
import { getMapboxDirectionsAPI, getServerNaverDirectionsAPI } from '@/network/platform'

// Type definitions for better code organization
interface MapBounds {
  lat_min: number | null
  lng_min: number | null
  lat_max: number | null
  lng_max: number | null
}

interface MapInfo extends MapBounds {
  lat: number | null
  lng: number | null
}

interface MarkerPosition {
  lat: number
  lng: number
}

interface MarkerObject {
  marker: any
  placeId: string
  categoryId?: number
}

interface RouteInfo {
  distance: string
  duration: string
}

const props = defineProps({
  initialCenter: {
    type: Object,
    default: () => ({ lat: 37.5663, lng: 126.9779 })
  },
  initialZoom: {
    type: Number,
    default: 14
  },
  categories: {
    type: Array,
    default: () => []
  },
  activeCategory: {
    type: Number,
    default: null
  }
})

const emit = defineEmits([
  'update:center',
  'update:zoom',
  'marker-click',
  'map-loaded',
  'markers-updated'
])

// Constants
const GPS_UPDATE_INTERVAL = 3000
const MOVEMENT_DELAY = 200
const ZOOM_ANIMATION_DELAY = 300
const MAP_CHANGE_THRESHOLD = 0.001
const DEFAULT_FETCH_PAGE = 1
const DEFAULT_FETCH_LIMIT = 50

// Reactive state
const mapStore = useMapStore()
const golbalStore = useGlobalStore()
const GPSInter = ref<number | null>(null)
const isLoading = ref<boolean>(false)
const mapInfo = ref<MapInfo>({
  lat: null,
  lng: null,
  lat_min: null,
  lat_max: null,
  lng_min: null,
  lng_max: null
})
const center = ref(props.initialCenter)
const zoom = ref(props.initialZoom)
const mountIdx = ref<number | null>(props.activeCategory)
const activePlaces = ref<any[]>([])
const markerData = ref<any[]>([])
const lastFetchedMapInfo = ref<MapBounds | null>(null)
const currentRoutePolyline = ref<any>(null)
const currentRouteMarkers = ref<any[]>([])

// Non-reactive state
let map: any = null
let activeMarkers: Map<string, MarkerObject> = new Map()
let moveEndTimer: number | null = null

// Compare current map bounds with the last fetched bounds
const shouldRefetchMarkers = (): boolean => {
  if (!lastFetchedMapInfo.value) return true

  const { lat_min, lat_max, lng_min, lng_max } = mapInfo.value
  const last = lastFetchedMapInfo.value

  return (
    Math.abs(lat_min - last.lat_min) > MAP_CHANGE_THRESHOLD ||
    Math.abs(lat_max - last.lat_max) > MAP_CHANGE_THRESHOLD ||
    Math.abs(lng_min - last.lng_min) > MAP_CHANGE_THRESHOLD ||
    Math.abs(lng_max - last.lng_max) > MAP_CHANGE_THRESHOLD
  )
}

const initializeMap = async () => {
  try {
    if (!google?.maps) {
      console.error('Google Maps가 올바르게 로드되지 않았습니다.')
      return
    }

    // geometry 라이브러리 로드
    await google.maps.importLibrary('geometry')

    const { Map } = await google.maps.importLibrary('maps')
    map = new Map(document.getElementById('instMap'), {
      mapId: 'c8495523c4cf0dd7',
      center: center.value,
      zoom: zoom.value,
      disableDefaultUI: true,
      gestureHandling: 'greedy'
    })

    // Advanced marker implementation for user location
    const { AdvancedMarkerElement } = await google.maps.importLibrary('marker')
    const priceTag = document.createElement('div')
    priceTag.className = 'iam'

    const iam = new AdvancedMarkerElement({
      map,
      position: center.value,
      content: priceTag
    })

    // Setup event listeners
    setupMapEventListeners()
    overrideMapMethods()

    // Initial map setup
    google.maps.event.addListenerOnce(map, 'idle', () => {
      updateMapInfo()
      emit('map-loaded', map)
    })

    // Check for directions in the store immediately after map is initialized
    if (mapStore.directions && map) {
      const { startLat, startLng, destLat, destLng } = mapStore.directions
      findDirections(startLat, startLng, destLat, destLng)
        .then((result) => {
          console.log('Initial directions loaded:', result?.routeInfo)
        })
        .catch((error) => {
          console.error('Failed to load initial directions:', error)
        })
    }
  } catch (err) {
    console.error('Map initialization error:', err)
  }
}

const setupMapEventListeners = () => {
  // User-initiated drag events
  map.addListener('dragend', () => {
    updateMapInfo()
  })

  // Movement detection
  let isMoving = false

  map.addListener('center_changed', () => {
    isMoving = true
    if (moveEndTimer) clearTimeout(moveEndTimer)

    moveEndTimer = setTimeout(() => {
      if (isMoving) {
        isMoving = false
        updateMapInfo()
        emit('update:center', {
          lat: map.getCenter().lat(),
          lng: map.getCenter().lng()
        })
      }
    }, MOVEMENT_DELAY) as unknown as number
  })

  // Zoom events
  map.addListener('zoom_changed', () => {
    if (moveEndTimer) clearTimeout(moveEndTimer)

    moveEndTimer = setTimeout(() => {
      const currentZoom = map.getZoom()
      zoom.value = currentZoom
      updateMapInfo()
      emit('update:zoom', currentZoom)
      console.log('update:zoom', currentZoom)
      updateMarkerVisibility(currentZoom)
    }, ZOOM_ANIMATION_DELAY) as unknown as number
  })
}

// Update marker visibility based on category min_zoom_level
const updateMarkerVisibility = (currentZoom: number) => {
  activeMarkers.forEach((markerObj, placeId) => {
    const place = activePlaces.value.find((p) => p.place_id === placeId)
    if (place && place.category && 'min_zoom_level' in place.category) {
      const minZoom = place.category.min_zoom_level || 0
      markerObj.marker.map = currentZoom >= minZoom ? map : null
    }
  })
}

const overrideMapMethods = () => {
  const originalPanTo = map.panTo
  map.panTo = function (latLng: any, opts: any) {
    originalPanTo.call(this, latLng, opts)

    const panCompleteListener = google.maps.event.addListenerOnce(map, 'idle', () => {
      updateMapInfo()
      google.maps.event.removeListener(panCompleteListener)
    })
  }
}

// Unified function to update mapInfo
const updateMapInfo = () => {
  const bounds = map?.getBounds()
  const currentCenter = map?.getCenter()

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

    // Only fetch new data if the map has moved significantly
    if (shouldRefetchMarkers()) {
      mountFN(props.categories, mountIdx.value || 1)
    }
  }
}

const setGPS = () => {
  const lat = Cookies.get('lat')
  const long = Cookies.get('long')

  if (lat && long) {
    golbalStore.setGPS(Number(lat), Number(long))
  } else {
    // golbalStore.setGPS(golbalStore.lat, Number(golbalStore.lng) + 0.001)
  }
}

const myLocationCall = () => {
  if (golbalStore.lat && golbalStore.lng && map) {
    center.value = { lat: golbalStore.lat, lng: golbalStore.lng }
    zoom.value = 15

    map.panTo(center.value)
    map.setZoom(zoom.value)
  }
}

// Clear directions from the map
const clearDirections = () => {
  // Clear polyline if exists
  if (currentRoutePolyline.value) {
    currentRoutePolyline.value.setMap(null)
    currentRoutePolyline.value = null
  }

  // Clear route markers if any
  if (currentRouteMarkers.value.length > 0) {
    currentRouteMarkers.value.forEach(marker => marker.setMap(null))
    currentRouteMarkers.value = []
  }
}

// Optimized updateMarkers function with zoom-based landmark visibility
const updateMarkers = async () => {
  if (!map || !activePlaces.value?.length) {
    clearAllMarkers()
    return
  }

  try {
    const { AdvancedMarkerElement } = await google.maps.importLibrary('marker')
    const currentZoom = map.getZoom()
    const currentPlaceIds = new Set(activePlaces.value.map((place) => place.place_id))

    // Remove markers that no longer exist
    for (const [placeId, markerObj] of activeMarkers.entries()) {
      if (!currentPlaceIds.has(placeId)) {
        markerObj.marker.map = null
        activeMarkers.delete(placeId)
      }
    }

    // Add or update markers
    for (const item of activePlaces.value) {
      if (!item.latitude || !item.longitude || !item.place_id) continue

      const isLandmark = !!item.landmark_url
      const position = {
        lat: parseFloat(item.latitude),
        lng: parseFloat(item.longitude)
      }

      // Skip creating markers if current zoom level is below category's minimum
      const minZoomLevel = item.category?.min_zoom_level || 0
      if (currentZoom < minZoomLevel && !activeMarkers.has(item.place_id)) {
        continue
      }

      if (activeMarkers.has(item.place_id)) {
        // Update existing marker
        const markerObj = activeMarkers.get(item.place_id)

        // Handle marker visibility based on category min_zoom_level
        const minZoomLevel = item.category?.min_zoom_level || 0
        markerObj.marker.map = currentZoom >= minZoomLevel ? map : null

        // Update position if changed
        const currentPos = markerObj.marker.position
        if (currentPos.lat !== position.lat || currentPos.lng !== position.longitude) {
          markerObj.marker.position = position
        }
      } else {
        // Create new marker if zoom level is sufficient
        const minZoomLevel = item.category?.min_zoom_level || 0
        const showMarker = currentZoom >= minZoomLevel

        const marker = new AdvancedMarkerElement({
          map: showMarker ? map : null,
          content: makePlace(item),
          position,
          zIndex: isLandmark ? 9999 : 1
        })

        marker.addListener('click', () => {
          handleMarkerClick(item.place_id)
        })

        activeMarkers.set(item.place_id, {
          marker,
          placeId: item.place_id,
          categoryId: item.category?.category_id
        })
      }
    }

    // Store data for reuse
    markerData.value = [...activePlaces.value]
    emit('markers-updated', markerData.value)
  } catch (err) {
    console.error('Error updating markers:', err)
  }
}

// Clear all markers from the map
const clearAllMarkers = () => {
  activeMarkers.forEach((markerObj) => {
    markerObj.marker.map = null
  })
  activeMarkers.clear()
}

// Remove specific marker
const removeMarkerByPlaceId = (placeId: string) => {
  if (activeMarkers.has(placeId)) {
    const markerObj = activeMarkers.get(placeId)
    markerObj.marker.map = null
    activeMarkers.delete(placeId)
  }
}

const handleMarkerClick = (id: string) => {
  emit('marker-click', id)
}

// Optimized makePlace function
const makePlace = (item: any) => {
  const content = document.createElement('div')

  if (item.landmark_url) {
    // Landmark marker
    content.classList.add('landmark-marker')
    content.style.zIndex = '9999'
    content.innerHTML = `<img src="${item.landmark_url}" alt="${item.name || 'Place'}" class="landmark-image" />`
  } else {
    // Standard pin
    content.classList.add('pin')
    content.setAttribute('data-category', item.category?.category_id?.toString() || '0')
    content.innerHTML = `<div class="pin-inner-circle"><div class="pin-icon-container"></div></div>`

    const iconContainer = content.querySelector('.pin-icon-container')
    const innerCircle = content.querySelector('.pin-inner-circle')

    if (iconContainer && item.category?.icon) {
      // Set icon
      iconContainer.innerHTML = item.category.icon

      // Set colors if available
      if (item.category?.icon_color) {
        iconContainer.style.color = item.category.icon_color

        // Create lighter background color (once, not repeatedly)
        const hexColor = item.category.icon_color.replace('#', '')
        const r = parseInt(hexColor.substring(0, 2), 16)
        const g = parseInt(hexColor.substring(2, 2), 16)
        const b = parseInt(hexColor.substring(4, 2), 16)

        const lightR = Math.min(255, Math.floor(r + (255 - r) * 0.9))
        const lightG = Math.min(255, Math.floor(g + (255 - g) * 0.9))
        const lightB = Math.min(255, Math.floor(b + (255 - b) * 0.9))

        innerCircle.style.backgroundColor = `rgb(${lightR}, ${lightG}, ${lightB})`
      }
    }
  }

  return content
}

// Exposed method for parent components to call
const setActiveCategory = (idx: number) => {
  mountIdx.value = idx
  mountFN(props.categories, idx)
}

// Exposed method for parent components to call
const panToLocation = (lat: number, lng: number, newZoom?: number) => {
  if (!map) return

  const location = { lat, lng }
  map.panTo(location)

  if (newZoom) {
    map.setZoom(newZoom)
  }
}

// Optimized data fetching function
const mountFN = async (categoryIds: number[], idx: number) => {
  if (isLoading.value || !map) return

  isLoading.value = true
  mountIdx.value = idx

  try {
    const bounds = map.getBounds()
    if (!bounds) return

    const northEast = bounds.getNorthEast()
    const southWest = bounds.getSouthWest()

    // Update current map info
    const currentMapInfo = {
      lat: map.getCenter().lat(),
      lng: map.getCenter().lng(),
      lat_min: southWest.lat(),
      lat_max: northEast.lat(),
      lng_min: southWest.lng(),
      lng_max: northEast.lng()
    }

    mapInfo.value = currentMapInfo

    // API call
    const res = await getPlacesListAPI(
      DEFAULT_FETCH_PAGE,
      DEFAULT_FETCH_LIMIT,
      categoryIds,
      currentMapInfo.lat_min,
      currentMapInfo.lat_max,
      currentMapInfo.lng_min,
      currentMapInfo.lng_max
    )

    if (res?.status === 200) {
      activePlaces.value = res.data?.items || []
      updateMarkers()
      lastFetchedMapInfo.value = { ...currentMapInfo }
    }
  } catch (err) {
    console.error('Error fetching places:', err)
  } finally {
    isLoading.value = false
  }
}

// =============== 네이버 API를 이용한 길찾기 관련 함수 =============== //

// 시간 포맷팅 함수 (밀리초를 분:초 형식으로 변환)
const formatDuration = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(totalSeconds / 60)

  if (minutes < 60) {
    return `약 ${minutes}분`
  } else {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0
      ? `약 ${hours}시간 ${remainingMinutes}분`
      : `약 ${hours}시간`
  }
}

// 거리 포맷팅 함수 (미터를 km 또는 m 형식으로 변환)
const formatDistance = (meters: number): string => {
  return meters >= 1000
    ? `${(meters / 1000).toFixed(1)}km`
    : `${meters}m`
}

// Mapbox 경로 데이터를 Google Maps에 표시
const drawMapboxRoute = (routeData: any, mode: string = 'walking'): { polyline: any, routeInfo: RouteInfo } => {
  // 기존 경로 제거
  clearDirections()

  if (!routeData || !routeData.routes || routeData.routes.length === 0) {
    console.error('유효한 경로 데이터가 없습니다')
    return null
  }

  try {
    // 첫 번째 경로 사용
    const route = routeData.routes[0]

    // Mapbox는 GeoJSON 형식으로 경로 좌표 제공
    const geometry = route.geometry

    if (!geometry || !geometry.coordinates || geometry.coordinates.length === 0) {
      console.error('경로 좌표가 없습니다')
      return null
    }

    // GeoJSON 좌표를 Google Maps LatLng 객체로 변환
    // Mapbox는 [lng, lat] 순서로 좌표를 제공하므로 순서를 바꿔야 함
    const googleMapsPath = geometry.coordinates.map((point: number[]) => {
      return { lat: point[1], lng: point[0] }
    })

    // 폴리라인 색상 설정 (이동 모드에 따라 다르게)
    const colorMapping = {
      'walking': '#4CAF50',  // 녹색
      'cycling': '#FF9800',  // 주황색
      'driving': '#4285F4'   // 파란색
    }

    const strokeColor = colorMapping[mode] || '#4285F4'

    // 폴리라인 생성
    const polyline = new google.maps.Polyline({
      path: googleMapsPath,
      strokeColor: strokeColor,
      strokeWeight: 5,
      strokeOpacity: 0.8,
      map: map
    })

    currentRoutePolyline.value = polyline

    // 출발지와 목적지 마커 생성
    if (googleMapsPath.length > 0) {
      const startPoint = googleMapsPath[0]
      const endPoint = googleMapsPath[googleMapsPath.length - 1]

      // 마커 라이브러리를 로드하고 마커를 생성하는 비동기 함수
      const createRouteMarkers = async () => {
        const { AdvancedMarkerElement } = await google.maps.importLibrary('marker')

        // 출발지 마커
        const startMarkerElement = document.createElement('div')
        startMarkerElement.className = 'route-marker start-marker'
        startMarkerElement.innerHTML = '<div class="route-marker-inner">출발</div>'

        const startMarker = new AdvancedMarkerElement({
          map: map,
          position: startPoint,
          content: startMarkerElement,
          zIndex: 1000
        })

        // 도착지 마커
        const endMarkerElement = document.createElement('div')
        endMarkerElement.className = 'route-marker end-marker'
        endMarkerElement.innerHTML = '<div class="route-marker-inner">도착</div>'

        const endMarker = new AdvancedMarkerElement({
          map: map,
          position: endPoint,
          content: endMarkerElement,
          zIndex: 1000
        })

        currentRouteMarkers.value = [startMarker, endMarker]
      }

      createRouteMarkers()
    }

    // 경로 정보 추출
    // Mapbox는 distance(미터)와 duration(초) 제공
    const distance = route.distance_text || formatDistance(route.distance)
    const duration = route.duration_text || formatDuration(route.duration * 1000) // 초 -> 밀리초 변환

    // 이동 수단 한글화
    const modeText = {
      'walking': '도보',
      'cycling': '자전거',
      'driving': '자동차'
    }[mode] || mode

    return {
      polyline,
      routeInfo: {
        distance,
        duration,
        mode: modeText
      }
    }
  } catch (error) {
    console.error('경로를 그리는 중 오류가 발생했습니다:', error)
    return null
  }
}

// Mapbox 길찾기 API 호출 함수
const findDirections = async (startLat: number, startLng: number, destLat: number, destLng: number, travelMode = 'walking') => {
  try {
    // 좌표 유효성 검사
    if (isNaN(startLat) || isNaN(startLng) || isNaN(destLat) || isNaN(destLng)) {
      throw new Error('유효하지 않은 좌표입니다')
    }

    // Mapbox API에 전송할 파라미터
    const params = {
      origin_lat: startLat,
      origin_lng: startLng,
      dest_lat: destLat,
      dest_lng: destLng,
      mode: travelMode.toLowerCase() === 'transit' ? 'driving' : travelMode.toLowerCase()
    }

    // 서버 API를 통해 Mapbox 길찾기 요청
    const res = await getMapboxDirectionsAPI(params)
console.log(res)
    if (res.data.status !== 'OK') {
      const errorText = await res.data.text()
      throw new Error(`API 응답 오류 (${res.status}): ${errorText}`)
    }

    const data = await res.data

    // API 응답 검사
    if (!data || data.status === 'ZERO_RESULTS') {
      throw new Error('경로를 찾을 수 없습니다')
    }

    // 경로 그리기
    const routeResult = drawMapboxRoute(data, travelMode.toLowerCase())

    if (!routeResult) {
      throw new Error('경로를 그리는데 실패했습니다')
    }

    return {
      renderer: {
        setMap: (m: any) => {
          if (m === null) {
            clearDirections()
          }
        }
      },
      routeInfo: routeResult.routeInfo,
      mode: travelMode.toLowerCase()
    }
  } catch (err) {
    console.error('길찾기 요청 중 오류가 발생했습니다:', err)
    throw err
  }
}

// Watch for directions changes in mapStore
watch(
  () => mapStore.directions,
  (newDirections) => {
    if (newDirections && map) {
      const { startLat, startLng, destLat, destLng } = newDirections
      findDirections(startLat, startLng, destLat, destLng)
        .then((result) => {
          console.log('Directions found:', result?.routeInfo)
        })
        .catch((error) => {
          console.error('Failed to find directions:', error)
        })
    } else if (!newDirections) {
      clearDirections()
    }
  }
)

// Lifecycle hooks
onMounted(async () => {
  setGPS()
  await initializeMap()
  GPSInter.value = window.setInterval(setGPS, GPS_UPDATE_INTERVAL)
})

onBeforeUnmount(() => {
  if (GPSInter.value) {
    clearInterval(GPSInter.value)
    GPSInter.value = null
  }

  if (moveEndTimer) {
    clearTimeout(moveEndTimer)
    moveEndTimer = null
  }

  // Clean up all markers and directions
  clearAllMarkers()
  clearDirections()
})

onActivated(() => {
  if (map && markerData.value.length > 0) {
    // Restore cached markers
    activePlaces.value = markerData.value
    updateMarkers()
  } else {
    mountFN(props.categories, mountIdx.value || 1)
  }

  // Check for directions in store when component is activated
  if (mapStore.directions && map) {
    const { startLat, startLng, destLat, destLng } = mapStore.directions
    findDirections(startLat, startLng, destLat, destLng)
      .then((result) => {
        console.log('Directions restored on activation')
      })
      .catch((error) => {
        console.error('Failed to restore directions on activation:', error)
      })
  }
})

// Expose functions to parent component
defineExpose({
  panToLocation,
  setActiveCategory,
  myLocationCall,
  clearAllMarkers,
  removeMarkerByPlaceId,
  findDirections,
  clearDirections
})
</script>

<template>
  <div id="instMap" class="h-100" style="width: 100%" />
  <slot name="floating-controls"></slot>
</template>

<style lang="scss">
</style>