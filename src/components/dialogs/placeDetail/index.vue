<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPlacesDetailAPI } from '@/network/app'
import { useGlobalStore, useMapStore } from '@/store'
import PlaceHeader from '@/components/dialogs/placeDetail/PlaceHeader.vue'
import PlacePhotos from '@/components/dialogs/placeDetail/PlacePhotos.vue'
import InfoPanel from '@/components/dialogs/placeDetail/InfoPanel.vue'
import ChatBox from '@/components/dialogs/placeDetail/ChatBox.vue'
import { formatDistance } from '@/plugins/utils'
import { Navigation, Maximize2, MessageSquare } from 'lucide-vue-next'
import BottomSheet from '@douxcode/vue-spring-bottom-sheet'
import '@douxcode/vue-spring-bottom-sheet/dist/style.css'

// --- Props & Emits ---
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits(['update:modelValue'])

// --- 기본 상태 변수들 ---
const route = useRoute()
const router = useRouter()
const isOpen = ref(false)
const detail = ref(null)
const loading = ref(true)
const contentRef = ref(null)
const globalStore = useGlobalStore()
const mapStore = useMapStore()
const newMessage = ref('')
const chatInputEnabled = ref(false)

// --- 바텀시트 높이 설정 ---
const MIN_HEIGHT = 150
const MID_HEIGHT = 300
const MAX_HEIGHT = window.innerHeight - 50

// --- 바텀시트 제어 상태 ---
const snapPoints = [MIN_HEIGHT, MID_HEIGHT, MAX_HEIGHT]
const currentSnapIndex = ref(0)

// --- 탭 관리 ---
const activeTab = ref('overview') // 기본 탭은 '개요'
const tabs = [
  { id: 'overview', label: '개요' },
  { id: 'menu', label: '메뉴' },
  { id: 'reviews', label: '리뷰' },
  { id: 'photos', label: '사진' },
  { id: 'chat', label: '채팅' }
]

// --- 채팅 상태 ---
const participantCount = ref(0)
const isChatMaximized = ref(false)

// --- Computed 속성 ---
const heightState = computed(() => {
  if (currentSnapIndex.value === 0) return 'min'
  if (currentSnapIndex.value === 1) return 'mid'
  return 'max'
})

const isMaxHeight = computed(() => heightState.value === 'max')
const isScrollable = computed(() => isMaxHeight.value)

// 현재 바텀시트 높이 계산 (px 단위)
const currentSheetHeight = computed(() => snapPoints[currentSnapIndex.value])

// 채팅 탭 높이 계산 (px 단위)
const chatTabHeight = computed(() => {
  // 상수값 줄이고 여유 공간 추가
  const headerOffset = 40 // PlaceHeader 높이 (여유 공간 포함)
  const chatHeaderHeight = 45 // 채팅헤더 높이
  const inputAreaHeight = 56 // 입력창 높이
  const safetyMargin = 10 // 추가 여유 공간

  if (isChatMaximized.value) {
    // 최대화 상태: 바텀시트 높이에서 필요한 공간만 차감
    return `calc(${currentSheetHeight.value}px - ${headerOffset + chatHeaderHeight + inputAreaHeight + safetyMargin}px)`
  } else {
    // 비최대화 상태: 화면 높이의 50%로 증가 (최소 350px)
    const windowHeight = window.innerHeight
    const defaultHeight = Math.max(350, windowHeight * 0.5)
    return `${defaultHeight}px`
  }
})

// 입력창 표시 여부
const showInputBox = computed(() => {
  return activeTab.value === 'chat' && heightState.value !== 'min'
})

