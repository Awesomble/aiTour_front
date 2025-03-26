export const getInitials = (name: string | null | undefined): string => {
  if (!name) return ''
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0]?.toUpperCase() || '')
    .join('')
}
export const openMapWithRoute = (
  mapType: 'google' | 'naver',
  startLat: number,
  startLng: number,
  destLat: number,
  destLng: number,
  transportMode: string
): boolean => {
  try {
    // AndroidInterface 객체가 존재하는지 확인 (안드로이드 환경인지 체크)
    if (window.AndroidInterface && typeof window.AndroidInterface.openMapApp === 'function') {
      // 안드로이드 네이티브 메서드 호출
      return window.AndroidInterface.openMapApp(
        mapType,
        startLat,
        startLng,
        destLat,
        destLng,
        transportMode
      )
    } else {
      // 대체 방법: 웹 브라우저에서 지도 서비스 열기
      if (mapType.toLowerCase() === 'google') {
        window.open(
          `https://www.google.com/maps/dir/?api=1&origin=${startLat},${startLng}&destination=${destLat},${destLng}&travelmode=${transportMode}`,
          '_blank'
        )
      } else if (mapType.toLowerCase() === 'naver') {
        window.open(
          `https://map.naver.com/v5/directions/${startLng},${startLat},출발지,,/${destLng},${destLat},도착지,,/`,
          '_blank'
        )
      }
      return false
    }
  } catch (error) {
    console.error('지도 앱 실행 중 오류 발생:', error)
    return false
  }
}

export const openMapToDestination = (
  mapType: 'google' | 'naver',
  destLat: number,
  destLng: number,
  transportMode: string
): boolean => {
  try {
    // AndroidInterface 객체가 존재하는지 확인 (안드로이드 환경인지 체크)
    if (window.AndroidInterface && typeof window.AndroidInterface.openMapAppSimple === 'function') {
      // 안드로이드 네이티브 메서드 호출
      return window.AndroidInterface.openMapAppSimple(mapType, destLat, destLng, transportMode)
    } else {
      // 대체 방법: 웹 브라우저에서 지도 서비스 열기
      if (mapType.toLowerCase() === 'google') {
        window.open(
          `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=${transportMode}`,
          '_blank'
        )
      } else if (mapType.toLowerCase() === 'naver') {
        window.open(
          `https://map.naver.com/v5/directions/,,현재위치,,/${destLng},${destLat},도착지,,/`,
          '_blank'
        )
      }
      return false
    }
  } catch (error) {
    console.error('지도 앱 실행 중 오류 발생:', error)
    return false
  }
}
