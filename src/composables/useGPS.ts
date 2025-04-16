export const isGPSAvailable = () => {
  // 직접 함수 자체를 반환합니다
  return () => {
    try {
      window.AndroidInterface?.isGPSAvailable()
    } catch (err: any) {
      console.error('Vibration error:', err)
    }
  }
}
export const calculateRadiusBoundaries = (
  lat: number,
  lng: number,
  radiusKm: number
): {
  lat_min: number
  lat_max: number
  lng_min: number
  lng_max: number
} | null => {
  // 입력값 유효성 검사
  if (!isValidLocation({ lat, lng })) {
    console.error('유효하지 않은 중심점 좌표입니다.', { lat, lng })
    return null
  }

  if (typeof radiusKm !== 'number' || radiusKm <= 0) {
    console.error('유효하지 않은 반경 값입니다:', radiusKm)
    return null
  }

  try {
    // 위도 1도당 거리 (km)
    const latKmPerDegree = 111.32

    // 경도 1도당 거리 (km) - 위도에 따라 변경됨
    const lngKmPerDegree = 111.32 * Math.cos((lat * Math.PI) / 180)

    // 위도/경도 변화량 계산
    const latChange = radiusKm / latKmPerDegree
    const lngChange = radiusKm / lngKmPerDegree

    // 경계 좌표 계산
    const lat_min = lat - latChange
    const lat_max = lat + latChange
    const lng_min = lng - lngChange
    const lng_max = lng + lngChange

    return { lat_min, lat_max, lng_min, lng_max }
  } catch (error) {
    console.error(`반경 계산 중 오류: ${error}`)
    return null
  }
}

/**
 * 위치 유효성 검사 함수
 */
export const isValidLocation = (location: any): boolean => {
  return (
    location &&
    typeof location.lat === 'number' &&
    typeof location.lng === 'number' &&
    !isNaN(location.lat) &&
    !isNaN(location.lng) &&
    location.lat >= -90 &&
    location.lat <= 90 &&
    location.lng >= -180 &&
    location.lng <= 180
  )
}
