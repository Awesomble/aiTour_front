<template>
  <div class="auth-complete">
    <v-container class="d-flex justify-center align-center" style="height: 100vh">
      <v-card max-width="400" class="pa-4" v-if="loading">
        <v-card-text class="text-center">
          <v-progress-circular
            indeterminate
            color="primary"
            size="50"
          ></v-progress-circular>
          <p class="mt-4 text-body-1">로그인 처리 중입니다...</p>
        </v-card-text>
      </v-card>

      <v-card max-width="400" class="pa-4" v-if="error">
        <v-card-title class="text-h6 error--text">로그인 오류</v-card-title>
        <v-card-text>
          <p>{{ errorMessage }}</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            @click="goToHome"
          >
            홈으로
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Amplify } from 'aws-amplify'
import amplifyConfig from '@/configs/amplify-config'
import { useUserStore } from '@/store' // 사용자 정보를 관리하는 Pinia 스토어

// 상태 정의
const loading = ref(true)
const error = ref(false)
const errorMessage = ref('')

// 라우터와 Pinia 스토어 설정
const router = useRouter()
const userStore = useUserStore()

// 홈으로 이동하는 함수
const goToHome = () => {
  router.push('/')
}

// 인증 처리 함수
const handleAuthentication = async () => {
  try {
    // Amplify 설정 확인
    Amplify.configure(amplifyConfig)

    // URL에서 code 파라미터 추출
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')

    if (!code) {
      throw new Error('인증 코드가 없습니다.')
    }

    // 사용자 정보 가져오기 - userStore에서 관리하는 메서드 사용
    await userStore.getUserInfo()
    console.log('로그인 성공: 사용자 정보가 스토어에 저장되었습니다.')

    // 리디렉션 대상 확인 (로컬 스토리지에 저장된 경로)
    const redirectPath = localStorage.getItem('redirectPath') || '/mainHome'
    localStorage.removeItem('redirectPath') // 사용 후 삭제

    // 성공 후 리디렉션
    await router.push(redirectPath)
  } catch (err: any) {
    console.error('인증 처리 오류:', err)
    error.value = true
    errorMessage.value = err.message || '인증 처리 중 오류가 발생했습니다.'
    loading.value = false
  }
}

// 컴포넌트 마운트 시 인증 처리 실행
onMounted(handleAuthentication)
</script>