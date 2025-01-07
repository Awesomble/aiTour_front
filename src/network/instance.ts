import axios from 'axios'

const adminBaseURL = import.meta.env.VITE_ADMIN_URL
console.log(adminBaseURL)
export const adminInstance = () => {
  return axios.create({
    baseURL: adminBaseURL,
    timeout: 5000,
    withCredentials: true,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  })
}
