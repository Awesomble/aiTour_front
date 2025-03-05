import axios from 'axios'
import { useToast } from 'vue-toastification'
import useAuthStore from '@/store/authStore'

const toast = useToast()
const authStore = useAuthStore()
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
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authStore?.getAccessToken()}`
    }
  })
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