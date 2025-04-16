<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPlacesDetailAPI } from '@/network/app'
import { useGlobalStore, useMapStore } from '@/store'
import PlaceHeader from '@/components/place/PlaceHeader.vue'
import PlacePhotos from '@/components/place/PlacePhotos.vue'
import InfoPanel from '@/components/place/InfoPanel.vue'
import ChatPanel from '@/components/place/ChatPanel.vue'
import { formatDistance } from '@/plugins/utils'
import { Navigation } from 'lucide-vue-next'

// --- Props & Emits ---
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits(['update:modelValue'])

// --- 기본 상태 ---
const route = useRoute()
const router = useRouter()
const dialog = ref(false)
const detail = ref<any>(null)
const loading = ref(true)
const containerRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)
const globalStore = useGlobalStore()
const mapStore = useMapStore()

// --- 높이 상태 관리 ---
const MIN_HEIGHT = 150
const MID_HEIGHT = 300
const MAX_HEIGHT = window.innerHeight - 50
const currentHeight = ref(MIN_HEIGHT)
const CLOSE_DRAG_THRESHOLD = 50
const MIN_DRAG_VISUAL_LIMIT = 60

// --- 채팅 팝업 상태 ---
const showChatPopup = ref(false)

// --- 드래그 상태 관리 (터치 전용) ---
const isDragging = ref(false) // 팝업 자체를 드래그 중인지
const startY = ref(0)
const startHeight = ref(0)
const rawDragDelta = ref(0) // 드래그 시작점 기준 Y 이동 거리 (양수: 위로, 음수: 아래로)
const isClosingDrag = ref(false) // 최소 높이에서 아래로 드래그하여 닫는 동작 중인지
const isScrollingContent = ref(false) // 사용자가 내부 콘텐츠를 스크롤하고 있는지 여부
const interactionTarget = ref<EventTarget | null>(null) // 상호작용 시작 대상 저장

// --- Computed 속성 ---
const heightState = computed(() => {
  if (currentHeight.value <= (MIN_HEIGHT + MID_HEIGHT) / 2) return 'min'
  if (currentHeight.value <= (MID_HEIGHT + MAX_HEIGHT) / 2) return 'mid'
  return 'max'
})

const isMaxHeight = computed(() => heightState.value === 'max')
const isScrollable = computed(() => isMaxHeight.value) // 최대 높이일 때만 스크롤 가능

// --- 내부 함수 ---
const isAtTopScroll = () => {
  if (!contentRef.value) return true
  return contentRef.value.scrollTop < 1
}

const hasScrollableContent = () => {
  if (!contentRef.value || contentRef.value.clientHeight === 0) return false
  return contentRef.value.scrollHeight > contentRef.value.clientHeight
}

const getPlaceDetail = async () => {
  const placeId: string = route.query.place as string
  if (!placeId) return

  try {
    loading.value = true
    const res = await getPlacesDetailAPI(placeId, globalStore.lat, globalStore.lng)
    if (res.status === 200) {
      detail.value = res.data
    }
  } catch (error) {
    console.error('장소 상세 정보 가져오기 오류:', error)
  } finally {
    loading.value = false
  }
}

// --- 터치 상호작용 관련 함수 ---

// 터치 시작 핸들러 (모든 영역 공통)
const handleTouchStart = (e: TouchEvent) => {
  if (isScrollingContent.value) return // 스크롤 중이면 새 터치 시작 무시

  interactionTarget.value = e.target // 터치 시작 대상 저장
  const touch = e.touches[0]
  startY.value = touch.clientY

  isDragging.value = true // 드래그 '시작' 상태로 간주
  isScrollingContent.value = false
  isClosingDrag.value = false
  startHeight.value = currentHeight.value
  rawDragDelta.value = 0

  if (containerRef.value) {
    containerRef.value.style.transition = 'none' // 애니메이션 비활성화
    containerRef.value.style.transform = ''
  }

  // document 레벨에 터치 이동/종료 리스너 추가
  document.addEventListener('touchmove', handleTouchMove, { passive: false }) // preventDefault 위해 passive: false
  document.addEventListener('touchend', handleTouchEnd)
  document.addEventListener('touchcancel', handleTouchEnd) // 터치 취소 시에도 종료 처리
}

