<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { signInWithRedirect } from 'aws-amplify/auth'
import { Amplify } from 'aws-amplify'
import { fetchAuthSession } from 'aws-amplify/auth'
import { useUserStore } from '@/store' // 사용자 스토어 임포트
import amplifyConfig from '@/configs/amplify-config'

// 상태 및 라우터 설정
const route = useRoute()
const router = useRouter()
const isLoading = ref(false)
const errorMessage = ref('')
const hasError = ref(false)
const userStore = useUserStore()

// Google 로그인 실행
const signInWithGoogle = async () => {
  try {
    isLoading.value = true
    const redirectTarget = route.query?.redirect || '/mainHome'
    localStorage.setItem('redirectPath', String(redirectTarget))
    console.log('Google 로그인 시작, 리디렉션 경로:', redirectTarget)
    await signInWithRedirect()
  } catch (err) {
    console.error('로그인 리디렉션 오류:', err)
    errorMessage.value = '로그인 과정에서 오류가 발생했습니다. 다시 시도해주세요.'
    hasError.value = true
    isLoading.value = false
  }
}

// 인증 코드 처리 및 리디렉션
const handleAuthentication = async () => {
  isLoading.value = true
  hasError.value = false
  errorMessage.value = ''

  try {
    console.log('인증 처리 시작')
    // Amplify 설정 확인
    Amplify.configure(amplifyConfig)

    // 코드가 있는지 확인
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    if (!code) {
      console.log('인증 코드가 없습니다 - 로그인 화면 표시')
      isLoading.value = false
      return
    }

    console.log('인증 코드 확인:', code.substring(0, 10) + '...')

    // 세션 확인 - 로그인 되었는지 검증
    try {
      const authSession = await fetchAuthSession()
      if (!authSession.tokens) {
        throw new Error('인증 토큰이 없습니다')
      }
      console.log('인증 세션 확인 완료')
    } catch (sessionError) {
      console.error('세션 확인 오류:', sessionError)
      throw new Error('인증 상태를 확인할 수 없습니다')
    }

    // 사용자 정보 가져오기 - Promise.all을 사용하여 병렬 처리
    try {
      console.log('사용자 정보 가져오기 시작')
      await userStore.getUserInfo()
      console.log('사용자 정보 가져오기 완료')
    } catch (userInfoError) {
      console.error('사용자 정보 가져오기 오류:', userInfoError)
      // 오류가 있어도 계속 진행 (치명적이지 않은 경우)
    }

    // 리디렉션 처리
    let redirectPath = localStorage.getItem('redirectPath')
    console.log('저장된 리디렉션 경로:', redirectPath)

    // 리디렉션 경로가 없거나 유효하지 않은 경우 기본값 설정
    if (!redirectPath || redirectPath === 'undefined' || redirectPath === 'null') {
      redirectPath = '/mainHome'
      console.log('유효하지 않은 경로, 기본값으로 설정:', redirectPath)
    }

    localStorage.removeItem('redirectPath') // 사용 후 삭제

    // 잠시 지연 후 리디렉션 (상태 업데이트 시간 확보)
    console.log('리디렉션 준비 완료:', redirectPath)
    setTimeout(async () => {
      try {
        console.log('페이지 이동 시작...')
        await router.push(redirectPath)
        console.log('페이지 이동 완료!')
      } catch (routerError) {
        console.error('라우터 리디렉션 오류:', routerError)
        // 리디렉션 실패 시 기본 경로로 이동
        hasError.value = true
        errorMessage.value = '페이지 이동 중 오류가 발생했습니다.'
        try {
          await router.push('/mainHome')
        } catch (fallbackError) {
          console.error('기본 경로 이동 실패:', fallbackError)
        }
      } finally {
        isLoading.value = false
      }
    }, 500) // 500ms 지연
  } catch (err: any) {
    console.error('인증 처리 오류:', err)
    hasError.value = true
    errorMessage.value = err.message || '인증 처리 중 오류가 발생했습니다.'
    isLoading.value = false
  }
}

// 페이지 초기화
onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')

  if (code) {
    console.log('인증 코드 발견 - 인증 처리 시작')
    handleAuthentication()
  } else {
    console.log('인증 코드 없음 - 로그인 화면 표시')
  }
})

// 에러 상태 리셋 - 사용자가 에러 화면에서 다시 시도할 수 있게 함
const resetError = () => {
  hasError.value = false
  errorMessage.value = ''
}

// URL 변경 감지
watch(
  () => route.fullPath,
  () => {
    console.log('URL 변경 감지:', route.fullPath)
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')

    if (code && !isLoading.value) {
      console.log('URL에서 새 인증 코드 발견')
      handleAuthentication()
    }
  }
)
</script>

