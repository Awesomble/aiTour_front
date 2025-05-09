<script setup lang="ts">
import { computed, ref, watch, defineExpose } from 'vue'
import { getChatMessagesAPI, getMeAPI } from '@/network/app'
import { useUserStore } from '@/store'
import { useWebSocket } from '@vueuse/core'
import { getInitials } from '@/plugins/utils'

interface ChatMessage {
  message_id: string
  place_id: string
  sub: string
  user_name: string
  content: string
  timestamp: number
  message_type: string
  thumbnail_url?: string
}

const userStore = useUserStore()
const props = defineProps({
  loading: { type: Boolean, default: true },
  detail: { type: Object, default: () => ({}) },
  showChat: { type: Boolean, default: false },
  heightState: { type: String, default: 'min' },
  isMaximized: { type: Boolean, default: false },
  chatHeight: { type: String, default: '300px' }
})

const emit = defineEmits(['update-participant-count', 'update-chat-input-state'])

const WS_BASE_URL = import.meta.env?.VITE_WS_URL
const chatMessages = ref<ChatMessage[]>([])
const isLoading = ref(true)
const chatInputEnabled = ref(false)
const currentUser = ref({ sub: '', user_name: '방문자' })
const chatMessagesRef = ref<HTMLElement | null>(null)
const participantCount = ref(0)
const connectionError = ref('')

// 계산된 속성
const placeId = computed(() => props.detail?.place_id || '')
const containerStyle = computed(() => ({
  height: props.chatHeight
}))

// WebSocket URL 생성
const wsUrl = computed(() => {
  const token = userStore.userInfo?.accessToken || ''
  return `${WS_BASE_URL}/chat/ws/${placeId.value}?token=${token}`
})

// WebSocket 설정
const {
  status,
  data,
  send: wsSend,
  open: wsOpen,
  close: wsClose
} = useWebSocket(wsUrl, {
  autoReconnect: false,
  immediate: false,
  onConnected: () => {
    chatInputEnabled.value = true
    emit('update-chat-input-state', true)
    connectionError.value = ''
  },
  onDisconnected: () => {
    chatInputEnabled.value = false
    emit('update-chat-input-state', false)
    connectionError.value = '채팅 서버에 연결할 수 없습니다. 다시 시도해 주세요.'
  },
  onError: () => {
    connectionError.value = '연결 오류가 발생했습니다'
    chatInputEnabled.value = false
    emit('update-chat-input-state', false)
  }
})

const isConnected = computed(() => status.value === 'OPEN')

// 메시지 스크롤 함수
const scrollToBottom = (immediate = false) => {
  if (!chatMessagesRef.value) return
  chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
  if (immediate) {
    setTimeout(() => {
      if (chatMessagesRef.value) {
        chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
      }
    }, 100)
  }
}

// WebSocket 연결 함수
const connectWebSocket = () => {
  if (!placeId.value) {
    connectionError.value = '장소 정보가 없습니다'
    return
  }

  const token = userStore.userInfo?.accessToken
  if (!token) {
    connectionError.value = '로그인이 필요합니다'
    return
  }

  connectionError.value = ''
  wsOpen()
}

// 채팅 기록 로드 함수
const loadChatHistory = async () => {
  if (!placeId.value) return
  isLoading.value = true

  try {
    const response = await getChatMessagesAPI(placeId.value)
    const systemMessages = response.data.filter((msg: ChatMessage) => msg.message_type === 'system')

    // 참가자 수 파싱
    for (const msg of systemMessages) {
      const participantMatch = msg.content.match(/현재 (\d+)명이 참여/)
      if (participantMatch && participantMatch[1]) {
        participantCount.value = parseInt(participantMatch[1])
        emit('update-participant-count', participantCount.value)
        break
      }
    }

    // 일반 메시지만 필터링
    chatMessages.value = response.data
      .filter((msg: ChatMessage) => msg.message_type !== 'system')
      .sort((a: ChatMessage, b: ChatMessage) => a.timestamp - b.timestamp)

    scrollToBottom()
  } catch (error) {
    chatMessages.value = []
  } finally {
    isLoading.value = false
  }
}

// 사용자 정보 로드
const loadUserInfo = async () => {
  try {
    const response = await getMeAPI()
    currentUser.value = {
      sub: response.data.sub,
      user_name: response.data.user_name || '방문자'
    }
  } catch (error) {
    // 에러 처리 - 기본값 유지
  }
}