// 터치 이동 핸들러
const handleTouchMove = (e: TouchEvent) => {
  if (!isDragging.value) return // 드래그 시작 상태가 아니면 무시

  const touch = e.touches[0]
  const clientY = touch.clientY
  const currentRawDelta = startY.value - clientY // 양수: 위로, 음수: 아래로
  rawDragDelta.value = currentRawDelta

  // --- 스크롤 / 드래그 결정 로직 ---
  let preventDefault = true // 기본적으로 브라우저 기본 동작(스크롤 등) 방지

  // 조건 1: 팝업이 최대 높이가 아닌 경우 (Rule #1)
  if (!isMaxHeight.value) {
    preventDefault = true
    isScrollingContent.value = false
  }
  // 조건 2: 팝업이 최대 높이인 경우
  else {
    const canScroll = hasScrollableContent()
    const atTop = isAtTopScroll()
    const isDraggingDown = currentRawDelta < 0
    const isContentInteraction = contentRef.value?.contains(interactionTarget.value as Node)

    // 조건 2-A: 스크롤 가능 & 콘텐츠 내부 터치 & (맨 위 아님 또는 맨 위에서 위로 스크롤 시도) (Rule #2)
    if (canScroll && isContentInteraction && (!atTop || (atTop && !isDraggingDown))) {
      preventDefault = false // 브라우저 스크롤 허용
      isDragging.value = false // 팝업 드래그 상태 해제
      isScrollingContent.value = true // 스크롤 상태 설정
    }
    // 조건 2-B: 그 외 모든 경우 (최대 높이 + 스크롤 불가 / 최대 높이 + 맨 위 + 아래로 드래그 등) (Rule #3 포함)
    else {
      preventDefault = true // 팝업 드래그로 처리, 스크롤 방지
      isScrollingContent.value = false
    }
  }

  // 결정된 preventDefault 적용
  if (preventDefault) {
    e.preventDefault()
  }

  // 스크롤 상태로 결정되었으면, 아래 팝업 드래그 로직 실행 안 함
  if (isScrollingContent.value) {
    return
  }

  // --- (팝업 드래그로 결정된 경우) 팝업 이동 로직 실행 ---
  if (containerRef.value) {
    // Case 1: 최소 높이에서 아래로 드래그 (닫기 제스처)
    if (startHeight.value === MIN_HEIGHT && currentRawDelta < 0) {
      isClosingDrag.value = true
      const visualTranslateY = Math.min(-currentRawDelta, MIN_DRAG_VISUAL_LIMIT)
      const opacity = 1 - (visualTranslateY / MIN_DRAG_VISUAL_LIMIT) * 0.9
      containerRef.value.style.height = `${MIN_HEIGHT}px`
      containerRef.value.style.setProperty(
        'transform',
        `translateY(${visualTranslateY}px)`,
        'important'
      )
      containerRef.value.style.opacity = opacity.toString()
    }
    // Case 2: 일반적인 높이 조절 드래그
    else {
      isClosingDrag.value = false
      const newHeight = Math.max(
        MIN_HEIGHT,
        Math.min(MAX_HEIGHT, startHeight.value + currentRawDelta)
      )
      containerRef.value.style.height = `${newHeight}px`
      // 드래그 중 transform/opacity 초기화 (닫기 드래그 취소 시 복구)
      if (containerRef.value.style.transform !== 'translateY(0px)') {
        containerRef.value.style.transform = 'translateY(0)'
      }
      if (containerRef.value.style.opacity !== '1') {
        containerRef.value.style.opacity = '1'
      }
    }
  }
}

