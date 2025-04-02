import { adminInstance } from '@/network/instance'
import { RouteParamValue } from 'vue-router'
import qs from 'qs'

// Axios 인스턴스를 미리 생성
const instance = adminInstance()

export const getPlacesAPI = async (page: number, category: number[], name: string, address: string) => {
  return instance.get(`/places`, {
    params: {page, category, name, address},
    paramsSerializer: params => qs.stringify(params, { arrayFormat: 'repeat' })
  })
}
export const getPlacesDetailAPI = async (place_id: string | RouteParamValue[]) => {
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
export const addPlaceHashtagAPI = async (place_id: string, payload: object) => {
  return instance.post(`/places/${place_id}/hashtags`, payload)
}
export const delPlaceHashtagAPI = async (place_id: string, hashtag_id: string) => {
  return instance.delete(`/places/${place_id}/hashtags/${hashtag_id}`)
}
// specialday
export const getSpecialDaysAPI = async (place_id: string, year: string, month: string) => {
  return instance.get(`/places/${place_id}/special-days`, {
    params: { year, month }
  })
}
export const addSpecialDaysAPI = async (place_id: string, payload: object) => {
  return instance.post(`/places/${place_id}/special-days`, payload)
}
export const delSpecialDaysAPI = async (place_id: string, special_day_id: number) => {
  return instance.delete(`/places/${place_id}/special-days/${special_day_id}`)
}
// file
export const uploadPlaceFileAPI = async (place_id: string, payload: any) => {
  return instance.post(`/photos/upload/${place_id}`, payload, { headers: { 'Content-Type': 'multipart/form-data' }})
}
export const uploadLandmarkFileAPI = async (place_id: string, payload: any) => {
  return instance.post(`/photos/upload-landmark/${place_id}`, payload, { headers: { 'Content-Type': 'multipart/form-data' }})
}
export const delPlaceFileAPI = async (place_id: string, photo_id: string) => {
  return instance.delete(`/photos/places/${place_id}/photos/${photo_id}`)
}

export const getMainCategoriesAPI = async () => {
  return instance.get(`/categories/main`)
}
export const getCategoriesAPI = async () => {
  return instance.get(`/categories`)
}
export const getCategoriesDetailAPI = async (id: string) => {
  return instance.get(`/categories/${id}`)
}
export const addCategoriesAPI = async (payload: object) => {
  return instance.post(`/categories`, payload)
}
export const putCategoriesAPI = async (id: string, payload: object) => {
  return instance.put(`/categories/${id}`, payload)
}
export const delCategoriesAPI = async (category_id: number) => {
  return instance.delete(`/categories/${category_id}`)
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
export const getJsonAPI = async () => {
  return instance.get(`/places/detailed/file`)
}


