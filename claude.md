# AITour Claude 사용 가이드

## 프로젝트 개요
AITour는 여행 일정 생성 AI, 지도 목적지 길 생성, 여행 버킷리스트 관리 등의 기능을 제공하는 여행 서비스 앱입니다. 웹과 웹앱(모바일)을 모두 지원하며, 웹 버전에서는 일부 기능이 제한됩니다.

## 기술 스택
- Vue 3 (Composition API - `<script setup>` 사용)
- TypeScript
- Vuetify 3 (UI 프레임워크)
- Pinia (상태 관리)
- Vue Router
- AWS Amplify (인증 및 백엔드)
- AWS Bedrock (AI 서비스)
- Vite (빌드 도구)

## 코드 작성 규칙

### 1. 기본 원칙
- 모든 코드는 TypeScript로 작성
- Composition API와 `<script setup>` 문법 사용
- 한국어로 응답
- 오류 없는 정확한 코드 작성
- 기능별 주요 동작에 대한 주석 추가 (과도한 주석은 지양)

### 2. 컴포넌트 구조
```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStore } from '@/stores'
import type { TourSchedule } from '@/types'

// props/emits 정의
const props = defineProps<{
  scheduleId: string
}>()

const emit = defineEmits<{
  (e: 'update', value: TourSchedule): void
}>()

// 데이터 및 로직
const store = useStore()
const schedule = ref<TourSchedule | null>(null)

// 주요 기능별 함수
const updateSchedule = async () => {
  // 일정 업데이트 로직
}
</script>

<template>
  <v-container>
    <!-- UI 마크업 -->
  </v-container>
</template>

<style scoped lang="scss">
/* 컴포넌트 스타일 */
</style>
```

### 3. TypeScript 설정
- `strict` 모드 활성화
- `@/*` 경로 별칭 사용
- Vuetify 컴포넌트/디렉티브 타입 포함

### 4. 주요 디렉토리 구조
```
src/
  ├── assets/        # 정적 파일
  ├── components/    # 재사용 컴포넌트
  ├── composables/   # 컴포저블 함수
  ├── router/        # 라우터 설정
  ├── stores/        # Pinia 스토어
  ├── types/         # 타입 정의
  └── views/         # 페이지 컴포넌트
```

## 기능별 주의사항

### 1. AI 여행 일정 생성
- AWS Bedrock 클라이언트 사용
- 응답 형식 및 에러 처리 철저히
- 사용자 피드백을 위한 로딩 상태 표시

### 2. 지도 기능
- vue3-google-map 라이브러리 사용
- 경로 렌더링 최적화
- 마커 클러스터링 고려

### 3. 버킷리스트 관리
- 드래그 앤 드롭 기능(vuedraggable) 적절히 활용
- 로컬 스토리지 활용 시 pinia-plugin-persistedstate 사용

### 4. 인증
- AWS Amplify 인증 사용
- 토큰 관리 및 리프레시 로직 구현

## 성능 고려사항
1. 이미지 최적화 (heic2any 활용)
2. 컴포넌트 지연 로딩 (동적 import)
3. 컴포저블 함수 활용으로 코드 재사용성 향상
4. VueUse 라이브러리 적극 활용

## API 통신
```typescript
// axios 인스턴스 예시
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000
})

api.interceptors.request.use(config => {
  const authStore = useAuthStore()
  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`
  }
  return config
})
```

## 웹앱 고려사항
1. 반응형 디자인 필수
2. 터치 이벤트 지원
3. 오프라인 대응 로직
4. 모바일 디바이스 성능 최적화

## 웹 기능 제한사항
- 위치 기반 서비스 제한
- 카메라 접근 제한
- 푸시 알림 미지원
- 일부 결제 기능 제한

## 코드 예시

### AI 여행 일정 생성 컴포넌트
```typescript
<script setup lang="ts">
import { ref } from 'vue'
import { useTravelAI } from '@/composables/useTravelAI'
import type { TravelPlan } from '@/types'

const { generateSchedule, loading } = useTravelAI()
const destination = ref('')
const duration = ref(3)

const handleGenerate = async () => {
  try {
    const plan = await generateSchedule(destination.value, duration.value)
    // 생성된 일정 처리
  } catch (error) {
    console.error('일정 생성 실패:', error)
  }
}
</script>
```

## 주의사항
1. AWS Amplify 설정 시 환경변수 관리 철저
2. TypeScript 타입 정의 필수
3. 에러 처리 및 사용자 피드백 구현
4. 웹/앱 기능 분기 처리 필요

## 품질 관리
- ESLint 및 Prettier 설정 준수
- TypeScript strict 모드 준수
- 컴포넌트 재사용성 고려
- 성능 최적화 지속적 수행