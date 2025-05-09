import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useMapStore } from '@/store'
import { getMapboxDirectionsAPI } from '@/network/platform'
import { formatDistance, formatDuration } from '../utils/formatters'
import { routeColorMapping, travelModeText } from '../utils/mapHelpers'
import type { RouteInfo } from '@/types/map'

export function useDirections(map: any) {
  const mapStore = useMapStore()
  const currentRoutePolyline = ref<any>(null)
  const currentRouteMarkers = ref<any[]>([])
  const animationFrameId = ref<number | null>(null)
  const symbols = ref<any[]>([])

  // 애니메이션 리소스 정리
  onBeforeUnmount(() => {
    if (animationFrameId.value) {
      cancelAnimationFrame(animationFrameId.value)
      animationFrameId.value = null
    }
  })

  // Clear directions from the map
  const clearDirections = () => {
    // 애니메이션 중지
    if (animationFrameId.value) {
      cancelAnimationFrame(animationFrameId.value)
      animationFrameId.value = null
    }

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

    // 심볼 초기화
    symbols.value = []
  }

  // 경로에 맞게 지도 뷰 자동 조정 - 안정적인 방식으로 수정
  const fitMapToRoute = (path: any[]) => {
    if (!map.value || !path || path.length === 0) return

    try {
      // 경로 좌표를 포함하는 바운드 생성
      const bounds = new window.google.maps.LatLngBounds()

      // 모든 경로 포인트를 바운드에 추가
      path.forEach((point: any) => {
        bounds.extend(new window.google.maps.LatLng(point.lat, point.lng))
      })

      // 바운드 여백 추가를 위한 확장
      const extendBounds = (bounds: any) => {
        const ne = bounds.getNorthEast()
        const sw = bounds.getSouthWest()

        // 바운드 크기 계산
        const latDiff = ne.lat() - sw.lat()
        const lngDiff = ne.lng() - sw.lng()

        // 여백 계수 (작은 값으로 조정)
        const latPadding = latDiff * 0.1  // 상하 10% 여백
        const lngPadding = lngDiff * 0.1  // 좌우 10% 여백

        // 확장된 바운드 생성
        const extendedBounds = new window.google.maps.LatLngBounds(
          new window.google.maps.LatLng(sw.lat() - latPadding, sw.lng() - lngPadding),
          new window.google.maps.LatLng(ne.lat() + latPadding, ne.lng() + lngPadding)
        )

        return extendedBounds
      }

      // 바운드 확장 적용
      const paddedBounds = extendBounds(bounds)

      // 확장된 바운드에 맞게 지도 조정 (단일 숫자 패딩 사용)
      map.value.fitBounds(paddedBounds, 50)  // 50픽셀 패딩 (모든 방향)

      // 하단 여백을 주기 위한 중심점 이동 (바운드 피팅 후 실행)
      setTimeout(() => {
        const center = map.value.getCenter()
        if (center) {
          // 이동할 거리 계산 (바운드 높이의 약 15%)
          const viewportHeight = paddedBounds.getNorthEast().lat() - paddedBounds.getSouthWest().lat()
          const offset = viewportHeight * 0.15

          // 중심점을 북쪽으로 이동 (하단 여백 효과)
          const newCenter = new window.google.maps.LatLng(
            center.lat() + offset,
            center.lng()
          )

          // 새 중심점 적용
          map.value.panTo(newCenter)
        }
      }, 100)
    } catch (error) {
      console.error('경로 뷰 조정 중 오류 발생:', error)

      // 오류 발생 시 간단한 대체 방법 적용
      if (path.length > 0) {
        const midIndex = Math.floor(path.length / 2)
        const midPoint = path[midIndex]
        map.value.setCenter({ lat: midPoint.lat, lng: midPoint.lng })
        map.value.setZoom(14)  // 적절한 줌 레벨로 설정
      }
    }
  }

  // 애니메이션 및 스타일링이 적용된 경로 그리기
  const createAnimatedRoute = (path: any[], strokeColor: string) => {
    // 기존 경로 제거 (확실히 제거)
    clearDirections()

    // 경로에 화살표 심볼 추가
    const arrowSymbol = {
      path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      scale: 1, // 화살표 크기 증가
      strokeColor: '#FFFFFF',
      fillColor: strokeColor,
      fillOpacity: 1,
      strokeWeight: 1
    }

    // 경로 그림자 효과를 위한 폴리라인
    const shadowPolyline = new window.google.maps.Polyline({
      path: path,
      strokeColor: '#000000',
      strokeOpacity: 0.4,
      strokeWeight: 12, // 더 넓게
      map: map.value,
      zIndex: 9998 // 가장 아래
    })

    // 경로 밝기 효과를 위한 보조 폴리라인
    const underPolyline = new window.google.maps.Polyline({
      path: path,
      strokeColor: '#FFFFFF', // 흰색 테두리
      strokeOpacity: 0.7,
      strokeWeight: 10, // 더 넓게
      map: map.value,
      zIndex: 9999 // 메인 폴리라인보다 아래에 위치
    })

    // 고정된 실선 폴리라인
    const solidLine = new window.google.maps.Polyline({
      path: path,
      strokeColor: strokeColor,
      strokeOpacity: 0.8,
      strokeWeight: 7, // 두께 증가
      map: map.value,
      zIndex: 10000
    })

    // 점선/대시 효과를 위한 메인 폴리라인
    const dashLine = new window.google.maps.Polyline({
      path: path,
      strokeOpacity: 0,
      icons: [
        {
          icon: {
            path: 'M 0,-1 0,1',
            strokeOpacity: 1,
            strokeWeight: 3,
            strokeColor: '#FFFFFF',
            scale: 3.5
          },
          offset: '0',
          repeat: '15px'
        }
      ],
      map: map.value,
      zIndex: 10001
    })

    // 화살표 애니메이션을 위한 메인 폴리라인
    const arrowLine = new window.google.maps.Polyline({
      path: path,
      strokeOpacity: 0,
      icons: [
        {
          icon: arrowSymbol,
          offset: '0%',
          repeat: '12%' // 화살표 간격 조정
        }
      ],
      map: map.value,
      zIndex: 10002 // 최상위
    })

    // 애니메이션 효과를 위한 함수
    let offset = 0
    const animateRoute = () => {
      // 애니메이션 속도 감소 (0.5 -> 0.2)
      offset = (offset + 0.2) % 100

      const icons = arrowLine.get('icons')
      icons[0].offset = offset + '%'
      arrowLine.set('icons', icons)

      animationFrameId.value = requestAnimationFrame(animateRoute)
    }

    // 애니메이션 시작
    animateRoute()

    // 현재 사용 중인 폴리라인 저장
    currentRoutePolyline.value = {
      setMap: (newMap: any) => {
        shadowPolyline.setMap(newMap)
        underPolyline.setMap(newMap)
        solidLine.setMap(newMap)
        dashLine.setMap(newMap)
        arrowLine.setMap(newMap)

        if (newMap === null) {
          if (animationFrameId.value) {
            cancelAnimationFrame(animationFrameId.value)
            animationFrameId.value = null
          }
        }
      }
    }

    return solidLine // 메인 라인 반환
  }

  // Mapbox 경로 데이터를 Google Maps에 표시
  const drawMapboxRoute = (routeData: any, mode: string = 'walking'): { polyline: any, routeInfo: RouteInfo } | null => {
    // 기존 경로 확실히 제거
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

      const strokeColor = routeColorMapping[mode] || '#4285F4'

      // 애니메이션 및 스타일링이 적용된 경로 그리기
      const polyline = createAnimatedRoute(googleMapsPath, strokeColor)

      // 출발지와 목적지 마커 생성
      if (googleMapsPath.length > 0) {
        const startPoint = googleMapsPath[0]
        const endPoint = googleMapsPath[googleMapsPath.length - 1]

        // 마커 라이브러리를 로드하고 마커를 생성하는 비동기 함수
        const createRouteMarkers = async () => {
          const { AdvancedMarkerElement } = await window.google.maps.importLibrary('marker')

          // 출발지 마커
          const startMarkerElement = document.createElement('div')
          startMarkerElement.className = 'route-marker start-marker'
          startMarkerElement.innerHTML = '<div class="route-marker-inner">출발</div>'

          const startMarker = new AdvancedMarkerElement({
            map: map.value,
            position: startPoint,
            content: startMarkerElement,
            zIndex: 9500 // 폴리라인보다 낮게 조정
          })

          // 도착지 마커
          const endMarkerElement = document.createElement('div')
          endMarkerElement.className = 'route-marker end-marker'
          endMarkerElement.innerHTML = '<div class="route-marker-inner">도착</div>'

          const endMarker = new AdvancedMarkerElement({
            map: map.value,
            position: endPoint,
            content: endMarkerElement,
            zIndex: 9500 // 폴리라인보다 낮게 조정
          })

          currentRouteMarkers.value = [startMarker, endMarker]
        }

        createRouteMarkers()
      }

      // 경로 정보 추출
      const distance = route.distance_text || formatDistance(route.distance)
      const duration = route.duration_text || formatDuration(route.duration * 1000) // 초 -> 밀리초 변환

      // 이동 수단 한글화
      const modeText = travelModeText[mode] || mode

      // 경로에 맞게 지도 뷰 자동 조정
      fitMapToRoute(googleMapsPath)

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

      // 기존 경로 제거 - API 호출 전에 명시적으로 제거
      clearDirections()

      // 서버 API를 통해 Mapbox 길찾기 요청
      const res = await getMapboxDirectionsAPI(params)

      if (res.data && res.data.status !== 'OK') {
        const errorText = typeof res.data.text === 'function' ? await res.data.text() : '알 수 없는 오류'
        throw new Error(`API 응답 오류 (${res.status}): ${errorText}`)
      }

      const data = res.data

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
      if (newDirections && map.value) {
        // 기존 경로 제거
        clearDirections()

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

  return {
    currentRoutePolyline,
    currentRouteMarkers,
    clearDirections,
    findDirections,
    fitMapToRoute
  }
}