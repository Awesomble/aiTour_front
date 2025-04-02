import { ref, toRaw, onMounted } from 'vue'
import { getPlacesListAPI } from '@/network/app'
import { shouldRefetchMarkers } from '../utils/mapHelpers'
import { createLighterColor } from '../utils/mapHelpers'
import type { Place, MarkerObject, MapBounds } from '@/types/map'

// 마커 라이브러리를 미리 로드하기 위한 전역 변수
let markerLibPromise: any = null

export function useMarkers(map: any, mapInfo: any, emit: any, iamMarker: any) {
  // Constants
  const DEFAULT_FETCH_PAGE = 1
  const DEFAULT_FETCH_LIMIT = 50

  // State
  const isLoading = ref<boolean>(false)
  const activePlaces = ref<Place[]>([])
  const markerData = ref<Place[]>([])
  const lastFetchedMapInfo = ref<MapBounds | null>(null)
  const activeMarkers: Map<string, MarkerObject> = new Map()
  const AdvancedMarkerElement = ref(null)
  const pendingMarkerUpdates = ref<boolean>(false)

  // 마커 ID 추적을 위한 Set 추가
  const currentPlaceIds = ref<Set<string>>(new Set())

  // 이전 API 요청을 취소하기 위한 변수
  let currentFetchController: AbortController | null = null

  // 마커 라이브러리 미리 로드 (컴포넌트 마운트 시)
  onMounted(async () => {
    try {
      await loadMarkerLibrary()
    } catch (err) {
      console.error('Failed to preload marker library:', err)
    }
  })

  // 마커 라이브러리 로딩 함수
  const loadMarkerLibrary = async () => {
    if (!markerLibPromise) {
      markerLibPromise = google.maps.importLibrary('marker')
    }
    const markerLib = await markerLibPromise
    AdvancedMarkerElement.value = markerLib.AdvancedMarkerElement
    return markerLib
  }

  // Enhanced visibility check function
  const shouldShowMarker = (place: Place, currentZoom: number): boolean => {
    const minZoomLevel = place.category?.min_zoom_level || 0
    return currentZoom >= minZoomLevel
  }

  const updateMarkers = async () => {
    if (pendingMarkerUpdates.value) return

    pendingMarkerUpdates.value = true

    const mapInstance = toRaw(map.value)
    if (!mapInstance || !activePlaces.value?.length) {
      clearAllMarkers()
      pendingMarkerUpdates.value = false
      return
    }

    try {
      if (!AdvancedMarkerElement.value) {
        const markerLib = await loadMarkerLibrary()
        AdvancedMarkerElement.value = markerLib.AdvancedMarkerElement
      }

      if (!AdvancedMarkerElement.value) {
        console.error('Failed to load AdvancedMarkerElement')
        pendingMarkerUpdates.value = false
        return
      }

      const currentZoom = mapInstance.getZoom()

      // 현재 활성화된 장소 ID 업데이트
      currentPlaceIds.value = new Set(activePlaces.value.map((place) => place.place_id))

      // 1. 제거할 마커 식별
      const markersToRemove: string[] = []
      for (const [placeId, markerObj] of activeMarkers.entries()) {
        const place = activePlaces.value.find(p => p.place_id === placeId)
        if (!place || !shouldShowMarker(place, currentZoom)) {
          markersToRemove.push(placeId)
        }
      }

      // 2. 추가/업데이트할 마커 식별
      const markersToAddOrUpdate: Place[] = activePlaces.value.filter(place =>
        place.latitude &&
        place.longitude &&
        place.place_id &&
        shouldShowMarker(place, currentZoom)
      )

      // 3. 일괄 업데이트 함수 - 마커 생성
      const createNewMarkers = async () => {
        for (const place of markersToAddOrUpdate) {
          if (activeMarkers.has(place.place_id)) continue

          const position = {
            lat: parseFloat(place.latitude),
            lng: parseFloat(place.longitude)
          }

          const isLandmark = !!place.landmark_url
          const markerContent = makePlace(place)

          try {
            const marker = new AdvancedMarkerElement.value({
              map: mapInstance,
              content: markerContent,
              position,
              zIndex: isLandmark ? 999 : 10,
              collisionBehavior: isLandmark ? 'OPTIONAL_AND_HIDES_LOWER_PRIORITY' : 'REQUIRED'
            })

            marker.addListener('click', () => {
              handleMarkerClick(place.place_id)
            })

            activeMarkers.set(place.place_id, {
              marker,
              placeId: place.place_id,
              categoryId: place.category?.category_id
            })
          } catch (err) {
            console.error('Error creating advanced marker:', err)
          }
        }
      }

      // 4. 일괄 업데이트 함수 - 기존 마커 업데이트
      const updateExistingMarkers = () => {
        for (const place of markersToAddOrUpdate) {
          if (!activeMarkers.has(place.place_id)) continue

          const markerObj = activeMarkers.get(place.place_id)

          // 위치 업데이트 로직
          const position = {
            lat: parseFloat(place.latitude),
            lng: parseFloat(place.longitude)
          }

          const currentPos = markerObj.marker.position
          const latDiff = Math.abs(currentPos.lat - position.lat)
          const lngDiff = Math.abs(currentPos.lng - position.lng)

          const POSITION_THRESHOLD = 0.0000001

          if (latDiff > POSITION_THRESHOLD || lngDiff > POSITION_THRESHOLD) {
            markerObj.marker.position = position
          }
        }
      }

      // 5. 일괄 업데이트 함수 - 마커 제거
      const removeOldMarkers = () => {
        for (const placeId of markersToRemove) {
          if (activeMarkers.has(placeId)) {
            const markerObj = activeMarkers.get(placeId)
            markerObj.marker.map = null
            activeMarkers.delete(placeId)
          }
        }
      }

      // 마커 업데이트 수행
      updateExistingMarkers()
      await createNewMarkers()
      removeOldMarkers()

      markerData.value = [...activePlaces.value]
      emit('markers-updated', markerData.value)
    } catch (err) {
      console.error('Error updating markers:', err)
    } finally {
      pendingMarkerUpdates.value = false
    }
  }

  // Helper function to create marker content
  const makePlace = (item: Place) => {
    const content = document.createElement('div')

    if (item.landmark_url) {
      // Landmark marker
      content.classList.add('landmark-marker')
      const img = document.createElement('img')
      img.src = item.landmark_url
      img.alt = item.name || 'Place'
      img.classList.add('landmark-image')

      content.appendChild(img)
    } else {
      content.classList.add('pin')
      content.setAttribute('data-category', item.category?.category_id?.toString() || '0')

      const innerCircle = document.createElement('div')
      innerCircle.classList.add('pin-inner-circle')

      const iconContainer = document.createElement('div')
      iconContainer.classList.add('pin-icon-container')

      if (item.category?.icon) {
        iconContainer.innerHTML = item.category.icon

        if (item.category?.icon_color) {
          iconContainer.style.color = item.category.icon_color
          innerCircle.style.backgroundColor = createLighterColor(item.category.icon_color)
        }
      }

      innerCircle.appendChild(iconContainer)
      content.appendChild(innerCircle)
    }
    return content
  }

  // Marker click handler
  const handleMarkerClick = (id: string) => {
    emit('marker-click', id)
  }

  // Update marker visibility based on zoom level
  const updateMarkerVisibility = (currentZoom: number) => {
    activeMarkers.forEach((markerObj, placeId) => {
      const place = activePlaces.value.find((p) => p.place_id === placeId)
      if (place && place.category && 'min_zoom_level' in place.category) {
        const minZoom = place.category.min_zoom_level || 0
        markerObj.marker.map = currentZoom >= minZoom ? map.value : null
      }
    })
  }

  // Clear all markers from the map
  const clearAllMarkers = () => {
    activeMarkers.forEach((markerObj) => {
      markerObj.marker.map = null
    })
    activeMarkers.clear()
    currentPlaceIds.value.clear()
  }

  // Remove specific marker
  const removeMarkerByPlaceId = (placeId: string) => {
    if (activeMarkers.has(placeId)) {
      const markerObj = activeMarkers.get(placeId)
      markerObj.marker.map = null
      activeMarkers.delete(placeId)
      currentPlaceIds.value.delete(placeId)
    }
  }

  // 기존 데이터와 새 데이터를 병합하는 함수 개선
  const mergePlaceData = (newPlaces: Place[]): Place[] => {
    const result: Place[] = []
    const existingPlacesMap = new Map<string, Place>()

    // 기존 데이터를 Map으로 변환하여 빠르게 조회할 수 있도록 함
    activePlaces.value.forEach((place) => {
      if (place.place_id) {
        existingPlacesMap.set(place.place_id, place)
      }
    })

    // 새 데이터 처리
    for (const newPlace of newPlaces) {
      if (!newPlace.place_id) continue

      // 기존 데이터에 이미 있는 장소인 경우, 위치 정보를 기존 값과 비교
      if (existingPlacesMap.has(newPlace.place_id)) {
        const existingPlace = existingPlacesMap.get(newPlace.place_id)

        // 새 데이터 상에서는 기본적으로 새 데이터로 덮어쓰지만
        // 위치 정보는 변경이 작은 경우 기존 위치를 유지
        const newLat = parseFloat(newPlace.latitude || '0')
        const newLng = parseFloat(newPlace.longitude || '0')
        const existingLat = parseFloat(existingPlace.latitude || '0')
        const existingLng = parseFloat(existingPlace.longitude || '0')

        // 위치 변경이 매우 작은 경우, 기존 위치 유지 (마커 점프 방지)
        const POSITION_THRESHOLD = 0.0001 // 작은 차이 임계값

        if (
          Math.abs(newLat - existingLat) < POSITION_THRESHOLD &&
          Math.abs(newLng - existingLng) < POSITION_THRESHOLD
        ) {
          // 기존 좌표 유지, 다른 정보는 업데이트
          newPlace.latitude = existingPlace.latitude
          newPlace.longitude = existingPlace.longitude
        }

        // 기존 데이터 맵에서 처리 완료 표시
        existingPlacesMap.delete(newPlace.place_id)
      }

      result.push(newPlace)
    }

    // 새 데이터에 없는 기존 데이터 추가 (필요한 경우)
    // 뷰포트 밖의 마커를 어떻게 처리할지에 따라 이 부분은 조정 가능
    for (const [_, place] of existingPlacesMap) {
      result.push(place)
    }

    return result
  }

  // Fetch places by category with improved error handling and debouncing
  const fetchPlacesByCategory = async () => {
    if (isLoading.value || !map.value) return
    const categoryIds: number[] = []

    // 이전 요청이 있으면 취소
    if (currentFetchController) {
      currentFetchController.abort()
    }

    // 새 요청을 위한 컨트롤러 생성
    currentFetchController = new AbortController()
    const signal = currentFetchController.signal

    isLoading.value = true

    try {
      const currentMapInfo = mapInfo.value
      if (!shouldRefetchMarkers(currentMapInfo, lastFetchedMapInfo.value)) {
        isLoading.value = false
        return
      }

      if (
        !currentMapInfo.lat_min ||
        !currentMapInfo.lat_max ||
        !currentMapInfo.lng_min ||
        !currentMapInfo.lng_max
      ) {
        isLoading.value = false
        return
      }

      // 디바운스 시간을 둬서 빠른 연속 호출 방지
      await new Promise((resolve) => setTimeout(resolve, 50))

      // 이미 취소된 요청인지 확인
      if (signal.aborted) {
        return
      }

      // API call with signal
      const res = await getPlacesListAPI(
        DEFAULT_FETCH_PAGE,
        DEFAULT_FETCH_LIMIT,
        categoryIds,
        currentMapInfo.lat_min,
        currentMapInfo.lat_max,
        currentMapInfo.lng_min,
        currentMapInfo.lng_max,
        signal // 취소 시그널 전달 (API 함수가 지원해야 함)
      )

      if (res?.status === 200) {
        const newPlaces = res.data?.items || []

        // 새 데이터를 기존 마커 유지하면서 업데이트
        activePlaces.value = mergePlaceData(newPlaces)

        // 마커 업데이트
        updateMarkers()
        lastFetchedMapInfo.value = { ...currentMapInfo }
      }
    } catch (err) {
      // AbortError는 정상적인 취소이므로 에러 로그 출력하지 않음
      if (err.name !== 'AbortError') {
        console.error('Error fetching places:', err)
      }
    } finally {
      if (currentFetchController) {
        currentFetchController = null
      }
      isLoading.value = false
    }
  }

  return {
    isLoading,
    activePlaces,
    markerData,
    updateMarkers,
    updateMarkerVisibility,
    clearAllMarkers,
    removeMarkerByPlaceId,
    fetchPlacesByCategory
  }
}
