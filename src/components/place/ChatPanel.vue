<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch, onMounted } from 'vue'
import ChatBox from './ChatBox.vue'

// 컴포넌트 Props 정의
const props = defineProps({
  loading: { type: Boolean, default: true },
  detail: { type: Object, default: () => ({}) },
  showChatPopup: { type: Boolean, default: false },
  parentHeightState: { type: String, default: 'mid' },
  parentHeight: { type: Number, default: 300 }
})
const emit = defineEmits(['update:showChatPopup', 'chat-height-change'])

// 드래그 관련 상태
const isVisible = ref(false)
const isDragging = ref<boolean>(false)
const startY = ref<any | null>(null)
const startHeight = ref<any | null>(null)

// 참가자 수 상태
const participantCount = ref(0)

// 패널 refs 및 치수
const containerRef = ref<HTMLElement | null>(null)
const dragHandleRef = ref<HTMLElement | null>(null)
const minHeight = 110
const midHeight = 300
const maxHeight = window.innerHeight - 170
const currentHeight = ref(midHeight)
const heightState = computed(() => {
  if (currentHeight.value <= (minHeight + midHeight) / 2) return 'min'
  if (currentHeight.value <= (midHeight + maxHeight) / 2) return 'mid'
  return 'max'
})

// 패널 마운트 시 처리
onMounted(() => {
  console.log('Drag panel component mounted, showChatPopup:', props.showChatPopup)
  isVisible.value = props.showChatPopup
  if (props.showChatPopup) {
    currentHeight.value = midHeight
    emit('chat-height-change', midHeight)
    setTimeout(() => {
      if (containerRef.value) containerRef.value.style.transform = 'translateY(0)'
    }, 50)
  }
})

// showChatPopup 변화에 따른 처리
watch(
  () => props.showChatPopup, (newVal) => {
    isVisible.value = newVal
    if (newVal) {
      if (props.parentHeightState === 'max') {
        currentHeight.value = maxHeight
        emit('chat-height-change', maxHeight)
      } else {
        currentHeight.value = midHeight
        emit('chat-height-change', midHeight)
      }
      setTimeout(() => {
        if (containerRef.value) containerRef.value.style.transform = 'translateY(0)'
      }, 50)
    }
  }
)

// 부모 높이 상태에 따라 패널 높이 동기화
watch(
  () => props.parentHeightState,
  (newState) => {
    if (newState === 'min') {
      emit('update:showChatPopup', false)
    } else if (props.showChatPopup) {
      if (newState === 'mid') {
        currentHeight.value = midHeight
      } else if (newState === 'max') {
        currentHeight.value = maxHeight
      }
    }
  }
)

// 부모 높이 변화에 따른 패널 크기 조정 (축소 시)
watch(
  () => props.parentHeight,
  (newHeight, oldHeight) => {
    if (props.showChatPopup && !isDragging.value && newHeight < oldHeight) {
      const parentMin = 150
      const parentMid = 300
      const parentMax = window.innerHeight - 50
      const parentRange = parentMax - parentMin
      const parentPosition = (newHeight - parentMin) / parentRange
      const chatPosition = Math.pow(parentPosition, 1.5)
      const chatRange = maxHeight - minHeight
      const newChatHeight = minHeight + chatPosition * chatRange
      if (newChatHeight < currentHeight.value) {
        currentHeight.value = newChatHeight
        emit('chat-height-change', currentHeight.value)
      }
    }
  }
)

// 드래그 시작
const handleDragStart = (e: MouseEvent | TouchEvent) => {
  e.stopPropagation()
  console.log('Drag started')
  const clientY = 'touches' in e ? e.touches[0]?.clientY || 0 : (e as MouseEvent).clientY
  isDragging.value = true
  startY.value = clientY
  startHeight.value = currentHeight.value
  if (containerRef.value) {
    containerRef.value.style.transition = 'none'
  }
  document.addEventListener('mousemove', onManualDrag)
  document.addEventListener('touchmove', onManualDrag, { passive: false })
  document.addEventListener('mouseup', endManualDrag)
  document.addEventListener('touchend', endManualDrag)
}

const onManualDrag = (e: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return
  if (!('touches' in e)) {
    e.preventDefault()
  }
  const clientY = 'touches' in e ? e.touches[0]?.clientY || 0 : (e as MouseEvent).clientY
  const deltaY = clientY - startY.value
  const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight.value - deltaY))
  if (containerRef.value) {
    containerRef.value.style.height = `${newHeight}px`
  }
  currentHeight.value = newHeight
  emit('chat-height-change', newHeight)
}

