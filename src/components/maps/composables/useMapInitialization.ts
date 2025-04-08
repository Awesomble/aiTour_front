import { ref, nextTick } from 'vue'
import type { MapInfo, MapProps } from '@/types/map'
import { useGlobalStore } from '@/store'

// 이벤트 콜백 인터페이스 정의
interface MapEventCallbacks {
  onZoomChanged?: (zoom: number) => void;
  onBoundsChanged?: (bounds: any) => void;
  onMapIdle?: () => void;
  onMapLoaded?: (mapInstance: any) => void;
}

// 설정 인터페이스 정의
interface MapConfig {
  movementDelay: number
  zoomAnimationDelay: number
  animationOptions: {
    duration: number
    easing: string
  }
  mapOptions: {
    mapId: string
    disableDefaultUI: boolean
    gestureHandling: string
    backgroundColor: string
    maxZoom: number
    minZoom: number
  }
}

// 기본 설정값
const DEFAULT_MAP_CONFIG: MapConfig = {
  movementDelay: 200,
  zoomAnimationDelay: 500,
  animationOptions: {
    duration: 500,
    easing: "easeInOutCubic"
  },
  mapOptions: {
    mapId: 'c8495523c4cf0dd7',
    disableDefaultUI: true,
    gestureHandling: 'greedy',
    backgroundColor: '#f8f9fa',
    maxZoom: 22,
    minZoom: 3
  }
}

/**
 * 지도 초기화 및 관리를 위한 컴포저블 함수
 */
