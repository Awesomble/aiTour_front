<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDraggable } from '@vueuse/core'
import { getPlacesDetailAPI } from '@/network/app'
import PlaceHeader from '@/components/place/PlaceHeader.vue'
import PlacePhotos from '@/components/place/PlacePhotos.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits(['update:modelValue'])

const route = useRoute()
const router = useRouter()
const dialog = ref(false)
const detail = ref<any>(null)
const loading = ref(true)
const containerRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)
const dragHandleRef = ref<HTMLElement | null>(null)

// Height states
const MIN_HEIGHT = 150
const MID_HEIGHT = 300
const MAX_HEIGHT = window.innerHeight - 50
const currentHeight = ref(MIN_HEIGHT)

// Chat related states
const chatMessages = ref([
  { id: 1, user: '방문자', message: '이 가게는 주차장이 있나요?', time: '14:23' },
  { id: 2, user: '매니저', message: '네, 건물 뒤편에 주차공간이 마련되어 있습니다.', time: '14:25' }
])
const newMessage = ref('')

// Computed current height state: 'min', 'mid', 'max'
const heightState = computed(() => {
  if (currentHeight.value <= (MIN_HEIGHT + MID_HEIGHT) / 2) return 'min'
  if (currentHeight.value <= (MID_HEIGHT + MAX_HEIGHT) / 2) return 'mid'
  return 'max'
})

// Check if popup is at max height (for photo clicks)
const isMaxHeight = computed(() => {
  return heightState.value === 'max'
})

// Content is scrollable
const isScrollable = computed(() => {
  return heightState.value === 'max'
})

// 스크롤 위치 확인
const isAtTopScroll = () => {
  if (!contentRef.value) return true
  return contentRef.value.scrollTop <= 1
}

// Setup drag handle
const handleDrag = useDraggable(dragHandleRef, {
  axis: 'y',
  initialValue: { x: 0, y: 0 },
  preventDefault: true,
  onStart: () => false // 기본 동작 방지하고 아래 핸들러 사용
})

// Watch for route changes to show/hide dialog
watch(
  () => route.query,
  (newQuery) => {
    if (newQuery.place) {
      loading.value = true
      getPlaceDetail()
      dialog.value = true
      currentHeight.value = MIN_HEIGHT
    } else {
      dialog.value = false
    }
  },
  { immediate: true }
)

// Watch for model value changes
watch(
  () => props.modelValue,
  (newVal) => {
    dialog.value = newVal
  }
)

// Emit model update when dialog changes
watch(dialog, (newVal) => {
  emit('update:modelValue', newVal)
})

// Get place details from API
const getPlaceDetail = async () => {
  const placeId: string = route.query.place as string
  if (!placeId) return

  try {
    loading.value = true
    const res = await getPlacesDetailAPI(placeId)
    if (res.status === 200) {
      detail.value = res.data
    }
  } catch (error) {
    console.error('Error fetching place details:', error)
  } finally {
    loading.value = false
  }
}

// Drag state
const isDragging = ref(false)
const startY = ref(0)
const startHeight = ref(0)

// Handle manual drag start on drag handle
const handleDragStart = (e) => {
  e.stopPropagation()
  startManualDrag(e)
}

// Start drag handling
const startManualDrag = (e) => {
  // 최대 높이에서는 스크롤 상단인 경우에만 드래그 가능
  const atMaxHeight = heightState.value === 'max'
  const notAtTopScroll = atMaxHeight && !isAtTopScroll()

  if (notAtTopScroll) {
    return
  }

  // 터치 이벤트면 preventDefault 호출하지 않음
  if (!e.type.includes('touch')) {
    e.preventDefault()
  }

  // Get initial position
  const clientY = e.type.includes('touch')
    ? (e.touches?.[0]?.clientY || 0)
    : e.clientY

  isDragging.value = true
  startY.value = clientY
  startHeight.value = currentHeight.value

  if (containerRef.value) {
    containerRef.value.style.transition = 'none'
  }

  // Add document-level event listeners
  document.addEventListener('mousemove', onManualDrag)
  document.addEventListener('touchmove', onManualDrag, { passive: false })
  document.addEventListener('mouseup', endManualDrag)
  document.addEventListener('touchend', endManualDrag)
}

const onManualDrag = (e) => {
  if (!isDragging.value) return

  e.preventDefault()
  const clientY = e.type.includes('touch')
    ? (e.touches?.[0]?.clientY || 0)
    : e.clientY

  const deltaY = clientY - startY.value
  const newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, startHeight.value - deltaY))

  if (containerRef.value) {
    containerRef.value.style.height = `${newHeight}px`
  }
  currentHeight.value = newHeight
}

