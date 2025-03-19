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
export const getPlacesDetailAPI = async (place_id: string | RouteParamValue[]) => {
  return instance.get(`/places/${place_id}`)
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

export const getDrotectedAPI = async () => {
  return instance.get(`/auth/protected`)
}


