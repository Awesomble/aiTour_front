<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { MessageSquare } from 'lucide-vue-next'

const props = defineProps({
  loading: {
    type: Boolean,
    default: true
  },
  detail: {
    type: Object,
    default: () => ({})
  },
  showChatPopup: {
    type: Boolean,
    default: false
  },
  parentHeightState: {
    type: String,
    default: 'mid'
  },
  parentHeight: {
    type: Number,
    default: 300
  }
})

const emit = defineEmits(['update:showChatPopup', 'chat-height-change'])

// Chat related states
const chatMessages = ref([
  { id: 1, user: '방문자', message: '이 가게는 주차장이 있나요?', time: '14:23' },
  { id: 2, user: '매니저', message: '네, 건물 뒤편에 주차공간이 마련되어 있습니다.', time: '14:25' }
])
const newMessage = ref('')

// Chat container refs and dimensions
const chatContainerRef = ref<HTMLElement | null>(null)
const chatDragHandleRef = ref<HTMLElement | null>(null)
const chatMinHeight = 80
const chatMidHeight = 300
const chatMaxHeight = window.innerHeight - 170 // 부모 팝업 헤더 공간 확보
const chatCurrentHeight = ref(chatMinHeight)

// 현재 높이 상태 계산: 'min', 'mid', 'max'
const chatHeightState = computed(() => {
  if (chatCurrentHeight.value <= (chatMinHeight + chatMidHeight) / 2) return 'min'
  if (chatCurrentHeight.value <= (chatMidHeight + chatMaxHeight) / 2) return 'mid'
  return 'max'
})

// Chat drag state
const isChatDragging = ref(false)
const chatStartY = ref(0)
const chatStartHeight = ref(0)

// Close chat popup
const closeChatPopup = () => {
  emit('update:showChatPopup', false)
}

// Watch showChatPopup to ensure heights are coordinated
watch(() => props.showChatPopup, (newVal) => {
  if (newVal) {
    // 채팅창 열릴 때 중간 높이로 시작
    chatCurrentHeight.value = chatMidHeight
    // Notify parent of initial height
    emit('chat-height-change', chatMidHeight)
  }
})

// Watch parent height state to sync chat panel
watch(() => props.parentHeightState, (newState) => {
  if (newState === 'min') {
    // 부모 팝업이 최소화되면 챗판넬 닫기
    emit('update:showChatPopup', false)
  } else if (props.showChatPopup) {
    // 부모 팝업의 높이 상태에 따라 챗판넬 높이 조정
    if (newState === 'mid') {
      chatCurrentHeight.value = chatMidHeight
    } else if (newState === 'max') {
      chatCurrentHeight.value = chatMaxHeight
    }
  }
})

// Watch parent height for shrinking changes only (rule #4)
watch(() => props.parentHeight, (newHeight, oldHeight) => {
  if (props.showChatPopup && !isChatDragging.value && newHeight < oldHeight) {
    // Only react when parent is getting smaller
    const parentMin = 150 // From parent component
    const parentMid = 300 // From parent component
    const parentMax = window.innerHeight - 50 // From parent component

    // Calculate parent's position in its range (0-1)
    const parentRange = parentMax - parentMin
    const parentPosition = (newHeight - parentMin) / parentRange

    // Make chat panel react faster to shrinking (reach mid/min earlier)
    // By using a more aggressive curve - using power of 1.5 makes it shrink faster
    const chatPosition = Math.pow(parentPosition, 1.5)

    // Calculate new chat height based on adjusted position
    const chatRange = chatMaxHeight - chatMinHeight
    const newChatHeight = chatMinHeight + (chatPosition * chatRange)

    // Only update if the new calculated height is smaller than current
    if (newChatHeight < chatCurrentHeight.value) {
      chatCurrentHeight.value = newChatHeight
      emit('chat-height-change', chatCurrentHeight.value)
    }
  }
})