const endManualDrag = () => {
  if (!isDragging.value) return

  document.removeEventListener('mousemove', onManualDrag)
  document.removeEventListener('touchmove', onManualDrag)
  document.removeEventListener('mouseup', endManualDrag)
  document.removeEventListener('touchend', endManualDrag)

  if (containerRef.value) {
    containerRef.value.style.transition = 'height 0.2s ease-out'
  }

  // Snap to closest height
  if (heightState.value === 'min') {
    currentHeight.value = MIN_HEIGHT
  } else if (heightState.value === 'mid') {
    currentHeight.value = MID_HEIGHT
  } else {
    currentHeight.value = MAX_HEIGHT
  }

  isDragging.value = false
}

// Content click/touch handler with check for max height and scroll position
const handleContentInteraction = (e) => {
  const atMaxHeight = heightState.value === 'max'
  const notAtTopScroll = atMaxHeight && !isAtTopScroll()

  if (notAtTopScroll) {
    // 스크롤 중간이면 드래그 동작 방지
    return
  }

  // 드래그 시작
  startManualDrag(e)
}

// Close popup dialog
const closePopup = () => {
  const query = { ...route.query }
  delete query.place
  router.replace({
    path: route.path,
    query: query
  })
}

// Chat functions
const sendMessage = () => {
  if (newMessage.value.trim() === '') return

  const now = new Date()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')

  chatMessages.value.push({
    id: chatMessages.value.length + 1,
    user: '나',
    message: newMessage.value,
    time: `${hours}:${minutes}`
  })

  newMessage.value = ''

  // Scroll to bottom of chat after message is sent
  setTimeout(() => {
    const chatContainer = document.querySelector('.chat-messages')
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
  }, 100)
}

onMounted(() => {
  currentHeight.value = MIN_HEIGHT
})
</script>

<template>
  <div v-if="dialog" class="popup-overlay">
    <div ref="containerRef" class="popup-container" :style="{ height: `${currentHeight}px` }">
      <!-- Drag handle - always draggable -->
      <div
        ref="dragHandleRef"
        class="drag-handle"
        @mousedown.stop="handleDragStart"
        @touchstart.stop="handleDragStart"
      >
        <div class="drag-indicator"></div>
      </div>

      <!-- Close button -->
      <button class="close-button" @click="closePopup">
        <span class="icon">✕</span>
      </button>

      <!-- Place details content -->
      <PlaceHeader
        :loading="loading"
        :detail="detail"
        @mousedown="startManualDrag"
        @touchstart="startManualDrag"
      />

      <!-- Content area (scrollable) with photos -->
      <div
        ref="contentRef"
        class="popup-content"
        :class="{
          'is-draggable': !isScrollable,
          'allow-scroll': isScrollable
        }"
        @mousedown="handleContentInteraction"
        @touchstart="handleContentInteraction"
      >
        <!-- Image Gallery - only clickable when at max height -->
        <PlacePhotos
          v-if="detail?.photos?.length"
          :loading="loading"
          :photos="detail?.photos"
          :isMaxHeight="isMaxHeight"
          class="place-photos"
        />

        <!-- Tab Navigation -->
        <div class="tab-navigation">
          <div class="tab active">
            <span class="tab-text">개요</span>
          </div>
          <div class="tab">
            <span class="tab-text">메뉴</span>
          </div>
          <div class="tab">
            <span class="tab-text">리뷰</span>
          </div>
          <div class="tab">
            <span class="tab-text">사진</span>
          </div>
          <div class="tab">
            <span class="tab-text">업데이트</span>
          </div>
          <div class="tab">
            <span class="tab-text">정보</span>
          </div>
        </div>

        <!-- Info sections -->
        <div class="info-sections">
          <!-- Business hours info -->
          <div class="info-section">
            <div class="info-icon">ⓘ</div>
            <div class="info-content">
              <span class="info-text">영업시간이 잘못되었을 수도 있습니다.영업시간이 잘못되었을 수도 있습니다.영업시간이 잘못되었을 수도 있습니다.영업시간이 잘못되었을 수도 있습니다.영업시간이 잘못되었을 수도 있습니다.영업시간이 잘못되었을 수도 있습니다.영업시간이 잘못되었을 수도 있습니다.</span>
              <span class="info-arrow">▼</span>
            </div>
          </div>

          <!-- Address info -->
          <div class="info-section">
            <div class="info-icon location">📍</div>
            <div class="info-content">
              <span class="info-text">서울특별시 중구 세종대로14길 17-5</span>
            </div>
          </div>

          <!-- Operating hours info -->
          <div class="info-section">
            <div class="info-icon time">🕒</div>
            <div class="info-content">
              <span class="info-text">🕒 영업 중류: 오후 2:00 • 오후 4:00에 영업 재개</span>
              <span class="info-arrow">▼</span>
            </div>
          </div>

          <!-- Price info -->
          <div class="info-section">
            <div class="info-icon price">💰</div>
            <div class="info-content">
              <span class="info-text">1인당 ₩10,000~20,000</span>
              <span class="info-arrow">▼</span>
            </div>
          </div>
          <div class="info-section-note">
            <span class="note-text">66명의 사용자가 제공한 정보</span>
          </div>

          <!-- Suggestion button -->
          <div class="suggestion-button">
            <div class="suggestion-icon">✏️</div>
            <span class="suggestion-text">수정 제안하기</span>
          </div>

          <!-- Real-time Chat Panel -->
          <div class="chat-panel">
            <div class="chat-header">
              <div class="chat-icon">💬</div>
              <h3 class="chat-title">실시간 채팅</h3>
            </div>

            <div class="chat-messages">
              <div v-for="msg in chatMessages" :key="msg.id" class="chat-message" :class="{'my-message': msg.user === '나'}">
                <div class="message-header">
                  <span class="message-user">{{ msg.user }}</span>
                  <span class="message-time">{{ msg.time }}</span>
                </div>
                <div class="message-content">{{ msg.message }}</div>
              </div>
            </div>

            <div class="chat-input">
              <input
                v-model="newMessage"
                type="text"
                placeholder="메시지를 입력하세요..."
                @keyup.enter="sendMessage"
              />
              <button class="send-button" @click="sendMessage">전송</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
  border-radius: 12px 12px 0 0;
  overflow: hidden;
  transition: height 0.2s ease-out;
  display: flex;
  flex-direction: column;
  width: 100%;
  will-change: transform, height;
  transform: translateY(100%);
  animation: slideUp 0.3s forwards;
  pointer-events: auto;
  border-top: 1px solid #eee;
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
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  user-select: none;
  touch-action: none;
  z-index: 100;
}

