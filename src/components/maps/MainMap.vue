<script setup lang="ts">
import {
  onActivated,
  onMounted,
  ref,
  onBeforeUnmount,
  defineProps,
  defineEmits,
  watch
} from 'vue'
import Cookies from 'js-cookie'
import { useGlobalStore } from '@/store'
import { getPlacesListAPI } from '@/network/app'

// Type definitions for better code organization
interface MapBounds {
  lat_min: number | null;
  lat_max: number | null;
  lng_min: number | null;
  lng_max: number | null;
}

interface MapInfo extends MapBounds {
  lat: number | null;
  lng: number | null;
}

interface MarkerPosition {
  lat: number;
  lng: number;
}

interface MarkerObject {
  marker: any;
  placeId: string;
  categoryId?: number;
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
    const place = activePlaces.value.find(p => p.place_id === placeId)
    if (place && place.category && 'min_zoom_level' in place.category) {
      const minZoom = place.category.min_zoom_level || 0
      markerObj.marker.map = currentZoom >= minZoom ? map : null
    }
  })
}

const overrideMapMethods = () => {
  const originalPanTo = map.panTo
  map.panTo = function(latLng: any, opts: any) {
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
    golbalStore.setGPS(
      golbalStore.lat,
      Number(golbalStore.long) + 0.001
    )
  }
}

const myLocationCall = () => {
  if (golbalStore.lat && golbalStore.long && map) {
    center.value = { lat: golbalStore.lat, lng: golbalStore.long }
    zoom.value = 15

    map.panTo(center.value)
    map.setZoom(zoom.value)
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
    const currentPlaceIds = new Set(
      activePlaces.value.map(place => place.place_id)
    )

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
        lat: item.latitude,
        lng: item.longitude
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
  activeMarkers.forEach(markerObj => {
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

  // Clean up all markers
  clearAllMarkers()
})

onActivated(() => {
  if (map && markerData.value.length > 0) {
    // Restore cached markers
    activePlaces.value = markerData.value
    updateMarkers()
  } else {
    mountFN(props.categories, mountIdx.value || 1)
  }
})

// Expose functions to parent component
defineExpose({
  panToLocation,
  setActiveCategory,
  myLocationCall,
  clearAllMarkers,
  removeMarkerByPlaceId
})
</script>

<template>
  <div id="instMap" class="h-100" style="width: 100%" />
  <slot name="floating-controls"></slot>
</template>

<style lang="scss">
// Pin styling
.pin {
  position: relative;
  width: 40px;
  height: 40px;
  background-color: white;
  border-radius: 30px;
  border-bottom-left-radius: 5px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pin-appear 0.3s ease;
  transition: all 0.2s ease;
  cursor: pointer;

  &.active {
    transform: scale(1.1);
    box-shadow:
      0 5px 12px rgba(0, 0, 0, 0.2),
      0 0 0 4px rgba(24, 144, 255, 0.3);
    z-index: 10;

    .pin-icon-container svg {
      transform: scale(1.15);
    }

    .pin-inner-circle {
      animation: pulse-light 1.5s ease-in-out infinite;
    }

    .pin-image-container {
      transform: translateY(60%) scale(1.1);
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
    }
  }
}

// Pin with image styling
.pin-with-image {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pin-image-container {
  position: absolute;
  bottom: 0;
  width: 50px;
  height: 50px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  border: 2px solid white;
  transform: translateY(60%);
  z-index: 1;
}

.pin-inner-circle {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 2;
}

.pin-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  transition: all 0.2s ease;

  svg {
    width: 16px;
    height: 16px;
    stroke-width: 2.5;
  }
}

// Landmark marker styling
.landmark-marker {
  width: 80px;
  height: 100px;
  border-radius: 6px;
  overflow: hidden;
  transition: all 0.2s ease;
  cursor: pointer;
  animation: marker-appear 0.3s ease;
  transform-origin: center bottom;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
    object-fit: contain;
    display: block;
  }

  &:hover,
  &.active {
    transform: scale(1.1);
    z-index: 10;
  }
}

// Image styling
.landmark-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

// Animations
@keyframes pin-appear {
  0% {
    transform: translateY(10px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes pulse-light {
  0% {
    box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(24, 144, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(24, 144, 255, 0);
  }
}

@keyframes marker-appear {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>