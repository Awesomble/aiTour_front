import { appInstance } from '@/network/instance'
import qs from 'qs'
import { RouteParamValue } from 'vue-router'

// Axios 인스턴스를 미리 생성
const instance = appInstance()

export const getPlacesListAPI = async (page: number, limit: number = 10, category: number[]) => {
  return instance.get(`/places/detailed`, {
    params: {page, limit, category},
    paramsSerializer: params => qs.stringify(params, { arrayFormat: 'repeat' })
  })
}
export const getPlacesDetailAPI = async (place_id: string | RouteParamValue[]) => {
  return instance.get(`/places/${place_id}`)
}

export const getDrotectedAPI = async () => {
  return instance.get(`/places/protected`)
}