// 터치 종료 핸들러
const handleTouchEnd = () => {
  // 리스너 즉시 제거
  document.removeEventListener('touchmove', handleTouchMove)
  document.removeEventListener('touchend', handleTouchEnd)
  document.removeEventListener('touchcancel', handleTouchEnd)

  if (!containerRef.value) return

  // 트랜지션 복원
  containerRef.value.style.transition =
    'height 0.2s ease-out, transform 0.2s ease-out, opacity 0.2s ease-out'

  // Case 1: 팝업 드래그 중 종료된 경우
  if (isDragging.value) {
    const dragDelta = rawDragDelta.value
    const STEP_DRAG_THRESHOLD = 30

    // Subcase 1.1: 최소 높이에서 닫기 드래그 시도 후 종료
    if (startHeight.value === MIN_HEIGHT && isClosingDrag.value) {
      if (dragDelta < -CLOSE_DRAG_THRESHOLD) {
        containerRef.value.style.transform = 'translateY(100%)'
        containerRef.value.style.opacity = '0'
        setTimeout(closePopup, 200)
      } else {
        containerRef.value.style.transform = 'translateY(0)'
        containerRef.value.style.height = `${MIN_HEIGHT}px`
        containerRef.value.style.opacity = '1'
        currentHeight.value = MIN_HEIGHT
      }
    }
    // Subcase 1.2: 일반 높이 조절 드래그 후 종료 (스텝 스냅)
    else {
      const steps = [MIN_HEIGHT, MID_HEIGHT, MAX_HEIGHT]
      const startIndex = steps.reduce((closestIndex, step, index) => {
        return Math.abs(step - startHeight.value) <
          Math.abs(steps[closestIndex] - startHeight.value)
          ? index
          : closestIndex
      }, 0)

      let targetIndex = startIndex
      if (dragDelta > STEP_DRAG_THRESHOLD && startIndex < steps.length - 1) {
        targetIndex = startIndex + 1
      } else if (dragDelta < -STEP_DRAG_THRESHOLD && startIndex > 0) {
        targetIndex = startIndex - 1
      }

      const targetHeight = steps[targetIndex]
      currentHeight.value = targetHeight
      containerRef.value.style.height = `${targetHeight}px`
      containerRef.value.style.transform = 'translateY(0)'
      containerRef.value.style.opacity = '1'
    }
  }
  // Case 2: 콘텐츠 스크롤 중 터치 종료된 경우
  else if (isScrollingContent.value) {
    // 상태 원복 확인
    if (containerRef.value.style.transform !== 'translateY(0px)') {
      containerRef.value.style.transform = 'translateY(0)'
    }
    if (containerRef.value.style.opacity !== '1') {
      containerRef.value.style.opacity = '1'
    }
    containerRef.value.style.height = `${currentHeight.value}px`
  }
  // Case 3: 드래그도 스크롤도 아닌 상태 (짧은 탭 등)
  else {
    // 상태 원복 확인
    if (containerRef.value.style.transform !== 'translateY(0px)') {
      containerRef.value.style.transform = 'translateY(0)'
    }
    if (containerRef.value.style.opacity !== '1') {
      containerRef.value.style.opacity = '1'
    }
    containerRef.value.style.height = `${currentHeight.value}px`
  }

  // --- 상태 초기화 (공통) ---
  isDragging.value = false
  isScrollingContent.value = false
  isClosingDrag.value = false
  rawDragDelta.value = 0
  interactionTarget.value = null
}

// --- 기타 UI 상호작용 함수 --- (이전과 동일)
const toggleChatPopup = () => {
  showChatPopup.value = !showChatPopup.value
  if (showChatPopup.value && heightState.value === 'min') {
    const targetHeight = MID_HEIGHT
    currentHeight.value = targetHeight
    if (containerRef.value) {
      containerRef.value.style.transition = 'height 0.2s ease-out'
      containerRef.value.style.height = `${targetHeight}px`
    }
  }
}

const handleChatHeightChange = (chatHeight: number) => {
  const requiredParentHeight = chatHeight + 120
  if (requiredParentHeight > currentHeight.value) {
    const newHeight = Math.min(MAX_HEIGHT, requiredParentHeight)
    if (newHeight > currentHeight.value) {
      currentHeight.value = newHeight
      if (containerRef.value) {
        containerRef.value.style.transition = 'height 0.2s ease-out'
        containerRef.value.style.height = `${currentHeight.value}px`
      }
    }
  }
}