.drag-indicator {
  width: 36px;
  height: 4px;
  background-color: #e0e0e0;
  border-radius: 2px;
}

.close-button {
  position: absolute;
  top: 16px;
  right: 16px;
  background: #f2f2f2;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  font-size: 16px;
}

.popup-content {
  flex: 1;
  position: relative;
  overflow-y: hidden;
}

.popup-content.allow-scroll {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.popup-content.is-draggable {
  cursor: grab;
  user-select: none;
}

/* Place Photos component styles */
.place-photos img {
  cursor: pointer !important;
}

.tab-navigation {
  display: flex;
  width: 100%;
  overflow-x: auto;
  background-color: white;
  border-bottom: 1px solid #f0f0f0;
  white-space: nowrap;
}

.tab {
  flex: 1;
  min-width: 60px;
  padding: 12px 8px;
  text-align: center;
  font-size: 14px;
  color: #666;
}

.tab.active {
  color: #009688;
  border-bottom: 2px solid #009688;
}

.info-sections {
  padding: 8px 0;
  background-color: white;
}

.info-section {
  display: flex;
  padding: 16px;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
}

.info-icon {
  width: 24px;
  height: 24px;
  margin-right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.info-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-text {
  font-size: 14px;
  color: #333;
}

.info-arrow {
  color: #999;
  font-size: 12px;
}

.info-section-note {
  padding: 8px 16px;
  font-size: 12px;
  color: #999;
}

.suggestion-button {
  display: flex;
  align-items: center;
  padding: 16px;
  color: #009688;
  border-bottom: 1px solid #f0f0f0;
}

.suggestion-icon {
  margin-right: 12px;
}

.suggestion-text {
  font-size: 14px;
}

/* Chat Panel Styles */
.chat-panel {
  margin-top: 16px;
  border-top: 1px solid #f0f0f0;
  padding: 16px;
}

.chat-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.chat-icon {
  font-size: 20px;
  margin-right: 12px;
}

.chat-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.chat-messages {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 16px;
  padding: 0 4px;
}

.chat-message {
  margin-bottom: 12px;
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 8px;
  max-width: 85%;
}

.my-message {
  margin-left: auto;
  background-color: #e3f2fd;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.message-user {
  font-weight: 600;
  font-size: 13px;
  color: #333;
}

.message-time {
  font-size: 11px;
  color: #999;
}

.message-content {
  font-size: 14px;
  line-height: 1.4;
  color: #333;
  word-wrap: break-word;
}

.chat-input {
  display: flex;
  border: 1px solid #e0e0e0;
  border-radius: 24px;
  overflow: hidden;
  background-color: #fff;
}

.chat-input input {
  flex: 1;
  border: none;
  padding: 12px 16px;
  outline: none;
  font-size: 14px;
}

.send-button {
  background-color: #009688;
  color: white;
  border: none;
  padding: 0 16px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}
</style>