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

  async function getUserInfo() {
    try {
      console.log('currentUser-->')
      const currentUser = await getCurrentUser()
      console.log('currentUser:', currentUser)
      const authSession = await fetchAuthSession()
      user.value = currentUser
      console.log(user.value)
      if (authSession.tokens?.idToken) {
        const idTokenPayload = authSession.tokens.idToken.payload
        userInfo.value = {
          email: idTokenPayload.email as string,
          user_name: (idTokenPayload.name || idTokenPayload.given_name) as string,
          groups: (idTokenPayload['cognito:groups'] as string[]) || [],
          accessToken: authSession.tokens?.accessToken ? authSession.tokens.accessToken.toString() : "",
          sub: idTokenPayload.sub as string
        }
        console.log("AWS user info: ", userInfo.value)
        console.log(idTokenPayload)
      }

      // 현재 사용자의 ID(sub)가 존재하면 백엔드의 getMeAPI를 호출해 사용자 정보를 업데이트 또는 생성
      if (userInfo.value?.sub) {
        try {
          const response = await getMeAPI(userInfo.value.email, userInfo.value.user_name)
          console.log("Backend user info: ", response.data)
          // 필요한 경우 백엔드에서 반환한 데이터를 userInfo에 병합하여 업데이트합니다.
          userInfo.value = {
            ...userInfo.value,
            ...response.data
          }
        } catch (e) {
          console.error("Failed to update backend user info", e)
        }
      }
    } catch (e) {
      console.error("Error in getUserInfo:", e)
      user.value = null
      userInfo.value = null
    }
  }

  function getAccessToken(): string {
    return userInfo.value?.accessToken ?? ""
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

  Hub.listen('auth', async ({ payload }) => {
    if (payload.event === 'signInWithRedirect') {
      await getUserInfo()
    }
  })

  return { user, userInfo, getUserInfo, getAccessToken, getBedrockClient, getBedrockRuntimeClient, signOutUser }
})

export default useUserStore