import type { MapBounds } from '../../../types'

// 지도 변경 임계값
export const MAP_CHANGE_THRESHOLD = 0.001

/**
 * 마커 아이콘 색상에서 배경색 생성 (더 밝은 색상)
 * @param hexColor 16진수 색상 코드
 * @returns 밝은 RGB 색상 값
 */
export const createLighterColor = (hexColor: string): string => {
  const hexValue = hexColor.replace('#', '')
  const r = parseInt(hexValue.substring(0, 2), 16)
  const g = parseInt(hexValue.substring(2, 4), 16)
  const b = parseInt(hexValue.substring(4, 6), 16)

  const lightR = Math.min(255, Math.floor(r + (255 - r) * 0.9))
  const lightG = Math.min(255, Math.floor(g + (255 - g) * 0.9))
  const lightB = Math.min(255, Math.floor(b + (255 - b) * 0.9))

  return `rgb(${lightR}, ${lightG}, ${lightB})`
}

/**
 * 이동 모드에 따른 폴리라인 색상 매핑
 */
export const routeColorMapping:  Record<string, string> = {
  'walking': '#4285F4',  // 녹색
  'cycling': '#FF9800',  // 주황색
  'driving': '#4CAF50'   // 파란색
}

/**
 * 이동 모드 영어-한글 변환
 */
export const travelModeText: Record<string, string> = {
  'walking': '도보',
  'cycling': '자전거',
  'driving': '자동차'
}