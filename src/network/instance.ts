import axios from 'axios'
import { useToast } from 'vue-toastification'
import { useUserStore } from '@/store'

const toast = useToast()
const adminBaseURL = import.meta.env?.VITE_ADMIN_URL
export const adminInstance = () => {
  const instance = axios.create({
    baseURL: adminBaseURL,
    timeout: 50000,
    withCredentials: true,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  })
  instance.interceptors.response.use(response, errorHandler)
  return instance

}
export const appInstance = () => {
  const instance = axios.create({
    baseURL: adminBaseURL,
    timeout: 50000,
    withCredentials: true,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
      // Authorization 헤더는 인터셉터에서 추가합니다.
    }
  })

  // 요청 인터셉터: 요청 직전에 토큰 확인 후 헤더에 추가
  instance.interceptors.request.use(
    (config) => {
      // 함수 내부에서 스토어를 호출하여 최신 스토어 인스턴스를 가져옵니다.
      const userStore = useUserStore()
      const token = userStore.getAccessToken()
      if (token) {
        config.headers = config.headers || {}
        config.headers['Authorization'] = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const { response } = error
      if (response) {
        toast.error(response.data.detail || error.message)
      } else {
        toast.error('네트워크 에러')
      }
      return Promise.reject(error)
    }
  )

  return instance
}

const response = (response: any) => {
  return response
}
const errorHandler = (error: any) => {
  const { response } = error
  if (response) {
    toast.error(response.data.detail || error.message)
  } else {
    toast.error('네트워크 에러')
  }
  // return Promise.reject(error)
}