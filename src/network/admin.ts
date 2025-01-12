import { adminInstance } from '@/network/instance'

// Axios 인스턴스를 미리 생성
const instance = adminInstance()

export const getPlacesAPI = async () => {
  return instance.get(`/places`)
}
export const getPlacesDetailAPI = async (place_id: string) => {
  return instance.get(`/places/${place_id}`)
}
export const addPlaceAPI = async (payload: object) => {
  return instance.post(`/places`, payload)
}
export const delPlaceAPI = async (place_id: string) => {
  return instance.delete(`/places/${place_id}`)
}
export const updatePlaceAPI = async (place_id: string, payload: object) => {
  return instance.put(`/places/${place_id}`, payload)
}

export const getHashtagsAPI = async () => {
  return instance.get(`/hashtags`)
}
export const addHashtagsAPI = async (payload: object) => {
  return instance.post(`/hashtags`, payload)
}
export const delHashtagsAPI = async (hashtag_id: number) => {
  return instance.delete(`/hashtags/${hashtag_id}`)
}
