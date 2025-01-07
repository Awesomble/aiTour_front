import { adminInstance } from '@/network/instance'

// Axios 인스턴스를 미리 생성
const instance = adminInstance()

export const getPlaceListAPI = async () => {
  return instance.get('/places')
}