// --- 내부 함수들 ---
// 장소 상세 정보 조회 API 호출
const getPlaceDetail = async () => {
  const placeId = route.query.place
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

// 탭 변경 핸들러
const changeTab = (tabId) => {
  activeTab.value = tabId

  // 채팅 탭으로 이동할 때 바텀시트가 작으면 크기 키우기
  if (tabId === 'chat' && currentSnapIndex.value === 0) {
    currentSnapIndex.value = 1 // 중간 높이로 확대
  }

  // 채팅 탭 이외의 탭 선택 시 최대화 상태 해제
  if (tabId !== 'chat') {
    isChatMaximized.value = false
  }
}

// 채팅으로 바로 이동 핸들러 (InfoPanel에서 호출됨)
const goToChatTab = () => {
  activeTab.value = 'chat'

  // 바텀시트가 작으면 확대
  if (currentSnapIndex.value === 0) {
    currentSnapIndex.value = 1
  }
}

// 참가자 수 업데이트
const updateParticipantCount = (count) => {
  participantCount.value = count
}

// 채팅 입력창 상태 업데이트
const updateChatInputState = (enabled) => {
  chatInputEnabled.value = enabled
}

// --- 최대화/최소화 버튼 클릭 핸들러
const toggleChatMaximize = () => {
  if (isChatMaximized.value) {
    // 최소화
    isChatMaximized.value = false
  } else {
    // 최대화 - 최대 높이로 바텀시트 설정
    currentSnapIndex.value = 2
    isChatMaximized.value = true

    // 변경 후 스크롤 위치 재조정
    nextTick(() => {
      const chatBoxElement = document.querySelector('.chat-container .chat-messages')
      if (chatBoxElement) {
        chatBoxElement.scrollTop = chatBoxElement.scrollHeight
      }
    })
  }
}

const chatBoxRef = ref(null)

// 메시지 전송 핸들러
const sendMessage = () => {
  if (activeTab.value !== 'chat' || !newMessage.value.trim()) return

  if (chatBoxRef.value && chatBoxRef.value.sendMessage) {
    chatBoxRef.value.sendMessage(newMessage.value.trim())
    newMessage.value = ''
  }
}

// 바텀시트 닫기
const closePopup = () => {
  isOpen.value = false

  // 쿼리 파라미터에서 place 제거
  const query = { ...route.query }
  delete query.place
  router.replace({
    path: route.path,
    query: query
  })
}

// 경로 찾기
const findDirectionsCall = async () => {
  try {
    if (!detail.value) return

    if (route.name !== 'main-map') {
      closePopup()
      await router.push({ name: 'main-map' })
    }

    const { lat: startLat, lng: startLng } = globalStore
    const { latitude: endLat, longitude: endLng } = detail.value

    mapStore.setDirections(startLat, startLng, endLat, endLng)
  } catch (error) {
    console.error('경로 탐색 오류:', error)
  }
}

// 스냅 인덱스 변경 핸들러
const handleSnapIndexChange = (index) => {
  currentSnapIndex.value = index
}

// --- Watchers ---
// 라우트 쿼리의 place 파라미터 변경 감지
watch(
  () => route.query.place,
  async (newPlaceId, oldPlaceId) => {
    if (newPlaceId && !oldPlaceId) {
      // 팝업 열기
      loading.value = true
      await nextTick()
      await getPlaceDetail()
      isOpen.value = true
      currentSnapIndex.value = 0
      activeTab.value = 'overview' // 팝업 열릴 때 항상 개요 탭으로
    } else if (!newPlaceId && oldPlaceId) {
      // 팝업 닫기
      isOpen.value = false
    }
  },
  { immediate: true }
)

// v-model 동기화
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal !== isOpen.value) {
      const query = { ...route.query }
      if (newVal && !query.place) {
        console.warn('PlacePopup opened via v-model without placeId in route query.')
      } else if (!newVal && query.place) {
        closePopup()
      } else {
        isOpen.value = newVal
      }
    }
  }
)

// isOpen 상태 변경 시 부모에게 알림
watch(isOpen, (newVal) => {
  emit('update:modelValue', newVal)

  if (!newVal) {
    currentSnapIndex.value = 0
    activeTab.value = 'overview'
    isChatMaximized.value = false // 바텀시트 닫힐 때 채팅 최대화 상태 초기화
  }
})
</script>

