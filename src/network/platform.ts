// src/api/naverDirections.ts
import { naverInstance, appInstance, mapboxInstance } from '@/network/instance'
import qs from 'qs'

// Axios 인스턴스를 미리 생성
const instance = naverInstance()
const appInst = appInstance()
const mapBoxInst = mapboxInstance()

// 네이버 길찾기 API 파라미터 인터페이스
export interface NaverDirectionsParams {
  start: string;      // 출발지 좌표 "경도,위도"
  goal: string;       // 도착지 좌표 "경도,위도"
  option?: string;    // 이동수단 (기본값: walking, 옵션: driving, transit)
  waypoints?: string; // 경유지 좌표 "경도,위도" (여러 개인 경우 세미콜론으로 구분)
  avoid?: string;     // 회피 옵션 (예: tolls, highways 등)
  searchOption?: number; // 경로 탐색 옵션 (0: 추천 경로, 1: 최단 거리, 2: 고속도로 우선 등)
  lang?: string;      // 언어 설정 (ko, en 등)
}

export interface ServerDirectionsParams {
  origin_lat: number;
  origin_lng: number;
  dest_lat: number;
  dest_lng: number;
  mode: string;
}
// 기본 길찾기 API
export const getServerNaverDirectionsAPI = async (params: ServerDirectionsParams) => {
  return appInst.post(`/routes/naver-directions`, params)
}
// 기본 길찾기 API
export const getNaverDirectionsAPI = async (params: NaverDirectionsParams) => {
  return instance.get(`/naver/directions`, { params })
}

// 자동차 길찾기 API
export const getNaverDrivingDirectionsAPI = async (startLng: number, startLat: number, goalLng: number, goalLat: number, options?: Partial<NaverDirectionsParams>) => {
  const start = `${startLng},${startLat}`;
  const goal = `${goalLng},${goalLat}`;

  return instance.get(`/naver/directions/driving`, {
    params: {
      start,
      goal,
      option: 'driving',
      ...options
    },
    paramsSerializer: params => qs.stringify(params, { arrayFormat: 'repeat' })
  })
}

// 도보 길찾기 API
export const getNaverWalkingDirectionsAPI = async (startLng: number, startLat: number, goalLng: number, goalLat: number, options?: Partial<NaverDirectionsParams>) => {
  const start = `${startLng},${startLat}`;
  const goal = `${goalLng},${goalLat}`;

  return instance.get(`/naver/directions/walking`, {
    params: {
      start,
      goal,
      option: 'walking',
      ...options
    },
    paramsSerializer: params => qs.stringify(params, { arrayFormat: 'repeat' })
  })
}

// 대중교통 길찾기 API
export const getNaverTransitDirectionsAPI = async (startLng: number, startLat: number, goalLng: number, goalLat: number, options?: Partial<NaverDirectionsParams>) => {
  const start = `${startLng},${startLat}`;
  const goal = `${goalLng},${goalLat}`;

  return instance.get(`/naver/directions/transit`, {
    params: {
      start,
      goal,
      option: 'transit',
      ...options
    },
    paramsSerializer: params => qs.stringify(params, { arrayFormat: 'repeat' })
  })
}
// mapBox API
export const getMapboxDirectionsAPI = async (params: ServerDirectionsParams) => {
  return appInst.post(`/routes/mapbox-directions`, params)
}