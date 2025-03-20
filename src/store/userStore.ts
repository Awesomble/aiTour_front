// useUserStore.ts 수정안
import { ref, type Ref } from 'vue'
import { defineStore } from 'pinia'
import { BedrockClient } from '@aws-sdk/client-bedrock'
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime'
import { getCurrentUser, signOut, fetchAuthSession } from 'aws-amplify/auth'
import { Hub } from 'aws-amplify/utils'
import { getMeAPI } from '@/network/app'
import { UserInfo } from '@/types'

const defaultRegion = 'ap-northeast-2'
const useUserStore = defineStore('user', () => {
  const user: Ref<object | null> = ref(null)
  const userInfo: Ref<UserInfo | null> = ref(null)
  const isAuthenticating: Ref<boolean> = ref(false) // 인증 진행 상태 추적

  async function getUserInfo() {
    // 이미 인증 중이면 중복 호출 방지
    if (isAuthenticating.value) return

    isAuthenticating.value = true

    try {
      console.log('Getting current user...')
      const currentUser = await getCurrentUser()
      console.log('Current user:', currentUser)

      const authSession = await fetchAuthSession()
      user.value = currentUser

      if (authSession.tokens?.idToken) {
        const idTokenPayload = authSession.tokens.idToken.payload
        userInfo.value = {
          email: idTokenPayload.email as string,
          user_name: (idTokenPayload.name || idTokenPayload.given_name) as string,
          groups: (idTokenPayload['cognito:groups'] as string[]) || [],
          accessToken: authSession.tokens?.accessToken
            ? authSession.tokens.accessToken.toString()
            : '',
          sub: idTokenPayload.sub as string
        }
        console.log('AWS user info loaded successfully')
      } else {
        console.warn('No ID token available in auth session')
        return
      }

      // 백엔드 API 호출 시 타임아웃 적용
      if (userInfo.value?.sub) {
        try {
          console.log('Calling backend API...')
          // 타임아웃 설정으로 API 호출
          const response = (await Promise.race([
            getMeAPI(userInfo.value.email, userInfo.value.user_name),
            new Promise((_, reject) => setTimeout(() => reject(new Error('API Timeout')), 10000))
          ])) as any

          console.log('Backend user info received:', response.data)

          if (response.data) {
            userInfo.value = {
              ...userInfo.value,
              ...response.data
            }
          }
        } catch (e) {
          console.error('Failed to update backend user info', e)
          // 백엔드 API 실패해도 인증 프로세스는 계속 진행
        }
      }

      return userInfo.value // 성공 시 사용자 정보 반환
    } catch (e) {
      console.error('Error in getUserInfo:', e)
      user.value = null
      userInfo.value = null
      throw e // 오류를 호출자에게 전파하여 처리할 수 있게 함
    } finally {
      isAuthenticating.value = false // 작업 완료 표시
    }
  }

  function getAccessToken(): string {
    return userInfo.value?.accessToken ?? ''
  }

  async function getBedrockClient(region = defaultRegion) {
    const session = await fetchAuthSession()
    return new BedrockClient({
      region,
      credentials: session.credentials
    })
  }

  async function getBedrockRuntimeClient(region = defaultRegion) {
    const session = await fetchAuthSession()
    return new BedrockRuntimeClient({
      region,
      credentials: session.credentials
    })
  }

  async function signOutUser() {
    await signOut()
    localStorage.clear()
    user.value = null
    userInfo.value = null
  }

  // Hub 리스너는 초기화 시 한 번만 설정
  function setupAuthListener() {
    Hub.listen('auth', async ({ payload }) => {
      console.log('Auth event:', payload.event)
      if (payload.event === 'signInWithRedirect') {
        try {
          await getUserInfo()
          console.log('Auth completed successfully')
        } catch (error) {
          console.error('Error during auth completion:', error)
          // 오류 처리 - 필요한 경우 사용자에게 알림
        }
      }
    })
  }

  // 스토어 생성 시 리스너 한 번만 설정
  setupAuthListener()

  return {
    user,
    userInfo,
    getUserInfo,
    getAccessToken,
    getBedrockClient,
    getBedrockRuntimeClient,
    signOutUser,
    isAuthenticating // 상태 노출
  }
})

export default useUserStore
