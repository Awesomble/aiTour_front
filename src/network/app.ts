import { appInstance } from '@/network/instance'
import qs from 'qs'
import { RouteParamValue } from 'vue-router'

// Axios 인스턴스를 미리 생성
const instance = appInstance()

export const getPlacesListAPI = async (page: number, limit: number = 10, category: number[], lat_min: number, lat_max: number, lng_min: number, lng_max: number) => {
  return instance.get(`/places/detailed`, {
    params: {page, limit, category, lat_min, lat_max, lng_min, lng_max},
    paramsSerializer: params => qs.stringify(params, { arrayFormat: 'repeat' })
  })
}
export const getPlacesDetailAPI = async (place_id: string | RouteParamValue[], lat: number, lng: number) => {
  return instance.get(`/places/${place_id}`, {
    params: {lat, lng}
  })
}
export const getRadiusAPI = async (lat: number, lng: number, radius: number, page: number, limit: number = 10, category: number[]) => {
  return instance.get(`/places/radius`, {
    params: {lat, lng, radius, page, limit, category},
    paramsSerializer: params => qs.stringify(params, { arrayFormat: 'repeat' })
  })
}
export const getMeAPI = async (email: string = '', user_name: string = '') => {
  return instance.get(`/user/me`, { params: { email, user_name } })
}
export const putMeAPI = async (payload: object) => {
  return instance.put(`/user/me`, payload)
}
export const updateThumbnailAPI = async (payload: any) => {
  return instance.post(`/user/me/thumbnail`, payload, { headers: { 'Content-Type': 'multipart/form-data' }})
}
export const getMainCategoriesAPI = async () => {
  return instance.get(`/categories/main-list`)
}

export const getRouteDirectionsAPI = async (payload: any) => {
  return instance.post(`/routes/directions`, payload)
}
export const getRouteAPI = async (payload: any) => {
  return instance.post(`/routes/route`, payload)
}
export const responsesMessageAPI = async (message: string) => {
  return instance.get(`/responses/message`, {
    params: { message }
  })
}


// 채팅 API 함수 추가
/**
 * 특정 장소의 채팅 메시지 히스토리를 조회합니다.
 * @param place_id 장소 ID
 * @param limit 최대 조회 메시지 수 (기본값: 50)
 * @param offset 조회 시작 오프셋 (기본값: 0)
 */
export const getChatMessagesAPI = async (place_id: string, limit: number = 50, offset: number = 0) => {
  return instance.get(`/chat/${place_id}/messages`, {
    params: { limit, offset }
  })
}

/**
 * WebSocket 연결을 위한 URL을 생성합니다.
 * 토큰과 기본 URL은 이미 appInstance()에서 관리되므로 별도로 전달하지 않습니다.
 * @param place_id 장소 ID
 * @returns WebSocket 연결 URL
 */
export const getChatWebSocketURL = (place_id: string): string => {
  // 현재 환경의 프로토콜에 따라 ws 또는 wss 사용
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'

  // baseURL은 Axios 인스턴스에서 관리되므로 window.location.host 사용
  // 실제 구현시 appInstance()의 baseURL 설정에 맞게 수정 필요
  const host = window.location.host

  // 토큰은 인스턴스에서 자동으로 관리되므로 별도 추가 불필요
  // 실제 사용 시 인증 토큰을 파라미터로 추가해야 할 수 있음
  return `${protocol}//${host}/api/chat/ws/${place_id}`
}

