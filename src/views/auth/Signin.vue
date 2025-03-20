<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { signInWithRedirect } from 'aws-amplify/auth'

const route = useRoute()
const router = useRouter()
const isRedirecting = ref(false)

const signInWithRedirectCall = async () => {
  try {
    isRedirecting.value = true

    // 현재 경로나 쿼리에서 리디렉션 경로 확인
    const redirectTarget = route.query?.redirect || '/mainHome'

    // 명확한 문자열로 저장 (undefined나 null 방지)
    localStorage.setItem('redirectPath', String(redirectTarget))
    console.log('저장된 리디렉션 경로:', redirectTarget)

    // 리디렉션 호출
    await signInWithRedirect()
  } catch (err) {
    console.error('로그인 리디렉션 오류:', err)
    isRedirecting.value = false
  }
}

// onMounted 로직 수정 - 리디렉션 조건 명확화
onMounted(() => {
  // 쿼리 파라미터에 redirect가 있고, 현재 로그인 페이지에서만 리디렉션 수행
  if (route.query.redirect && route.path.includes('signIn')) {
    const redirect = (route.query.redirect as string)
    // 유효한 경로인지 확인 후 리디렉션
    if (redirect && redirect !== 'undefined' && redirect !== 'null') {
      console.log('쿼리 파라미터에서 리디렉션:', redirect)
      router.push(redirect)
    }
  }
})
</script>

<template>
  <v-container fluid>
    <!-- 인증 관련 버튼 추가 -->
    <div class="auth-buttons">
      <v-btn
        color="primary"
        @click="signInWithRedirectCall"
        :loading="isRedirecting"
        :disabled="isRedirecting"
      >
        Sign In
      </v-btn>
    </div>
  </v-container>
</template>