<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { signInWithRedirect } from 'aws-amplify/auth'
import { Amplify } from 'aws-amplify'
import amplifyConfig from '@/configs/amplify-config'

const route = useRoute()
const router = useRouter()
const isLoading = ref(false)

const signInWithRedirectCall = async () => {
  try {
    isLoading.value = true
    const redirectTarget = route.query?.redirect || '/mainHome'
    localStorage.setItem('redirectPath', String(redirectTarget))
    await signInWithRedirect()
  } catch (err) {
    console.error('로그인 리디렉션 오류:', err)
    isLoading.value = false
  }
}

const handleAuthentication = async () => {
  try {
    // Amplify 설정 확인
    Amplify.configure(amplifyConfig)

    // 리디렉션 대상 확인 (localStorage가 비어있는 경우 대비)
    let redirectPath = localStorage.getItem('redirectPath')
    console.log('저장된 리디렉션 경로:', redirectPath)

    // 리디렉션 경로가 없거나 유효하지 않은 경우 기본값 설정
    if (!redirectPath || redirectPath === 'undefined' || redirectPath === 'null') {
      redirectPath = '/mainHome'
    }

    localStorage.removeItem('redirectPath') // 사용 후 삭제
    console.log('리디렉션할 경로:', redirectPath)

    // 성공 후 리디렉션 (try-catch로 감싸서 리디렉션 오류 처리)
    try {
      await router.push(redirectPath)
    } catch (routerError) {
      console.error('라우터 리디렉션 오류:', routerError)
      // 리디렉션 실패 시 기본 경로로 이동
      await router.push('/mainHome')
    }
  } catch (err: any) {
    console.error('인증 처리 오류:', err)
  }
}

// onMounted 로직 수정 - 리디렉션 조건 명확화
onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')
  if (code) handleAuthentication()
})
</script>

<template>
  <v-container class="login-container d-flex align-center justify-center" fluid>
    <v-card class="login-card mx-auto" max-width="420" elevation="8">
      <div class="login-header text-center pa-6">
        <div class="logo-container mb-4">
          <div class="app-logo">
            <span class="text-primary font-weight-bold text-h4">AI</span>
            <span class="text-secondary font-weight-medium text-h4">Tour</span>
          </div>
        </div>
        <h1 class="text-h5 font-weight-bold mb-1">환영합니다</h1>
        <p class="text-subtitle-1 text-medium-emphasis">서비스를 이용하려면 로그인하세요</p>
      </div>

      <v-divider></v-divider>

      <v-card-text class="pa-6">
        <div class="login-illustration text-center mb-8">
          <v-img
            src="https://api.iconify.design/clarity:login-solid.svg?color=%236200ea"
            alt="로그인 아이콘"
            width="64"
            class="mx-auto mb-4"
          ></v-img>
          <p class="text-body-1 text-medium-emphasis">
            Google 계정으로 간편하게 로그인하고<br>AI 투어 서비스를 이용해보세요
          </p>
        </div>

        <v-btn
          block
          color="primary"
          variant="elevated"
          height="54"
          class="text-none google-btn"
          @click="signInWithRedirectCall"
          :loading="isLoading"
        >
          <v-icon start class="mr-2">mdi-google</v-icon>
          Google 계정으로 계속하기
        </v-btn>
      </v-card-text>

      <v-card-actions class="justify-center pa-6 pt-0">
        <p class="text-caption text-medium-emphasis">
          로그인 시 <a href="#" class="text-decoration-none text-primary">서비스 약관</a> 및
          <a href="#" class="text-decoration-none text-primary">개인정보 처리방침</a>에 동의하게 됩니다
        </p>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e9f2 100%);
}

.login-card {
  border-radius: 16px;
  overflow: hidden;
}

.app-logo {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 24px;
  letter-spacing: -0.5px;
}

.google-btn {
  letter-spacing: 0.25px;
  text-transform: none;
  font-weight: 500;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>