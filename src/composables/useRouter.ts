export const shwPlaceDetail = async (placeId: string, route: any, router: any) => {
  console.log('shwPlaceDetail', placeId)
  console.log(route, router)
  if (!route || !router) return
  // 현재 쿼리 파라미터에서 place만 제외한 다른 파라미터 유지
  const { place: _, ...restQuery } = route.query
  if (route.query.place) {
    // 먼저 place를 제거한 URL로 히스토리 상태 대체 (히스토리 추가 없음)
    await router.replace({ query: restQuery })
    // 그 다음 새로운 place로 이동 (히스토리에 추가)
    await router.push({ query: { ...restQuery, place: placeId } })
  } else {
    // place가 없는 경우 바로 이동
    await router.push({ query: { ...restQuery, place: placeId } })
  }
}

/**
 * 인원 구성에 따라 예상 이동 시간을 계산하는 함수
 * @param {number} distanceInMeters - 이동 거리(미터)
 * @param {number} adultCount - 성인 수
 * @param {number} childCount - 아이 수 (만 5-12세)
 * @param {number} babyCount - 영유아 수 (0-4세)
 * @returns {Object} 예상 이동 시간 (분) 및 추가 정보
 */
export const calculateTravelTime = (distanceInMeters: number, adultCount: number = 1, childCount: number = 0, babyCount:number = 0) => {
  // 기본 성인 평균 걷는 속도 (미터/분)
  const ADULT_WALKING_SPEED = 83 // 약 5km/h

  // 1. 기본 속도 계산 (성인만 있을 경우)
  let effectiveSpeed = ADULT_WALKING_SPEED

  // 2. 인원 구성에 따른 속도 조정

  // 아이가 있을 경우 (만 5-12세)
  if (childCount > 0) {
    // 아이 1명당 10%씩 속도 감소 (최대 40%)
    const childFactor = Math.max(0.6, 1 - childCount * 0.1)
    effectiveSpeed *= childFactor
  }

  // 영유아가 있을 경우 (0-4세)
  if (babyCount > 0) {
    // 영유아 1명당 20%씩 속도 감소 (최대 60%)
    const babyFactor = Math.max(0.4, 1 - babyCount * 0.2)
    effectiveSpeed *= babyFactor
  }

  // 성인이 많을 경우 (아이/영유아 돌봄 분담 효과)
  if (adultCount > 1 && (childCount > 0 || babyCount > 0)) {
    // 성인 1명 추가당 최대 8%까지 속도 회복
    const adultHelperFactor = Math.min(1.25, 1 + (adultCount - 1) * 0.08)
    effectiveSpeed *= adultHelperFactor
  }

  // 3. 휴식 시간 계산
  let restMinutes = 0

  // 영유아가 있을 경우 휴식 시간 추가 (수유, 기저귀 교체, 화장실 등)
  if (babyCount > 0) {
    // 1km당 약 4분의 휴식 시간 (영유아 1명당)
    restMinutes += (distanceInMeters / 1000) * 4 * babyCount
  }

  // 아이가 있을 경우 약간의 휴식 시간 추가
  if (childCount > 0) {
    // 1km당 약 2분의 휴식 시간 (아이 인원수와 무관)
    restMinutes += (distanceInMeters / 1000) * 2
  }

  // 4. 최종 이동 시간 계산
  const movingMinutes = distanceInMeters / effectiveSpeed
  const totalMinutes = movingMinutes + restMinutes

  // 결과 반환
  return {
    // 반올림하여 정수로 표시
    totalTimeMinutes: Math.round(totalMinutes),
    movingTimeMinutes: Math.round(movingMinutes),
    restTimeMinutes: Math.round(restMinutes),
    effectiveSpeedKmh: ((effectiveSpeed * 60) / 1000).toFixed(1), // km/h로 변환
    details: {
      adultCount,
      childCount,
      babyCount,
      distanceKm: (distanceInMeters / 1000).toFixed(1)
    }
  }
}