// Handle chat drag start
const handleChatDragStart = (e: any) => {
  e.stopPropagation()

  // Get initial position
  const clientY = e.type.includes('touch')
    ? (e.touches?.[0]?.clientY || 0)
    : e.clientY

  isChatDragging.value = true
  chatStartY.value = clientY
  chatStartHeight.value = chatCurrentHeight.value

  if (chatContainerRef.value) {
    chatContainerRef.value.style.transition = 'none'
  }

  // Add document-level event listeners
  document.addEventListener('mousemove', onChatManualDrag)
  document.addEventListener('touchmove', onChatManualDrag, { passive: false })
  document.addEventListener('mouseup', endChatManualDrag)
  document.addEventListener('touchend', endChatManualDrag)
}

// Send message
const sendMessage = () => {
  if (!newMessage.value.trim()) return

  const now = new Date()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  const time = `${hours}:${minutes}`

  chatMessages.value.push({
    id: chatMessages.value.length + 1,
    user: '방문자',
    message: newMessage.value.trim(),
    time
  })

  newMessage.value = ''

  // Simulate response after 1 second
  setTimeout(() => {
    chatMessages.value.push({
      id: chatMessages.value.length + 1,
      user: '매니저',
      message: '감사합니다. 곧 답변 드리겠습니다.',
      time: `${hours}:${minutes}`
    })
  }, 1000)
}

const onChatManualDrag = (e: any) => {
  if (!isChatDragging.value) return

  // Normal drag handling
  if (!e.type.includes('touch')) {
    e.preventDefault()
  }

  const clientY = e.type.includes('touch')
    ? (e.touches?.[0]?.clientY || 0)
    : e.clientY

  const deltaY = clientY - chatStartY.value
  const newHeight = Math.max(chatMinHeight, Math.min(chatMaxHeight, chatStartHeight.value - deltaY))

  if (chatContainerRef.value) {
    chatContainerRef.value.style.height = `${newHeight}px`
  }
  chatCurrentHeight.value = newHeight

  // Emit height change to parent
  emit('chat-height-change', newHeight)
}

const endChatManualDrag = () => {
  if (!isChatDragging.value) return

  document.removeEventListener('mousemove', onChatManualDrag)
  document.removeEventListener('touchmove', onChatManualDrag)
  document.removeEventListener('mouseup', endChatManualDrag)
  document.removeEventListener('touchend', endChatManualDrag)

  if (chatContainerRef.value) {
    chatContainerRef.value.style.transition = 'height 0.2s ease-out'
  }

  // 가장 가까운 높이로 스냅
  if (chatHeightState.value === 'min') {
    chatCurrentHeight.value = chatMinHeight
  } else if (chatHeightState.value === 'mid') {
    chatCurrentHeight.value = chatMidHeight
  } else {
    chatCurrentHeight.value = chatMaxHeight
  }

  isChatDragging.value = false

  // Emit final height to parent after snap
  emit('chat-height-change', chatCurrentHeight.value)
}

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onChatManualDrag)
  document.removeEventListener('touchmove', onChatManualDrag)
  document.removeEventListener('mouseup', endChatManualDrag)
  document.removeEventListener('touchend', endChatManualDrag)
})
</script>

