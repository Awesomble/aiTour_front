<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useOpenAI, StreamEventType } from './useOpenAI'
import CustomBottomSheet from './BottomSheetData.vue'
import RouteList from '@/components/route/RouteList.vue'
import { usePromptStore } from '@/store'

import DATA from '@/assets/json/place.json'
import { useRouter } from 'vue-router'

defineOptions({
  name: 'tour-planner'
})

const router = useRouter()
const promptStore = usePromptStore()
// DOM 참조c
const bottomSheetRef = ref(null)

// 활성 이벤트 소스 추적
const activeEventSource = ref<EventSource | null>(null)

// 이벤트 관련 상태
const isGenerating = ref(false)

// OpenAI composable 초기화
const {
  isLoading,
  streamData,
  sendMessage,
  on
} = useOpenAI()

// 이벤트 리스너 정리 함수
const cleanupFns: Array<() => void> = []

// 이벤트 리스너 등록
onMounted(() => {
  // 스트림 시작 이벤트
  cleanupFns.push(on('start', () => {
    isGenerating.value = true
    console.log('여행 계획 생성 시작')
  }))

  // 새 데이터 추가 이벤트
  cleanupFns.push(on('data', ((event: Event) => {
    const customEvent = event as CustomEvent
    const newPlace = customEvent.detail
    console.log('새로운 장소 추가:')
    console.log(`copy(${JSON.stringify(newPlace)})`) // 크롬 콘솔에서 클릭 가능
  }) as EventListener))

  // 스트림 완료 이벤트
  cleanupFns.push(on('end', () => {
    isGenerating.value = false
    console.log('여행 계획 생성 완료')
    console.log(`copy(${JSON.stringify(streamData?.jsonData)})`) // 크롬 콘솔에서 클릭 가능
  }))

  // 오류 이벤트
  cleanupFns.push(on('error', ((event: Event) => {
    const customEvent = event as CustomEvent
    console.error('오류 발생:', customEvent.detail)
  }) as EventListener))
})

// 메시지 전송 핸들러
const handleSendMessage = async (data: any) => {
  // 이미 로딩 중이면 중복 요청 방지
  if (isLoading.value) return

  // 기존 이벤트 소스 정리
  if (activeEventSource.value) {
    activeEventSource.value.close()
    activeEventSource.value = null
  }

  // 프롬프트 생성 및 전송
  const message = createPrompt(data)
  activeEventSource.value = await sendMessage(message)
}

// AI 프롬프트 생성 함수
const createPrompt = (data: any): string => {
  const { adults, children, infants, amount, prompt, range } = data
  const [startDate, endDate] = range.split(' - ')
  promptStore.setPrompt(adults, children, infants, amount, startDate, endDate, prompt)
  return `
  여행인원: 성인 ${adults}명, 아동 ${children}명, 유아 ${infants}명
  예산: $${amount}
  기간: ${startDate}부터 ${endDate}까지
  조건: ${prompt}`
}

// Map이동
const showMapCall = () => {
  router.push({ name: '', query: {}})
}

// 컴포넌트 언마운트 시 정리
onUnmounted(() => {
  // 이벤트 리스너 정리
  cleanupFns.forEach(cleanup => cleanup())

  // 활성 이벤트 소스 정리
  if (activeEventSource.value) {
    activeEventSource.value.close()
    activeEventSource.value = null
  }
})
</script>

<template>
  <v-container class="splash-container pa-0 ma-0" fluid>
    <!-- 결과 표시 영역 -->
<!--    <template v-if="streamData.jsonData?.length">-->
    <div v-if="DATA?.length" class="pt-16">
      <RouteList :places="DATA" />
    </div>

    <!-- 초기 화면 -->
    <template v-else>
      <v-img
        src="@/assets/images/venice.jpg"
        :aspect-ratio="9 / 16"
        cover
        height="100vh"
        class="splash-image"
      >
        <v-overlay class="overlay" contained absolute opacity="0.2" color="#38A1AD"></v-overlay>

        <div class="splash-content d-flex flex-column justify-space-between">
          <!-- 상단 타이틀 영역 -->
          <div class="text-section px-6 pt-16">
            <h1 class="text-white text-h3 font-weight-bold mb-3">
              Create your trip<br />
              with AI magic.
            </h1>
            <p class="text-white text-subtitle-1 mt-2 subtitle-text">
              Automatically generate perfect travel itineraries with AI.<br />
              Start your journey in Seoul and explore beyond.
            </p>
          </div>

          <!-- 하단 버튼 영역 -->
          <div class="button-container">
            <v-btn
              block
              rounded="pill"
              size="x-large"
              color="primary"
              elevation="1"
              @click="bottomSheetRef?.open()"
            >
              Let's Go
            </v-btn>
          </div>
        </div>
      </v-img>
    </template>

    <!-- 바텀 시트 컴포넌트 -->
    <CustomBottomSheet ref="bottomSheetRef" @create="handleSendMessage" />

    <!-- 로딩 오버레이 -->
    <v-overlay
      v-if="isLoading"
      :model-value="isLoading"
      class="align-center justify-center"
      persistent
    >
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </v-overlay>
    <v-btn
      class="text-none"
      color="medium-emphasis"
      min-width="92"
      variant="outlined"
      rounded
      @click="showMapCall"
    >
      Close
    </v-btn>
  </v-container>
</template>

<style scoped lang="scss">
.button-container {
  position: relative;
  bottom: calc(60px + var(--nav-bar-height));
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
  .v-btn {
    margin-left: 0;
    backdrop-filter: blur(5px);
    opacity: 0.9;
  }
}

.splash-container {
  position: relative;
  height: 100vh;
  width: 100%;
  overflow: hidden;
}

.splash-image {
  width: 100%;
  height: 100%;
}

.splash-content {
  position: relative;
  height: 100%;
  z-index: 2;
}

.text-section {
  margin-top: 20px;
}

.subtitle-text {
  line-height: 1.5;
  opacity: 0.9;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
</style>