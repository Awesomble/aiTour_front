import { ref, toRaw, onBeforeUnmount } from 'vue'
import { getPlacesListAPI } from '@/network/app'
import { createLighterColor } from '../utils/mapHelpers'
import type { Place, MarkerObject, MapBounds } from '@/types/map'
import { shwPlaceDetail } from '@/composables/useRouter'

// 마커 라이브러리를 미리 로드하기 위한 전역 변수
let markerLibPromise: any = null

/**
 * 지도 마커 관리를 위한 컴포저블 함수
 * 장소 데이터를 받아 지도에 마커를 표시하고 관리하는 기능을 제공합니다.
 */
export function useMarkers(map: any, mapInfo: any, emit: any, route: any, router: any) {
  // 상수 정의
  const DEFAULT_FETCH_PAGE = 1
  const DEFAULT_FETCH_LIMIT = 50
  const DEBOUNCE_DELAY = 250 // API 요청 디바운스 딜레이(ms)

  // 상태 관리
  const isLoading = ref<boolean>(false)
  const activePlaces = ref<Place[]>([])
  const markerData = ref<Place[]>([])
  const lastFetchedMapInfo = ref<MapBounds | null>(null)
  const activeMarkers: Map<string, MarkerObject> = new Map()
  const AdvancedMarkerElement = ref<any>(null)
  const pendingMarkerUpdates = ref<boolean>(false)
  const activeMarkerId = ref<string | null>(null) // 활성화된 마커 ID 추적

  // API 요청 취소 컨트롤러
  let currentFetchController: AbortController | null = null
  // 디바운스 타이머
  let debounceTimer: number | null = null

  /**
   * Google Maps 마커 라이브러리를 로드하는 함수
   * 마커 라이브러리는 한 번만 로드하고 캐시합니다.
   */
  const loadMarkerLibrary = async (): Promise<any> => {
    if (!markerLibPromise) {
      markerLibPromise = window.google.maps.importLibrary('marker')
    }
    try {
      const markerLib = await markerLibPromise
      AdvancedMarkerElement.value = markerLib.AdvancedMarkerElement
      return markerLib
    } catch (err) {
      console.error('마커 라이브러리 로드 실패:', err)
      throw err
    }
  }

  /**
   * 활성화 스타일 적용 함수
   * 마커에 활성화 스타일을 적용합니다.
   */
  const applyActiveStyle = (placeId: string): void => {
    const markerObj = activeMarkers.get(placeId)
    if (!markerObj) return

    const element = markerObj.marker.content
    if (element) {
      element.classList.add('active')

      // pin 마커인 경우 내부 요소도 스타일 변경
      if (element.classList.contains('pin')) {
        const innerCircle = element.querySelector('.pin-inner-circle')
        if (innerCircle) {
          innerCircle.classList.add('active-inner-circle')
        }
      }
    }
  }

  /**
   * 활성화 스타일 제거 함수
   * 마커의 활성화 스타일을 제거합니다.
   */
  const removeActiveStyle = (placeId: string): void => {
    const markerObj = activeMarkers.get(placeId)
    if (!markerObj) return

    const element = markerObj.marker.content
    if (element) {
      element.classList.remove('active')

      if (element.classList.contains('pin')) {
        const innerCircle = element.querySelector('.pin-inner-circle')
        if (innerCircle) {
          innerCircle.classList.remove('active-inner-circle')
        }
      }
    }
  }

  /**
   * 마커 표시 여부를 결정하는 함수
   * 카테고리별 최소 줌 레벨에 따라 마커 표시 여부를 결정합니다.
   */
  const shouldShowMarker = (place: Place, currentZoom: number): boolean => {
    if (!place || !place.category) return false
    const minZoomLevel = place.category?.min_zoom_level || 0
    return currentZoom >= minZoomLevel
  }

  /**
   * 마커 업데이트 함수
   * 현재 지도에 표시해야 할 마커를 업데이트합니다.
   * 기존 마커는 유지하고 새로운 마커만 추가합니다.
   */
  const updateMarkers = async (): Promise<void> => {
    if (pendingMarkerUpdates.value) return
    pendingMarkerUpdates.value = true
    const mapInstance = toRaw(map.value)

    if (!mapInstance) {
      pendingMarkerUpdates.value = false
      return
    }

    try {
      if (!AdvancedMarkerElement.value) {
        await loadMarkerLibrary()
      }
      if (!AdvancedMarkerElement.value) {
        console.error('AdvancedMarkerElement 로드 실패')
        pendingMarkerUpdates.value = false
        return
      }

      const currentZoom = mapInstance.getZoom()

      // 3. 새 데이터에만 있는 마커 생성 및 추가
      activePlaces.value.forEach((place) => {
        if (place.latitude && place.longitude && place.place_id) {
          if (!activeMarkers.has(place.place_id)) {
            const position = {
              lat: parseFloat(String(place.latitude)),
              lng: parseFloat(String(place.longitude))
            }
            const isLandmark = !!place.landmark_url
            const markerContent = makePlace(place)
            try {
              const marker = new AdvancedMarkerElement.value({
                map: null, // 처음에는 맵에 표시하지 않음, 가시성은 updateMarkerVisibility에서 처리
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
              console.error(`고급 마커 생성 오류 (${place.place_id}):`, err)
            }
          }
        }
      })

      // 줌 레벨에 따른 마커 가시성 업데이트
      updateMarkerVisibility(currentZoom)

      // 활성 마커 스타일 재적용 (예: 클릭 상태 유지)
      if (activeMarkerId.value && activeMarkers.has(activeMarkerId.value)) {
        applyActiveStyle(activeMarkerId.value)
      }

      markerData.value = [...activePlaces.value]
      emit('markers-updated', markerData.value)
    } catch (err) {
      console.error('마커 업데이트 오류:', err)
    } finally {
      pendingMarkerUpdates.value = false
    }
  }

  /**
   * 마커 콘텐츠 생성 함수
   * 장소 정보를 기반으로 마커 DOM 요소를 생성합니다.
   */
  const makePlace = (item: Place): HTMLElement => {
    const content = document.createElement('div')

    if (item.landmark_url) {
      // 랜드마크 마커 생성
      content.classList.add('landmark-marker')
      const img = document.createElement('img')
      img.src = item.landmark_url
      img.alt = item.name || '장소'
      img.classList.add('landmark-image')
      img.loading = 'lazy' // 이미지 지연 로딩 추가

      content.appendChild(img)
    } else {
      // 일반 마커 생성
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

  /**
   * 마커 클릭 핸들러
   * 마커 클릭 시 이벤트를 상위 컴포넌트로 전달합니다.
   */
  const handleMarkerClick = (id: string): void => {
    // 이전 활성화 마커 스타일 제거
    if (activeMarkerId.value && activeMarkerId.value !== id) {
      removeActiveStyle(activeMarkerId.value)
    }

    // 새 마커 활성화
    activeMarkerId.value = id
    applyActiveStyle(id)
    shwPlaceDetail(id, route, router)
    // emit('marker-click', id)
  }

  /**
   * 외부에서 마커 활성화 설정 함수
   * 외부에서 마커의 활성화 상태를 제어할 수 있습니다.
   */
  const setActiveMarker = (placeId: string | null): void => {
    if (activeMarkerId.value) {
      removeActiveStyle(activeMarkerId.value)
    }

    if (placeId && activeMarkers.has(placeId)) {
      activeMarkerId.value = placeId
      applyActiveStyle(placeId)
    } else {
      activeMarkerId.value = null
    }
  }

  /**
   * 모든 마커 제거 함수
   * 지도에서 모든 마커를 제거하고 마커 컬렉션을 초기화합니다.
   */
  const clearAllMarkers = (): void => {
    activeMarkers.forEach((markerObj) => {
      markerObj.marker.map = null
    })
    activeMarkers.clear()
    activeMarkerId.value = null // 활성화 마커 상태도 초기화
  }

  /**
   * 특정 마커 제거 함수
   * 지정된 ID의 마커를 지도에서 제거합니다.
   */
  const removeMarkerByPlaceId = (placeId: string): void => {
    if (placeId === activeMarkerId.value) {
      activeMarkerId.value = null // 활성화된 마커가 제거되면 상태 초기화
    }

    if (activeMarkers.has(placeId)) {
      const markerObj = activeMarkers.get(placeId)
      if (markerObj) markerObj.marker.map = null
      activeMarkers.delete(placeId)
    }
  }

  /**
   * 카테고리별 장소 데이터 가져오기
   * 현재 지도 범위 내의 장소 데이터를 API로 요청합니다.
   */
  const fetchPlacesByCategory = async (): Promise<void> => {
    if (isLoading.value || !map.value) return

    // 이전 디바운스 타이머 취소
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer)
    }

    // 디바운스 적용
    debounceTimer = window.setTimeout(async () => {
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

        // 디버깅: 현재 지도 정보 출력
        console.log('API 요청 지도 정보:', {
          lat_min: currentMapInfo.lat_min,
          lat_max: currentMapInfo.lat_max,
          lng_min: currentMapInfo.lng_min,
          lng_max: currentMapInfo.lng_max
        })

        // 지도 경계 확인
        if (
          !currentMapInfo.lat_min ||
          !currentMapInfo.lat_max ||
          !currentMapInfo.lng_min ||
          !currentMapInfo.lng_max
        ) {
          console.warn('지도 경계가 정의되지 않았습니다')
          isLoading.value = false
          return
        }

        // 이미 취소된 요청인지 확인
        if (signal.aborted) {
          return
        }

        // API 호출
        const res = await getPlacesListAPI(
          DEFAULT_FETCH_PAGE,
          DEFAULT_FETCH_LIMIT,
          categoryIds,
          currentMapInfo.lat_min,
          currentMapInfo.lat_max,
          currentMapInfo.lng_min,
          currentMapInfo.lng_max
          // { signal }
        )

        if (res?.status === 200) {
          // 디버깅: API 응답 경계 출력
          console.log('API 응답 map_bounds:', res.data?.map_bounds)

          // 새 데이터로 교체 (병합하지 않음)
          activePlaces.value = res.data?.items || []

          // 마커 업데이트
          updateMarkers()

          lastFetchedMapInfo.value = { ...currentMapInfo }
        }
      } catch (err: any) {
        // AbortError는 정상적인 취소이므로 에러 로그 출력하지 않음
        if (err.name !== 'AbortError') {
          console.error('장소 데이터 가져오기 오류:', err)
        }
      } finally {
        currentFetchController = null
        isLoading.value = false
      }
    }, DEBOUNCE_DELAY)
  }

  /**
   * 줌 레벨에 따른 마커 가시성 업데이트
   * Google 샘플과 동일한 방식으로 줌 레벨에 따라 마커 표시 여부를 설정합니다.
   */
  const updateMarkerVisibility = (currentZoom: number): void => {
    if (!map.value) return
    const mapInstance = toRaw(map.value)
    activeMarkers.forEach((markerObj, placeId) => {
      const place = activePlaces.value.find((p) => p.place_id === placeId)
      if (place) {
        // 구글 샘플 코드와 동일한 방식으로 map 속성을 직접 설정
        markerObj.marker.map = shouldShowMarker(place, currentZoom) ? mapInstance : null
      }
    })
  }

  // 컴포넌트 언마운트 시 정리
  onBeforeUnmount(() => {
    clearAllMarkers()
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer)
    }
    if (currentFetchController) {
      currentFetchController.abort()
      currentFetchController = null
    }
  })

  return {
    isLoading,
    activePlaces,
    markerData,
    updateMarkers,
    updateMarkerVisibility,
    clearAllMarkers,
    removeMarkerByPlaceId,
    fetchPlacesByCategory,
    setActiveMarker,
    activeMarkerId,
    // 마커 라이브러리 사전 로드 함수 추가 내보내기
    loadMarkerLibrary
  }
}