// 메시지 전송 함수
const sendMessage = (message) => {
  const trimmedMessage = typeof message === 'string' ? message.trim() : ''
  if (!trimmedMessage) return

  try {
    const messageData = {
      content: trimmedMessage,
      message_type: 'text'
    }

    if (!isConnected.value) {
      // 오프라인 시 로컬 메시지 표시
      const localMessage: ChatMessage = {
        message_id: `local_${Date.now()}`,
        place_id: placeId.value,
        sub: currentUser.value.sub,
        user_name: currentUser.value.user_name,
        content: trimmedMessage,
        timestamp: Math.floor(Date.now() / 1000),
        message_type: 'text',
        thumbnail_url: userStore.userInfo?.thumbnail_url
      }
      chatMessages.value.push(localMessage)
      scrollToBottom(true)
    } else {
      console.log('Sending message via WebSocket:', messageData)
      wsSend(JSON.stringify(messageData))
    }
  } catch (error) {
    console.error('메시지 전송 오류:', error)
  }
}

// 외부에서 호출 가능하도록 expose
defineExpose({
  sendMessage
})

// 연결 초기화 함수
const initializeConnection = async () => {
  connectionError.value = ''
  try {
    await loadUserInfo()
    await loadChatHistory()
    connectWebSocket()
  } catch (error) {
    connectionError.value = '연결 중 오류가 발생했습니다'
  }
}

// 채팅 표시 및 장소 ID 변경 감지
watch(
  [() => props.showChat, placeId],
  ([newShowChat, newPlaceId]) => {
    if (isConnected.value) {
      wsClose()
    }
    if (newShowChat && newPlaceId) {
      initializeConnection()
    }
  },
  { immediate: true }
)

// WebSocket 메시지 수신 처리
watch(data, (newData) => {
  if (!newData) return
  try {
    const message = JSON.parse(newData)
    if (message.message_type === 'system') {
      emit('update-participant-count', message.content)
      return
    }

    const isDuplicate = chatMessages.value.some(
      msg => msg.message_id === message.message_id
    )

    if (!isDuplicate && message.message_id && message.content) {
      chatMessages.value.push(message)
      scrollToBottom()
    }
  } catch (e) {
    console.error('메시지 파싱 오류:', e)
  }
})

// 최대화 상태 변경 감지
watch(() => props.isMaximized, () => {
  setTimeout(scrollToBottom, 50)
})

// 채팅 높이 변경 감지
watch(() => props.chatHeight, () => {
  setTimeout(scrollToBottom, 50)
})
</script>

<template>
  <div class="chat-container" :class="{ 'maximized': isMaximized }" :style="containerStyle">
    <div ref="chatMessagesRef" class="chat-messages">
      <v-progress-circular v-if="isLoading" indeterminate color="primary" class="loading-spinner"></v-progress-circular>

      <div v-else-if="connectionError" class="error-message">
        <v-alert type="error" variant="tonal" density="compact">
          {{ connectionError }}
        </v-alert>
        <v-btn size="small" color="primary" class="mt-4" @click="initializeConnection">재연결</v-btn>
      </div>

      <div v-else-if="chatMessages.length === 0" class="empty-messages">
        아직 메시지가 없습니다. 첫 메시지를 보내보세요!
      </div>

      <div
        v-for="(message, index) in chatMessages"
        :key="message.message_id || index"
        class="message-item"
        :class="{ 'my-message': message.sub === currentUser.sub }"
      >
        <v-avatar size="28" class="message-avatar">
          <v-img
            v-if="message.thumbnail_url"
            :src="message.thumbnail_url"
            alt="프로필"
          ></v-img>
          <span v-else class="initial-avatar">{{ getInitials(message.user_name) }}</span>
        </v-avatar>

        <div class="message-content">
          <span class="message-user">{{ message.user_name }}</span>
          <span class="message-text">{{ message.content }}</span>
          <v-chip
            v-if="(message.message_id || '').startsWith('local_')"
            size="x-small"
            class="local-indicator"
            label
            variant="flat"
            color="grey-lighten-2"
          >로컬</v-chip>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.chat-container {
  width: 100%;
  background-color: #f9f9f9;
  position: relative;
  overflow: hidden;

  &.maximized {
    z-index: 5;
  }
}

.chat-messages {
  overflow-y: auto;
  height: 100%;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  -webkit-overflow-scrolling: touch;
}

.loading-spinner {
  margin: auto;
}

.empty-messages, .error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(0, 0, 0, 0.6);
  text-align: center;
  padding: 20px;
}

.message-item {
  display: flex;
  align-items: flex-start;
  padding: 4px 0;
  animation: fadeIn 0.2s ease-out;
}

.message-avatar {
  margin-right: 8px;
  flex-shrink: 0;
}

.initial-avatar {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e0e0e0;
  color: #424242;
  font-size: 12px;
  font-weight: 500;
  border-radius: 50%;
}

.message-content {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 10px;
  margin-top: 8px;
}

.message-user {
  font-weight: 500;
  font-size: 14px;
}

.message-text {
  font-size: 14px;
  word-break: break-word;
}

.local-indicator {
  font-size: 10px;
  height: 18px;
}

.my-message .message-user {
  color: rgb(20, 131, 194);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>