<template>
  <v-container class="login-container d-flex align-center justify-center" fluid>
    <!-- 로딩 표시 -->
    <v-card v-if="isLoading" max-width="400" class="loading-card pa-6" elevation="8">
      <v-card-text class="text-center">
        <v-progress-circular indeterminate color="#1483C2" size="60" width="6"></v-progress-circular>
        <p class="mt-6 text-body-1 font-weight-medium">로그인 처리 중입니다...</p>
        <p class="text-caption text-medium-emphasis mt-2">잠시만 기다려주세요</p>
      </v-card-text>
    </v-card>

    <!-- 에러 메시지 -->
    <v-card v-else-if="hasError" max-width="400" class="error-card pa-6" elevation="8">
      <v-card-title class="text-center text-h6 font-weight-bold">로그인 오류</v-card-title>
      <v-card-text class="text-center">
        <v-icon color="error" size="64" class="mb-4">mdi-alert-circle</v-icon>
        <p class="text-body-1">{{ errorMessage }}</p>
      </v-card-text>
      <v-card-actions class="justify-center">
        <v-btn color="#1483C2" variant="elevated" @click="resetError">다시 시도</v-btn>
      </v-card-actions>
    </v-card>

    <!-- 로그인 카드 -->
    <v-card v-else class="login-card mx-auto" elevation="8">
      <div class="login-content">
        <!-- 좌측 브랜딩 섹션 -->
        <div class="brand-section">
          <div class="brand-content">
            <h1 class="text-h4 font-weight-bold text-white mb-4">AI Tour</h1>
            <p class="text-subtitle-1 text-white mb-8">
              인공지능으로 더 스마트한<br>여행 경험을 만나보세요
            </p>
            <div class="brand-features">
              <div class="feature-item">
                <v-icon color="white" size="24">mdi-map-marker</v-icon>
                <span>맞춤형 여행 코스</span>
              </div>
              <div class="feature-item">
                <v-icon color="white" size="24">mdi-compass</v-icon>
                <span>AI 가이드</span>
              </div>
              <div class="feature-item">
                <v-icon color="white" size="24">mdi-account-group</v-icon>
                <span>여행자 커뮤니티</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 우측 로그인 섹션 -->
        <div class="login-section">
          <div class="login-section-content">
            <div class="text-center mb-8">
              <h2 class="text-h5 font-weight-bold mb-2">환영합니다</h2>
              <p class="text-subtitle-2 text-medium-emphasis">
                Google 계정으로 간편하게 로그인하세요
              </p>
            </div>

            <v-btn
              block
              color="#1483C2"
              variant="elevated"
              height="54"
              class="text-none google-btn"
              @click="signInWithGoogle"
              :loading="isLoading"
            >
              <v-icon start class="mr-2">mdi-google</v-icon>
              Google 계정으로 계속하기
            </v-btn>

            <div class="text-center mt-8">
              <p class="text-caption text-medium-emphasis">
                로그인 시 <a href="#" class="text-decoration-none" style="color: #1483C2">서비스 약관</a> 및
                <a href="#" class="text-decoration-none" style="color: #1483C2">개인정보 처리방침</a>에 동의하게 됩니다
              </p>
            </div>
          </div>
        </div>
      </div>
    </v-card>
  </v-container>
</template>

<style scoped>
/* 로그인 컨테이너 기본 스타일 */
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #e8f4fc 0%, #c7e5f7 100%);
}

/* 로딩 카드 */
.loading-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
}

/* 에러 카드 */
.error-card {
  background: white;
  border-radius: 16px;
}

/* 로그인 카드 */
.login-card {
  border-radius: 16px;
  overflow: hidden;
  width: 100%;
  max-width: 900px;
  min-height: 500px;
}

.login-content {
  display: flex;
  flex-direction: row;
  min-height: 500px;
}

/* 브랜딩 섹션 */
.brand-section {
  flex: 1;
  background: linear-gradient(135deg, #1483C2 0%, #0a5e8c 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
}

.brand-content {
  max-width: 320px;
}

.brand-features {
  margin-top: 32px;
}

.feature-item {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.feature-item span {
  margin-left: 12px;
  color: rgba(255, 255, 255, 0.9);
}

/* 로그인 섹션 */
.login-section {
  flex: 1;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
}

.login-section-content {
  width: 100%;
  max-width: 320px;
}

.google-btn {
  letter-spacing: 0.25px;
  text-transform: none;
  font-weight: 500;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* 반응형 스타일 */
@media (max-width: 768px) {
  .login-content {
    flex-direction: column;
  }

  .brand-section {
    padding: 32px;
    min-height: 240px;
  }

  .login-section {
    padding: 32px;
  }

  .login-card {
    margin: 16px;
  }
}
</style>