export function useMapInitialization(
  props: MapProps,
  emit: any,
  callbacks: MapEventCallbacks = {},
  config: Partial<MapConfig> = {}
) {
  const globalStore = useGlobalStore()
  const map = ref<any>(null)
  const center = ref<any>(props.initialCenter)
  const zoom = ref<number>(props.initialZoom)
  const mapInfo = ref<MapInfo>({
    lat: null,
    lng: null,
    lat_min: null,
    lat_max: null,
    lng_min: null,
    lng_max: null
  })

  // 설정 병합
  const mapConfig = {
    ...DEFAULT_MAP_CONFIG,
    ...config,
    mapOptions: {
      ...DEFAULT_MAP_CONFIG.mapOptions,
      ...(config.mapOptions || {})
    }
  }

  // 이벤트 리스너 및 타이머 관리
  let mapEventListeners: any[] = []
  let moveEndTimer: number | null = null

  /**
   * 맵 바운드 계산
   */
  const calculateMapBounds = (): any => {
    if (!map.value) return null

    try {
      const bounds = map.value.getBounds()
      if (!bounds) return null

      const northEast = bounds.getNorthEast()
      const southWest = bounds.getSouthWest()

      return {
        lat_min: southWest.lat(),
        lat_max: northEast.lat(),
        lng_min: southWest.lng(),
        lng_max: northEast.lng()
      }
    } catch (err) {
      console.error('맵 바운드 계산 오류:', err)
      return null
    }
  }

  /**
   * 맵 중심점 계산
   */
  const calculateMapCenter = (): any => {
    if (!map.value) return null

    try {
      const currentCenter = map.value.getCenter()
      if (!currentCenter) return null

      return {
        lat: currentCenter.lat(),
        lng: currentCenter.lng()
      }
    } catch (err) {
      console.error('맵 중심점 계산 오류:', err)
      return null
    }
  }

  /**
   * 맵 정보 업데이트 함수
   */
  const updateMapInfo = async (): Promise<void> => {
    if (!map.value) return
    await nextTick()

    try {
      const boundsInfo = calculateMapBounds()
      const centerInfo = calculateMapCenter()

      if (boundsInfo && centerInfo) {
        // 맵 정보 통합 업데이트
        mapInfo.value = {
          ...centerInfo,
          ...boundsInfo
        }

        // 중심점 정보 업데이트
        emit('update:center', centerInfo)

        // 줌 레벨 업데이트
        const currentZoom = map.value.getZoom()
        if (currentZoom !== zoom.value) {
          zoom.value = currentZoom
          emit('update:zoom', currentZoom)
        }

        // 콜백 함수 호출 - 통합된 bounds 변경 콜백
        if (callbacks.onBoundsChanged) {
          callbacks.onBoundsChanged(boundsInfo);
        }
      }
    } catch (err) {
      console.error('맵 정보 업데이트 오류:', err)
    }
  }

  /**
   * 맵 이벤트 리스너 설정
   */
  const setupMapEventListeners = (mapInstance: any): void => {
    if (!mapInstance) return

    // 드래그 완료 이벤트
    const dragEndListener = mapInstance.addListener('dragend', () => {
      updateMapInfo();
    })
    mapEventListeners.push(dragEndListener)

    // 중심점 변경 감지
    let isMoving = false
    const centerChangedListener = mapInstance.addListener('center_changed', () => {
      isMoving = true
      if (moveEndTimer) clearTimeout(moveEndTimer)

      moveEndTimer = setTimeout(() => {
        if (isMoving) {
          isMoving = false
          updateMapInfo()
          const centerInfo = calculateMapCenter()
          if (centerInfo) {
            emit('update:center', centerInfo)
          }
        }
      }, mapConfig.movementDelay) as unknown as number
    })
    mapEventListeners.push(centerChangedListener)

    // 줌 변경 이벤트 - 콜백 호출 추가
    const zoomChangedListener = mapInstance.addListener('zoom_changed', () => {
      const currentZoom = mapInstance.getZoom()
      zoom.value = currentZoom

      // 줌 변경 콜백 즉시 호출 (마커 가시성을 위해)
      if (callbacks.onZoomChanged) {
        callbacks.onZoomChanged(currentZoom);
      }

      const idleAfterZoomListener = window.google.maps.event.addListenerOnce(mapInstance, 'idle', () => {
        emit('update:zoom', currentZoom)
        updateMapInfo()
      })
      mapEventListeners.push(idleAfterZoomListener)
    })
    mapEventListeners.push(zoomChangedListener)

    // idle 이벤트 (지도 이동/변경 완료)
    const idleListener = mapInstance.addListener('idle', () => {
      if (callbacks.onMapIdle) {
        callbacks.onMapIdle();
      }
    });
    mapEventListeners.push(idleListener);
  }

  /**
   * 맵 메서드 오버라이드
   */
  const overrideMapMethods = (mapInstance: any): void => {
    if (!mapInstance) return

    try {
      const originalPanTo = mapInstance.panTo
      const originalSetZoom = mapInstance.setZoom

      // panTo 메서드 오버라이드
      mapInstance.panTo = function(latLng: any, opts?: any) {
        originalPanTo.call(this, latLng, opts)

        const panCompleteListener = window.google.maps.event.addListenerOnce(this, 'idle', () => {
          updateMapInfo()
        })
        mapEventListeners.push(panCompleteListener)
      }

      // setZoom 메서드 오버라이드
      mapInstance.setZoom = function(zoomLevel: number) {
        originalSetZoom.call(this, zoomLevel)

        // 줌 변경 콜백 즉시 호출
        if (callbacks.onZoomChanged) {
          callbacks.onZoomChanged(zoomLevel);
        }

        const zoomCompleteListener = window.google.maps.event.addListenerOnce(this, 'idle', () => {
          updateMapInfo()
        })
        mapEventListeners.push(zoomCompleteListener)
      }
    } catch (err) {
      console.error('맵 메서드 오버라이드 오류:', err)
    }
  }

  /**
   * 위치 유효성 검사 함수
   */
  const isValidLocation = (location: any): boolean => {
    return (
      location &&
      typeof location.lat === 'number' &&
      typeof location.lng === 'number' &&
      !isNaN(location.lat) &&
      !isNaN(location.lng) &&
      location.lat >= -90 && location.lat <= 90 &&
      location.lng >= -180 && location.lng <= 180
    )
  }

  /**
   * Google Maps 초기화 함수
   */
  const initializeMap = async (): Promise<any> => {
    try {
      if (!window.google?.maps) {
        console.error('Google Maps 라이브러리가 로드되지 않았습니다')
        return null
      }

      // 필요한 라이브러리 로드
      await Promise.all([
        window.google.maps.importLibrary('geometry'),
        window.google.maps.importLibrary('maps')
      ])

      const { Map } = await window.google.maps.importLibrary('maps')

      const mapElement = document.getElementById('instMap')
      if (!mapElement) {
        console.error('맵을 표시할 DOM 요소(#instMap)를 찾을 수 없습니다')
        return null
      }

      // 맵 인스턴스 생성
      const mapInstance = new Map(mapElement, {
        ...mapConfig.mapOptions,
        center: center.value,
        zoom: zoom.value
      })

      map.value = mapInstance

      // 메서드 오버라이드
      overrideMapMethods(mapInstance)

      // 이벤트 리스너 설정
      setupMapEventListeners(mapInstance)

      // 초기 맵 설정 완료 시 이벤트 리스너
      const idleListener = window.google.maps.event.addListenerOnce(mapInstance, 'idle', () => {
        updateMapInfo()
        emit('map-loaded', mapInstance)

        // 맵 로드 콜백 호출
        if (callbacks.onMapLoaded) {
          callbacks.onMapLoaded(mapInstance);
        }
      })
      mapEventListeners.push(idleListener)

      return mapInstance
    } catch (err) {
      console.error('맵 초기화 오류:', err)
      return null
    }
  }

  /**
   * 현재 위치로 지도 이동 함수
   */
  const panToLocation = (
    customLocation?: any,
    customZoom?: number
  ): void => {
    if (!map.value) return

    const location = customLocation || {
      lat: globalStore.lat,
      lng: globalStore.lng
    }

    if (!isValidLocation(location)) {
      console.warn('유효하지 않은 위치로 이동할 수 없습니다', location)
      return
    }

    // 애니메이션 설정 적용
    map.value.panTo(location, mapConfig.animationOptions)

    const targetZoom = customZoom || props.initialZoom
    const currentZoom = map.value.getZoom()

    if (targetZoom !== currentZoom) {
      setTimeout(() => {
        if (map.value) {
          map.value.setZoom(targetZoom)
        }
      }, mapConfig.animationOptions.duration / 2)
    }
  }

  /**
   * 맵 이벤트 리스너 정리 함수
   */
  const cleanupMapEventListeners = (): void => {
    mapEventListeners.forEach(listener => {
      if (listener) {
        window.google.maps.event.removeListener(listener)
      }
    })
    mapEventListeners = []

    if (moveEndTimer) {
      clearTimeout(moveEndTimer)
      moveEndTimer = null
    }
  }

  return {
    map,
    center,
    zoom,
    mapInfo,
    initializeMap,
    updateMapInfo,
    panToLocation,
    cleanupMapEventListeners
  }
}