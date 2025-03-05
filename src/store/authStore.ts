import { ref, type Ref } from 'vue'
import { defineStore } from 'pinia'

type Tokens = {
  accessToken: string,
  idToken: string,
  refreshToken: string
}

const useAuthStore = defineStore('auth', () => {
  const tokens: Ref<Tokens | null> = ref(null)

  function setTokens(payload: Tokens): void {
    tokens.value = payload
  }
  function getAccessToken(): string {
    return <string>tokens.value?.accessToken
  }
  return { tokens, setTokens, getAccessToken }
})

export default useAuthStore
