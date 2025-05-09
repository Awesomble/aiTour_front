import { ComputedRef, Ref } from 'vue'
import { ContainerSize, Place } from './useRadarState'

interface Position {
  x: number
  y: number
}

interface GlobalStore {
  lat: number
  lng: number
  [key: string]: any
}

const useGpsTransform = () => {

  // 중심 좌표에 대한 방위각(0°=북쪽, 90°=동쪽, 180°=남쪽, 270°=서쪽) 계산 함수
  const getBearing = (lat: number, lng: number, centerLat: number, centerLng: number): number => {
    const dLat = (lat - centerLat) * Math.PI / 180
    const dLng = (lng - centerLng) * Math.PI / 180
    const y = Math.sin(dLng) * Math.cos(lat * Math.PI / 180)
    const x = Math.cos(centerLat * Math.PI / 180) * Math.sin(lat * Math.PI / 180) -
      Math.sin(centerLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * Math.cos(dLng)
    let bearing = Math.atan2(y, x) * 180 / Math.PI
    if (bearing < 0) bearing += 360
    return bearing
  }

  // GPS 좌표를 레이더 UI 상의 좌표로 변환 (선형 스케일링, 스프레드 팩터 적용)
  const gpsToRadarPosition = (
    lat: number,
    lng: number,
    centerLat: number,
    centerLng: number,
    maxDistance: number,
    containerWidth: number,
    containerHeight: number
  ): Position => {
    if (!lat || !lng || !centerLat || !centerLng || !maxDistance) {
      console.warn('잘못된 GPS 좌표 또는 거리 값', { lat, lng, centerLat, centerLng, maxDistance })
      return { x: 0, y: 0 }
    }
    const width = containerWidth || 300
    const height = containerHeight || 300
    // 지구 반경 (km)
    const R = 6371
    // 위도/경도 차이를 라디안으로 변환하여 Haversine 공식으로 거리 계산 (km)
    const dLat = (lat - centerLat) * Math.PI / 180
    const dLng = (lng - centerLng) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(centerLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c
    // 스프레드 팩터를 적용해 레이더 UI 반지름 계산 (좀더 펼쳐짐)
    const spreadFactor = 1.2
    const radarRadius = Math.min(width, height) / 2 * 0.8 * spreadFactor
    // 최대 거리에 대한 비율 (0 ~ 1)
    const distanceRatio = Math.min(distance / maxDistance, 1)
    let distance_px = distanceRatio * radarRadius
    // 중앙 데드존 (예: 80px) 적용
    const centerDeadZone = 80
    if (distance_px < centerDeadZone && distance_px > 0) {
      distance_px = centerDeadZone
    }
    // getBearing으로 방위각 계산 후, CSS 좌표 계산 (x: 동쪽(+), y: 북쪽(-))
    const angle = getBearing(lat, lng, centerLat, centerLng) * Math.PI / 180
    return {
      x: Math.sin(angle) * distance_px,
      y: -Math.cos(angle) * distance_px
    }
  }

  // 향상된 겹침 방지 알고리즘 - 마커 유형에 따라 다른 최소 거리 적용
  const adjustForOverlap = (
    positions: Position[],
    newPosition: Position,
    minDistance: number = 50,
    isLandmark: boolean = false
  ): Position => {
    let adjustedPos = { ...newPosition }
    let iteration = 0
    const maxIteration = 20 // 최대 반복 횟수 증가

    // 랜드마크는 크기가 더 크므로 더 넓은 거리 적용
    const actualMinDistance = isLandmark ? 120 : minDistance

    while (iteration < maxIteration) {
      let overlapFound = false

      for (const pos of positions) {
        const dx = adjustedPos.x - pos.x
        const dy = adjustedPos.y - pos.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < actualMinDistance) {
          overlapFound = true

          // 겹치는 경우, 두 좌표 사이의 각도를 구해 필요한 만큼 이동
          const angle = Math.atan2(dy, dx)
          const requiredOffset = actualMinDistance - distance + 10 // 여유 공간 더 추가

          // 기존 방향으로 이동 + 약간의 랜덤 요소 추가 (음수 방지)
          const randomOffset = Math.random() * 8 + 2
          adjustedPos.x += Math.cos(angle) * (requiredOffset + randomOffset)
          adjustedPos.y += Math.sin(angle) * (requiredOffset + randomOffset)
          break
        }
      }

      if (!overlapFound) break
      iteration++
    }

    return adjustedPos
  }

  // 단일 장소에 대한 좌표 계산 (유효한 컨테이너 사이즈 조건 하)
  const getPlacePosition = (
    place: Place,
    isContainerSizeValid: ComputedRef<boolean>,
    globalStore: GlobalStore,
    zoomLevel: Ref<number>,
    containerSize: Ref<ContainerSize>
  ): Position => {
    if (!isContainerSizeValid.value || !place || !place.latitude || !place.longitude) {
      return { x: 0, y: 0 }
    }
    return gpsToRadarPosition(
      place.latitude,
      place.longitude,
      globalStore.lat,
      globalStore.lng,
      zoomLevel.value,
      containerSize.value.width,
      containerSize.value.height
    )
  }

  // 모든 장소의 좌표를 계산하고, 북쪽부터 시계방향으로 정렬한 후 겹침 방지 적용
  const getAdjustedPlacePositions = (
    places: Place[],
    isContainerSizeValid: ComputedRef<boolean>,
    globalStore: GlobalStore,
    zoomLevel: Ref<number>,
    containerSize: Ref<ContainerSize>
  ): Record<string, Position> => {
    if (!isContainerSizeValid.value || !places.length) {
      return {}
    }

    const positions: Record<string, Position> = {}
    const calculatedPositions: Position[] = []

    // GPS 좌표 기준으로 마커의 거리 계산
    const calculateDistance = (place: Place): number => {
      const R = 6371
      const dLat = (place.latitude - globalStore.lat) * Math.PI / 180
      const dLng = (place.longitude - globalStore.lng) * Math.PI / 180
      const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(globalStore.lat * Math.PI / 180) *
        Math.cos(place.latitude * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return R * c
    }

    // 랜드마크와 일반 마커를 분리
    const landmarks = places.filter(place => place.landmark_url)
    const regularPlaces = places.filter(place => !place.landmark_url)

    // 중심에서 가까운 순서로 정렬 (가까운 마커가 먼저 배치되도록)
    const sortedLandmarks = [...landmarks].sort((a, b) => calculateDistance(a) - calculateDistance(b))
    const sortedRegularPlaces = [...regularPlaces].sort((a, b) => calculateDistance(a) - calculateDistance(b))

    // 랜드마크 먼저 배치 (더 크므로 우선 자리 차지)
    for (const place of sortedLandmarks) {
      if (!place || !place.place_id || !place.latitude || !place.longitude) continue

      const basePosition = gpsToRadarPosition(
        place.latitude,
        place.longitude,
        globalStore.lat,
        globalStore.lng,
        zoomLevel.value,
        containerSize.value.width,
        containerSize.value.height
      )

      // 랜드마크는 더 넓은 간격 필요
      const adjustedPosition = adjustForOverlap(calculatedPositions, basePosition, 80, true)
      positions[place.place_id] = adjustedPosition
      calculatedPositions.push(adjustedPosition)
    }

    // 그 다음 일반 마커 배치
    for (const place of sortedRegularPlaces) {
      if (!place || !place.place_id || !place.latitude || !place.longitude) continue

      const basePosition = gpsToRadarPosition(
        place.latitude,
        place.longitude,
        globalStore.lat,
        globalStore.lng,
        zoomLevel.value,
        containerSize.value.width,
        containerSize.value.height
      )

      // 일반 마커는 기본 간격
      const adjustedPosition = adjustForOverlap(calculatedPositions, basePosition, 50, false)
      positions[place.place_id] = adjustedPosition
      calculatedPositions.push(adjustedPosition)
    }

    return positions
  }

  return {
    gpsToRadarPosition,
    getPlacePosition,
    getAdjustedPlacePositions,
    adjustForOverlap
  }
}

export default useGpsTransform