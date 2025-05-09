import { ref, watch, toRaw } from 'vue'
import { useGlobalStore } from '@/store'

export const useIamMarker = () => {
  const iamMarker = ref<any>(null)
  const markerElement = ref<HTMLElement | null>(null)
  const isMarkerVisible = ref<boolean>(false)
  const globalStore = useGlobalStore()
  let markerLibPromise: any = null

  /**
   * 마커 라이브러리 로드 함수
   */
  const loadMarkerLibrary = async () => {
    if (!markerLibPromise) {
      markerLibPromise = window.google.maps.importLibrary('marker')
    }
    return await markerLibPromise
  }

  /**
   * 위치 좌표 유효성 검사
   */
  const isValidPosition = (position: any): boolean => {
    return (
      position &&
      typeof position.lat === 'number' &&
      typeof position.lng === 'number' &&
      !isNaN(position.lat) &&
      !isNaN(position.lng) &&
      position.lat >= -90 && position.lat <= 90 &&
      position.lng >= -180 && position.lng <= 180
    )
  }

  /**
   * IAM 마커 초기화 함수
   * @param mapRef - map ref 객체
   */
  const initializeIamMarker = async (mapRef: any) => {
    console.log('initializeIamMarker called with:', mapRef)

    try {
      // mapRef 자체가 ref 객체인지 확인하고 적절히 처리
      const mapValue = mapRef && mapRef.value ? mapRef.value : mapRef

      if (!mapValue) {
        console.warn('지도 인스턴스가 없어 IAM 마커를 초기화할 수 없습니다')
        return null
      }

      const mapInstance = toRaw(mapValue)
      console.log('mapInstance:', mapInstance)

      // 위치 정보 확인
      const position = { lat: globalStore.lat, lng: globalStore.lng }
      console.log('Current position:', position)

      if (!isValidPosition(position)) {
        console.warn('유효하지 않은 위치로 IAM 마커를 초기화할 수 없습니다', position)
        // 유효하지 않은 경우 기본 위치 사용 (선택사항)
        // position = { lat: 37.5663, lng: 126.9779 }
        return null
      }

      const markerLib = await loadMarkerLibrary()
      console.log('Marker library loaded:', markerLib)
      const { AdvancedMarkerElement } = markerLib

      // 이미 마커가 있으면 제거
      if (iamMarker.value) {
        iamMarker.value.map = null
        iamMarker.value = null
      }

      // IAM 마커 HTML 요소 생성
      const iamMarkerHTML = document.createElement('div') as HTMLElement
      iamMarkerHTML.className = 'iam'

      const directionIndicator = document.createElement('div') as HTMLElement
      directionIndicator.className = 'direction-indicator'

      iamMarkerHTML.appendChild(directionIndicator)
      markerElement.value = iamMarkerHTML

      // 마커 생성
      iamMarker.value = new AdvancedMarkerElement({
        map: mapInstance,
        position: position,
        content: iamMarkerHTML,
        zIndex: 9999,
        title: '내 위치'
      })

      console.log('IAM marker created:', iamMarker.value)
      isMarkerVisible.value = true
      updateMarkerDirection()

      return iamMarker.value
    } catch (err) {
      console.error('IAM 마커 초기화 오류:', err)
      return null
    }
  }

  /**
   * 마커 방향 업데이트 함수
   */
  const updateMarkerDirection = () => {
    if (!iamMarker.value || !markerElement.value) return

    const bearing = globalStore.bearing
    const directionIndicator = markerElement.value.querySelector('.direction-indicator')

    if (!directionIndicator) return

    if (bearing !== null && bearing !== undefined) {
      directionIndicator.style.opacity = '1'
      directionIndicator.style.transform = `rotate(${bearing}deg)`
    } else {
      directionIndicator.style.opacity = '0'
    }
  }

  /**
   * 마커 위치 업데이트 함수
   */
  const updatePosition = () => {
    if (!iamMarker.value) return

    const newPosition = {
      lat: globalStore.lat,
      lng: globalStore.lng
    }

    if (isValidPosition(newPosition)) {
      iamMarker.value.position = newPosition
    }
  }

  // 방향 정보 변경 감지
  watch(
    () => globalStore.bearing,
    () => updateMarkerDirection()
  )

  // 위치 정보 변경 감지
  watch(
    [() => globalStore.lat, () => globalStore.lng],
    () => updatePosition()
  )

  return {
    iamMarker,
    initializeIamMarker,
    updateMarkerDirection,
    updatePosition
  }
}