const closePopup = () => {
  dialog.value = false
  showChatPopup.value = false
  const query = { ...route.query }
  delete query.place
  router.replace({
    path: route.path,
    query: query
  })
}
const findDirectionsCall = async () => {
  try {
    // 목적지 정보가 없으면 중단
    if (!detail.value) return

    // 현재 페이지가 지도 페이지가 아니면 먼저 이동
    if (route.name !== 'main-map') {
      await router.push({ name: 'main-map' })
    }
    // 현재 위치에서 목적지까지 경로 설정
    const { lat: startLat, lng: startLng } = globalStore
    const { latitude: endLat, longitude: endLng } = detail.value

    mapStore.setDirections(startLat, startLng, endLat, endLng)
  } catch (error) {
    console.error('경로 탐색 오류:', error)
  }
}

// --- Watchers --- (이전과 거의 동일, 마우스 관련 로직 없음)
watch(
  () => route.query.place,
  async (newPlaceId, oldPlaceId) => {
    if (newPlaceId && !oldPlaceId) {
      // 팝업 열기
      loading.value = true
      await nextTick()
      await getPlaceDetail()
      dialog.value = true
      await nextTick()
      if (containerRef.value) {
        // 초기 상태 설정
        containerRef.value.style.transition = 'none'
        currentHeight.value = MIN_HEIGHT
        containerRef.value.style.height = `${MIN_HEIGHT}px`
        containerRef.value.style.transform = 'translateY(0)'
        containerRef.value.style.opacity = '1'

        void containerRef.value.offsetHeight // 리플로우 강제

        requestAnimationFrame(() => {
          // 다음 프레임에서 애니메이션 시작
          if (containerRef.value) {
            containerRef.value.classList.add('popup-enter-active')
            containerRef.value.style.transition =
              'height 0.2s ease-out, transform 0.2s ease-out, opacity 0.2s ease-out'
          }
        })
      }
    } else if (!newPlaceId && oldPlaceId) {
      // 팝업 닫기 (애니메이션 후 상태 변경은 closePopup 에서 처리)
      if (containerRef.value) {
        containerRef.value.style.transform = 'translateY(100%)'
        containerRef.value.style.opacity = '0'
        // closePopup 호출은 watch(dialog) 등 다른 곳에서 트리거될 수 있음
      } else {
        dialog.value = false // 즉시 닫기
      }
      showChatPopup.value = false
    }
  },
  { immediate: true }
)

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal !== dialog.value) {
      const query = { ...route.query }
      if (newVal && !query.place) {
        console.warn('PlacePopup opened via v-model without placeId in route query.')
      } else if (!newVal && query.place) {
        closePopup() // 외부에서 닫기 요청 시 closePopup 호출
      } else {
        dialog.value = newVal
      }
    }
  }
)

watch(dialog, (newVal) => {
  emit('update:modelValue', newVal)
  if (!newVal) {
    // 팝업 닫힐 때 상태 초기화
    isDragging.value = false
    isScrollingContent.value = false
    isClosingDrag.value = false
  }
})

watch(heightState, (newState, oldState) => {
  if (newState === 'min' && showChatPopup.value) {
    showChatPopup.value = false
  }
  if (newState !== 'max' && oldState === 'max' && isScrollingContent.value) {
    isScrollingContent.value = false // 최대 높이 해제 시 스크롤 상태 강제 해제
  }
})

// --- Lifecycle Hooks ---
onMounted(() => {
  // 초기화
})

onBeforeUnmount(() => {
  // 언마운트 시 리스너 확실히 제거
  document.removeEventListener('touchmove', handleTouchMove)
  document.removeEventListener('touchend', handleTouchEnd)
  document.removeEventListener('touchcancel', handleTouchEnd)
})
</script>

