import axios from 'axios'

const adminBaseURL = 'http://3.36.140.131:8080'
// const adminBaseURL = 'https://aitour-api.awesomble.com'
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