<template>
  <!-- Chat Popup -->
  <div v-if="showChatPopup" class="chat-popup-overlay">
    <div
      ref="chatContainerRef"
      class="chat-container"
      :style="{ height: `${chatCurrentHeight}px` }"
    >
      <!-- Chat Drag Handle -->
      <div
        ref="chatDragHandleRef"
        class="chat-drag-handle"
        @mousedown.stop="handleChatDragStart"
        @touchstart.stop="handleChatDragStart"
      >
        <div class="drag-indicator"></div>
        <div class="chat-header">
          <div class="chat-title">매장 문의하기</div>
          <button class="chat-close-button" @click="closeChatPopup">
            <span class="icon">✕</span>
          </button>
        </div>
      </div>

      <!-- Chat Messages Area -->
      <div class="chat-messages">
        <div
          v-for="message in chatMessages"
          :key="message.id"
          class="message"
          :class="{ 'user-message': message.user === '방문자', 'shop-message': message.user === '매니저' }"
        >
          <div class="message-header">
            <span class="message-user">{{ message.user }}</span>
            <span class="message-time">{{ message.time }}</span>
          </div>
          <div class="message-content">{{ message.message }}</div>
        </div>
      </div>

      <!-- Chat Input Area -->
      <div class="chat-input-area">
        <input
          v-model="newMessage"
          type="text"
          class="chat-input"
          placeholder="메시지를 입력하세요..."
          @keyup.enter="sendMessage"
        />
        <button class="send-button" @click="sendMessage">
          <span>전송</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
// Primary color
$primary-color: #1483C2;
$primary-light: #e6f3fa;
$primary-dark: #0e6599;

/* Chat Banner Styles */
.chat-banner {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  background-color: $primary-color;
  color: white;
  padding: 12px 20px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 1001;
  pointer-events: auto;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(20, 131, 194, 0.3);
  transition: all 0.2s ease;

  &:hover {
    background-color: $primary-dark;
    transform: translateX(-50%) translateY(-2px);
  }
}

.chat-icon {
  font-size: 18px;
}

.chat-text {
  font-size: 14px;
  font-weight: 500;
}

/* Chat Popup Styles */
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
  transition: height 0.2s ease-out;
  display: flex;
  flex-direction: column;
  width: 100%;
  will-change: transform, height;
  transform: translateY(100%);
  animation: chatSlideUp 0.3s forwards;
  pointer-events: auto;
  border-top: 1px solid #eee;
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
  padding: 12px 16px 0;
  user-select: none;
  touch-action: none;
  cursor: grab;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0 12px;
}

.chat-title {
  font-size: 16px;
  font-weight: 600;
  color: $primary-color;
}

.chat-close-button {
  background: none;
  border: none;
  font-size: 18px;
  color: #666;
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover {
    color: #333;
  }
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background-color: #f9f9f9;
}

.message {
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 12px;
  word-break: break-word;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  position: relative;
}

.user-message {
  align-self: flex-end;
  background-color: $primary-color;
  color: white;
  border-bottom-right-radius: 4px;

  .message-header {
    .message-user, .message-time {
      color: rgba(255, 255, 255, 0.9);
    }
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    right: -6px;
    width: 12px;
    height: 12px;
    background-color: $primary-color;
    clip-path: polygon(0 0, 0% 100%, 100% 100%);
  }
}

.shop-message {
  align-self: flex-start;
  background-color: white;
  border-bottom-left-radius: 4px;

  .message-header {
    .message-user {
      color: $primary-color;
      font-weight: 600;
    }
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: -6px;
    width: 12px;
    height: 12px;
    background-color: white;
    clip-path: polygon(100% 0, 0% 100%, 100% 100%);
  }
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 12px;
}

.message-user {
  font-weight: 500;
  color: #555;
}

.message-time {
  color: #888;
}

.message-content {
  font-size: 14px;
  line-height: 1.5;
}

.chat-input-area {
  display: flex;
  padding: 16px;
  border-top: 1px solid #eeeeee;
  background-color: white;
  align-items: center;
}

.chat-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 24px;
  font-size: 14px;
  outline: none;
  transition: border 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    border-color: $primary-color;
    box-shadow: 0 0 0 2px rgba(20, 131, 194, 0.1);
  }

  &::placeholder {
    color: #aaa;
  }
}

.send-button {
  margin-left: 12px;
  padding: 0 18px;
  height: 40px;
  background-color: $primary-color;
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background-color: $primary-dark;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}

.drag-indicator {
  width: 40px;
  height: 5px;
  background-color: #e0e0e0;
  border-radius: 3px;
  margin: 0 auto 8px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #d0d0d0;
  }
}
</style>