/**
 * 밀리초를 사람이 읽기 쉬운 시간 형식으로 변환
 * @param milliseconds 밀리초
 * @returns 포맷된 시간 문자열 (예: "약 30분", "약 1시간 30분")
 */
export const formatDuration = (milliseconds: number): string => {
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

/**
 * 미터를 km 또는 m 형식으로 변환
 * @param meters 미터 단위 거리
 * @returns 포맷된 거리 문자열 (예: "1.5km", "800m")
 */
export const formatDistance = (meters: number): string => {
  return meters >= 1000
    ? `${(meters / 1000).toFixed(1)}km`
    : `${meters}m`
}