<template>
  <BottomSheet
    v-model="isOpen"
    v-model:snap-index="currentSnapIndex"
    :snap-points="snapPoints"
    :initial-snap="0"
    :blocking="false"
    @snap-index-change="handleSnapIndexChange"
    @close="closePopup"
    drag-bar-height="20px"
    scroller-class="bottom-sheet-scroller"
  >
    <!-- 드래그 핸들 -->
    <template #drag-bar>
      <div class="drag-indicator"></div>
    </template>

    <!-- 헤더 영역 -->
    <template #header>
      <PlaceHeader :loading="loading" :detail="detail" />

      <!-- 길찾기 버튼 -->
      <v-btn
        v-if="globalStore.useGPS"
        color="primary"
        icon
        @click.stop="findDirectionsCall"
        class="btn-navigation"
        variant="elevated"
        aria-label="길찾기"
      >
        <Navigation />
        <span v-if="detail?.distance_meters > 0" class="distance-badge text-overline">
          {{ formatDistance(detail.distance_meters) }}
        </span>
      </v-btn>
    </template>

    <!-- 내용 영역 -->
    <template #default>
      <div ref="contentRef" class="content-container" :class="{ 'chat-active': activeTab === 'chat' }">
        <!-- 사진 - 채팅 최대화 상태가 아닐 때만 -->
        <PlacePhotos
          v-if="detail?.photos?.length && !(activeTab === 'chat' && isChatMaximized)"
          :loading="loading"
          :photos="detail?.photos"
          :isMaxHeight="isMaxHeight"
          class="place-photos"
        />

        <!-- 탭 네비게이션 - 채팅 최대화 상태가 아닐 때만 -->
        <div v-if="!(activeTab === 'chat' && isChatMaximized)" class="tab-navigation">
          <div
            v-for="tab in tabs"
            :key="tab.id"
            class="tab"
            :class="{ 'active': activeTab === tab.id }"
            @click="changeTab(tab.id)"
          >
            <span class="tab-text">{{ tab.label }}</span>
            <!-- 채팅 탭에 참가자 수 표시 -->
            <span v-if="tab.id === 'chat' && participantCount > 0" class="tab-badge">
              {{ participantCount }}
            </span>
          </div>
        </div>

        <!-- 탭 컨텐츠 -->
        <div class="tab-content">
          <!-- 개요 탭 -->
          <div v-if="activeTab === 'overview'" class="tab-pane">
            <InfoPanel :loading="loading" :detail="detail" @showchatpop="goToChatTab" />
          </div>

          <!-- 채팅 탭 -->
          <div v-if="activeTab === 'chat'"
               class="tab-pane chat-tab"
               :class="{ 'maximized': isChatMaximized }">
            <!-- 채팅 헤더 -->
            <div class="chat-header">
              <div class="chat-title">
                <MessageSquare size="18" class="mr-2" />
                실시간 채팅
                <span v-if="participantCount > 0" class="participant-count">
                  {{ participantCount }}명 참여중
                </span>
              </div>

              <!-- 최대화/최소화 버튼 -->
              <v-btn
                icon
                size="small"
                variant="text"
                color="primary"
                @click="toggleChatMaximize"
                class="maximize-btn"
                :title="isChatMaximized ? '채팅 최소화' : '채팅 최대화'"
              >
                <template v-if="isChatMaximized">
                  <v-icon>mdi-arrow-collapse</v-icon>
                </template>
                <template v-else>
                  <Maximize2 size="18" />
                </template>
              </v-btn>
            </div>

            <!-- 채팅 컴포넌트 - 높이 계산된 값 적용 -->
            <ChatBox
              ref="chatBoxRef"
              :detail="detail"
              :loading="loading"
              :show-chat="activeTab === 'chat'"
              :height-state="heightState"
              :is-maximized="isChatMaximized"
              :chat-height="chatTabHeight"
              @update-participant-count="updateParticipantCount"
              @update-chat-input-state="updateChatInputState"
            />
          </div>

          <!-- 다른 탭들 (아직 구현되지 않음) -->
          <div v-else-if="activeTab !== 'overview'" class="tab-pane under-construction">
            <p>{{ activeTab }} 탭 준비 중입니다.</p>
          </div>
        </div>
      </div>
    </template>

    <!-- 채팅 입력창 (푸터 영역) - 채팅 탭일 때만 표시 -->
    <template #footer v-if="showInputBox">
      <div class="chat-input-area">
        <v-text-field
          v-model="newMessage"
          placeholder="메시지를 입력하세요..."
          variant="outlined"
          density="compact"
          hide-details
          :disabled="!chatInputEnabled"
          @keyup.enter="sendMessage"
          class="chat-input"
          autocomplete="off"
          :rules="[]"
          :counter="false"
        />

        <v-btn
          color="primary"
          :disabled="!chatInputEnabled"
          @click="sendMessage"
          class="send-btn"
          variant="flat"
        >
          전송
        </v-btn>
      </div>
    </template>
  </BottomSheet>
</template>

<style scoped lang="scss">
.drag-indicator {
  width: 40px;
  height: 5px;
  background-color: #d0d0d0;
  border-radius: 3px;
  margin: 0 auto;
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

.content-container {
  position: relative;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;

  &.chat-active {
    padding-bottom: 0; // 채팅 활성화 시 footer가 표시되어 패딩 제거
  }
}

// 사진 갤러리 스타일
.place-photos {
  width: 100%;
  overflow-x: auto;
  max-width: 100%;
}

// 탭 네비게이션 스타일
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
  transition: color 0.2s, border-bottom-color 0.2s;
  border-bottom: 2px solid transparent;
  position: relative;

  &:hover {
    color: #333;
  }

  &.active {
    color: #00796b;
    font-weight: 600;
    border-bottom-color: #00796b;
  }

  // 채팅 탭 뱃지
  .tab-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    background-color: #1483c2;
    color: white;
    font-size: 10px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

// 탭 컨텐츠 영역
.tab-content {
  min-height: 200px;
  width: 100%;
}

.tab-pane {
  padding: 0;
  width: 100%;
}

// 채팅 탭 스타일
.chat-tab {
  display: flex;
  flex-direction: column;

  &.maximized {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 10;
    background-color: white;
  }
}

// 채팅 헤더 스타일
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background-color: #f5f9ff;
  border-bottom: 1px solid #e0e0e0;
  height: 45px;
  flex-shrink: 0;
}

.chat-title {
  display: flex;
  align-items: center;
  font-size: 15px;
  font-weight: 600;
  color: #1483c2;
}

.participant-count {
  margin-left: 8px;
  font-size: 12px;
  color: #666;
  font-weight: normal;
  background-color: rgba(20, 131, 194, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
}

.maximize-btn {
  opacity: 0.7;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
}

.under-construction {
  padding: 32px 16px;
  text-align: center;
  color: #888;
}

// 채팅 입력창 (footer)
.chat-input-area {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: white;
  border-top: 1px solid #eee;
  height: 56px;
}

.chat-input {
  flex: 1;
}

.send-btn {
  margin-left: 8px;
  min-width: 60px;
}

// 바텀시트 스타일 오버라이드
:deep(.bottom-sheet-scroller) {
  padding: 0;
  max-width: 100%;
  overflow-x: hidden;
}

:deep(.vue-spring-bottom-sheet-container) {
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.12);
  border-top: 1px solid #eee;
  max-width: 100vw;
  overflow-x: hidden;
}
</style>