<template>
  <div v-if="dialog" class="popup-overlay">
    <div
      ref="containerRef"
      class="popup-container"
      :style="{ height: `${currentHeight}px` }"
      @touchstart="handleTouchStart"
    >
      <div class="drag-handle">
        <div class="drag-indicator"></div>
      </div>

      <v-btn
        v-if="globalStore.useGPS"
        color="primary"
        icon
        @click.stop="findDirectionsCall"
        @touchstart.stop
        class="btn-navigation"
        variant="elevated"
        aria-label="길찾기"
      >
        <Navigation />
        <span v-if="detail?.distance_meters > 0" class="distance-badge text-overline">{{
          formatDistance(detail.distance_meters)
        }}</span>
      </v-btn>

      <PlaceHeader :loading="loading" :detail="detail" style="user-select: none; cursor: grab" />

      <div ref="contentRef" class="popup-content" :class="{ 'allow-scroll': isScrollable }">
        <PlacePhotos
          v-if="detail?.photos?.length"
          :loading="loading"
          :photos="detail?.photos"
          :isMaxHeight="isMaxHeight"
          class="place-photos"
        />

        <div class="tab-navigation">
          <div class="tab active"><span class="tab-text">개요</span></div>
          <div class="tab"><span class="tab-text">메뉴</span></div>
          <div class="tab"><span class="tab-text">리뷰</span></div>
          <div class="tab"><span class="tab-text">사진</span></div>
          <div class="tab"><span class="tab-text">업데이트</span></div>
          <div class="tab"><span class="tab-text">정보</span></div>
        </div>

        <InfoPanel :loading="loading" :detail="detail" @showchatpop.stop="toggleChatPopup" />

        <ChatPanel
          :loading="loading"
          :detail="detail"
          :showChatPopup="showChatPopup"
          :parentHeightState="heightState"
          :parentHeight="currentHeight"
          @update:showChatPopup="showChatPopup = $event"
          @chat-height-change="handleChatHeightChange"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* SCSS 스타일은 이전과 동일하게 유지 (마우스/휠 관련 스타일 불필요) */
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  pointer-events: none;
}

.popup-container {
  position: relative;
  background-color: white;
  border-radius: 16px 16px 0 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 100%;
  will-change: height, transform, opacity;
  pointer-events: auto;
  border-top: 1px solid #eee;
  box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.12);
  overscroll-behavior-y: contain;
  touch-action: none; /* 중요: 컨테이너 레벨 기본 터치 액션 방지 */

  transform: translateY(100%);
  opacity: 1;

  &.popup-enter-active {
    animation: slideUp 0.3s ease-out forwards;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.drag-handle {
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab; /* 시각적 힌트 */
  user-select: none;
  z-index: 10;
  flex-shrink: 0;
}

.drag-indicator {
  width: 40px;
  height: 5px;
  background-color: #d0d0d0;
  border-radius: 3px;
}

.btn-navigation {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 15;
  .distance-badge {
    position: absolute;
    top: 53px;
    left: 50%;
    transform: translateX(-50%);
    padding: 3px 6px;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    border-radius: 10px;
    line-height: normal;
    font-size: 10px;
    white-space: nowrap;
  }
}

.popup-content {
  flex: 1;
  position: relative;
  overflow-y: hidden;
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  &.allow-scroll {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y; /* 세로 스크롤 허용 */
  }

  & > * {
    /* 내부 요소들은 기본 터치 액션 허용 */
    pointer-events: auto;
    touch-action: auto;
  }
}

.tab-navigation {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  width: 100%;
  overflow-x: auto;
  background-color: white;
  border-bottom: 1px solid #f0f0f0;
  white-space: nowrap;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
  flex-shrink: 0;
}

.tab {
  min-width: 60px;
  padding: 12px 16px;
  text-align: center;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition:
    color 0.2s,
    border-bottom-color 0.2s;
  border-bottom: 2px solid transparent;
  &:hover {
    color: #333;
  } /* 모바일에서는 hover 의미 없지만 유지 */
}

.tab.active {
  color: #00796b;
  font-weight: 600;
  border-bottom-color: #00796b;
}

.place-photos :deep(img) {
  cursor: pointer !important; /* 시각적 힌트 */
}
</style>