const endManualDrag = () => {
  if (!isDragging.value) return
  console.log('Drag ended')
  document.removeEventListener('mousemove', onManualDrag)
  document.removeEventListener('touchmove', onManualDrag)
  document.removeEventListener('mouseup', endManualDrag)
  document.removeEventListener('touchend', endManualDrag)
  if (containerRef.value) {
    containerRef.value.style.transition = 'height 0.2s ease-out'
  }
  if (heightState.value === 'min') {
    currentHeight.value = minHeight
  } else if (heightState.value === 'mid') {
    currentHeight.value = midHeight
  } else {
    currentHeight.value = maxHeight
  }
  isDragging.value = false
  emit('chat-height-change', currentHeight.value)
}

// 채팅창 닫기
const closeChat = () => {
  emit('update:showChatPopup', false)
}

// 채팅 참가자 수 업데이트
const updateParticipantCount = (count: number) => {
  participantCount.value = count
}
onMounted(() => {
  console.log('Drag panel component mounted, showChatPopup:', props.showChatPopup)
  isVisible.value = props.showChatPopup
  if (props.showChatPopup) {
    if (props.parentHeightState === 'max') {
      currentHeight.value = maxHeight
      emit('chat-height-change', maxHeight)
    } else {
      currentHeight.value = midHeight
      emit('chat-height-change', midHeight)
    }
    setTimeout(() => {
      if (containerRef.value) containerRef.value.style.transform = 'translateY(0)'
    }, 50)
  }
})

onBeforeUnmount(() => {
  console.log('Drag panel component unmounting')
  document.removeEventListener('mousemove', onManualDrag)
  document.removeEventListener('touchmove', onManualDrag)
  document.removeEventListener('mouseup', endManualDrag)
  document.removeEventListener('touchend', endManualDrag)
})
</script>

<template>
  <div v-if="props.showChatPopup" class="chat-popup-overlay">
    <div
      ref="containerRef"
      class="chat-container"
      :class="{ 'chat-visible': isVisible }"
      :style="{ height: `${currentHeight}px` }"
    >
      <!-- 드래그 핸들 -->
      <div
        ref="dragHandleRef"
        class="chat-drag-handle"
        @mousedown.stop="handleDragStart"
        @touchstart.stop="handleDragStart"
      >
        <div class="handle-content">
          <div class="drag-indicator"></div>

          <div class="chat-header">
            <div class="chat-title">
              <v-icon size="small" icon="mdi-chat" class="mr-2"></v-icon>
              실시간 채팅
            </div>

            <div class="chat-info">
              <span v-if="participantCount > 0" class="participant-count">
                <v-icon size="x-small" icon="mdi-account-group" class="mr-1"></v-icon>
                {{ participantCount }}명 참여중
              </span>

              <v-btn
                size="small"
                icon
                variant="text"
                density="comfortable"
                color="grey-darken-1"
                @click.stop="closeChat"
                class="close-btn"
              >
                <v-icon size="small">mdi-close</v-icon>
              </v-btn>
            </div>
          </div>
        </div>
      </div>

      <!-- 채팅 컴포넌트 -->
      <ChatBox
        :detail="props.detail"
        :loading="props.loading"
        :show-chat="isVisible"
        :height-state="heightState"
        @update-participant-count="updateParticipantCount"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
$primary-color: #1483c2;
$primary-light: #e6f3fa;
$primary-dark: #0e6599;

.chat-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  pointer-events: none;
}

.chat-container {
  position: relative;
  background-color: white;
  border-radius: 16px 16px 0 0;
  transition:
    height 0.2s ease-out,
    transform 0.3s ease-out;
  display: flex;
  flex-direction: column;
  width: 100%;
  will-change: transform, height;
  transform: translateY(100%);
  animation: chatSlideUp 0.3s forwards;
  pointer-events: auto;
  border-top: 1px solid #eee;
}

.chat-visible {
  transform: translateY(0) !important;
}

@keyframes chatSlideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.chat-drag-handle {
  padding: 8px 16px 0;
  user-select: none;
  touch-action: none;
  cursor: grab;
  border-bottom: 1px solid #eee;
}

.handle-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 4px 0 6px;
}

.chat-title {
  font-size: 15px;
  font-weight: 600;
  color: $primary-color;
  display: flex;
  align-items: center;
}

.chat-info {
  display: flex;
  align-items: center;
}

.participant-count {
  font-size: 12px;
  color: #666;
  display: flex;
  align-items: center;
  margin-right: 12px;
}

.close-btn {
  margin-right: -8px;
}

.drag-indicator {
  width: 40px;
  height: 5px;
  background-color: #e0e0e0;
  border-radius: 3px;
  margin: 0 auto;
  transition: background-color 0.2s ease;
  &:hover {
    background-color: #d0d0d0;
  }
}
</style>
