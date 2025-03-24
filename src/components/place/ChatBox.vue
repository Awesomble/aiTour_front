<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
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
})
const emit = defineEmits(['system-message', 'update-participant-count', 'connection-error'])

const WS_BASE_URL = import.meta.env?.VITE_WS_URL
const chatMessages = ref<ChatMessage[]>([])
const newMessage = ref('')
const isLoading = ref(true)
const chatInputEnabled = ref(false)
const currentUser = ref({ sub: '', user_name: '방문자' })
const chatMessagesRef = ref<HTMLElement | null>(null)
const participantCount = ref(0)
const connectionError = ref('')

const placeId = computed(() => props.detail?.place_id || '')
const showInputBox = computed(() => props.heightState !== 'min')

const wsUrl = computed(() => {
  const token = userStore.userInfo?.accessToken || ''
  const url = `${WS_BASE_URL}/chat/ws/${placeId.value}?token=${token}`
  console.log('WebSocket URL:', url)
  return url
})

const {
  status,
  data,
  error,
  send: wsSend,
  open: wsOpen,
  close: wsClose
} = useWebSocket(wsUrl, {
  autoReconnect: {
    retries: 5,
    delay: 2000,
    onFailed() {
      console.error('WebSocket 재연결 실패, 수동 재연결 필요')
      connectionError.value = '채팅 서버 연결에 실패했습니다. 페이지를 새로고침 해보세요.'
      emit('connection-error', '연결 실패')
    }
  },
  immediate: true,
  onConnected: () => {
    console.log('WebSocket 연결됨')
    chatInputEnabled.value = true
    connectionError.value = ''
  },
  onDisconnected: (e) => {
    console.log('WebSocket 연결 종료:', e)
    chatInputEnabled.value = false
  },
  onError: (ws, event) => {
    console.error('WebSocket 오류 발생:', event)
    connectionError.value = '연결 오류가 발생했습니다'
    emit('connection-error', event)
  },
  onMessage: (ws, event) => {
    try {
      const data = JSON.parse(event.data)
      if (data.type === 'heartbeat') {
        console.log('서버 하트비트 수신, 응답 전송')
        wsSend(JSON.stringify({ type: 'heartbeat_response' }))
      } else if (data.type === 'connection_status') {
        console.log('Connection status:', data)
      } else if (data.type === 'auth_status') {
        console.log('Auth status:', data)
        if (data.status === 'error') {
          connectionError.value = data.message || '인증 오류'
          emit('connection-error', '인증 실패')
        }
      } else if (data.message_type === 'system') {
        emit('update-participant-count', data.content)
      } else {
        chatMessages.value.push(data)
        scrollToBottom()
      }
    } catch (e) {
      console.error('메시지 처리 오류:', e)
    }
  }
})

const isConnected = computed(() => status.value === 'OPEN')

const connectWebSocket = () => {
  if (!placeId.value) {
    console.warn('place_id가 없어 WebSocket 연결을 시도하지 않습니다.')
    connectionError.value = '장소 정보가 없습니다'
    return
  }
  const token = userStore.userInfo?.accessToken
  if (!token) {
    console.error('인증 토큰이 없어 WebSocket 연결을 시도하지 않습니다')
    connectionError.value = '로그인이 필요합니다'
    return
  }
  console.log('WebSocket 연결 시도:', {
    placeId: placeId.value,
    tokenLength: token.length,
    url: wsUrl.value
  })
  connectionError.value = ''
  wsOpen()
}

const loadChatHistory = async () => {
  if (!placeId.value) {
    console.error('placeId is empty, cannot load chat history')
    return
  }
  isLoading.value = true
  console.log('Loading chat history for place ID:', placeId.value)
  try {
    const response = await getChatMessagesAPI(placeId.value)
    console.log('Chat history response received:', response ? 'Success' : 'Failed')
    const systemMessages = response.data.filter((msg: ChatMessage) => msg.message_type === 'system')
    for (const msg of systemMessages) {
      const participantMatch = msg.content.match(/현재 (\d+)명이 참여/)
      if (participantMatch && participantMatch[1]) {
        participantCount.value = parseInt(participantMatch[1])
        emit('update-participant-count', participantCount.value)
        break
      }
    }
    chatMessages.value = response.data
      .filter((msg: ChatMessage) => msg.message_type !== 'system')
      .sort((a: ChatMessage, b: ChatMessage) => a.timestamp - b.timestamp)
    scrollToBottom()
  } catch (error) {
    console.error('채팅 기록을 불러오는 중 오류가 발생했습니다:', error)
    chatMessages.value = []
  } finally {
    isLoading.value = false
  }
}

const loadUserInfo = async () => {
  try {
    console.log('Loading user info')
    const response = await getMeAPI()
    console.log('User info response received:', response ? 'Success' : 'Failed')
    currentUser.value = {
      sub: response.data.sub,
      user_name: response.data.user_name || '방문자'
    }
  } catch (error) {
    console.error('사용자 정보를 불러오는 중 오류가 발생했습니다:', error)
    throw error
  }
}

const sendMessage = () => {
  if (!newMessage.value.trim()) return
  try {
    const messageData = {
      content: newMessage.value.trim(),
      message_type: 'text'
    }
    console.log('Sending message:', messageData)
    if (!isConnected.value) {
      console.log('Not connected - adding message locally')
      const localMessage: ChatMessage = {
        message_id: `local_${Date.now()}`,
        place_id: placeId.value,
        sub: currentUser.value.sub,
        user_name: currentUser.value.user_name,
        content: newMessage.value.trim(),
        timestamp: Math.floor(Date.now() / 1000),
        message_type: 'text',
        thumbnail_url: userStore.userInfo?.thumbnail_url
      }
      chatMessages.value.push(localMessage)
      scrollToBottom()
    } else {
      wsSend(JSON.stringify(messageData))
    }
    newMessage.value = ''
  } catch (error) {
    console.error('메시지 전송 중 오류가 발생했습니다:', error)
  }
}

const scrollToBottom = () => {
  setTimeout(() => {
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
    }
  }, 50)
}

const handleWheel = (e: WheelEvent) => e.stopPropagation()
const handleTouchStart = (e: TouchEvent) => {
  if (chatMessagesRef.value && e.target && chatMessagesRef.value.contains(e.target as Node)) {
    e.stopPropagation()
  }
}
const handleTouchMove = (e: TouchEvent) => {
  if (chatMessagesRef.value && e.target && chatMessagesRef.value.contains(e.target as Node)) {
    e.stopPropagation()
  }
}

onMounted(() => {
  if (chatMessagesRef.value) {
    chatMessagesRef.value.addEventListener('wheel', handleWheel, { passive: false })
    chatMessagesRef.value.addEventListener('touchstart', handleTouchStart, { passive: false })
    chatMessagesRef.value.addEventListener('touchmove', handleTouchMove, { passive: false })
  }
})
onBeforeUnmount(() => {
  if (chatMessagesRef.value) {
    chatMessagesRef.value.removeEventListener('wheel', handleWheel)
    chatMessagesRef.value.removeEventListener('touchstart', handleTouchStart)
    chatMessagesRef.value.removeEventListener('touchmove', handleTouchMove)
  }
  console.log('Chat component unmounting')
  wsClose()
})

const initializeConnection = () => {
  connectionError.value = ''
  return loadUserInfo()
    .then(() => loadChatHistory())
    .then(() => connectWebSocket())
    .catch(error => {
      console.error('연결 초기화 중 오류 발생:', error)
      connectionError.value = '연결 중 오류가 발생했습니다'
      emit('connection-error', error)
    })
}

watch(
  () => props.showChat,
  (newVal) => {
    console.log('showChat changed to:', newVal)
    if (newVal) {
      initializeConnection()
    } else {
      wsClose()
    }
  },
  { immediate: true }
)

watch(placeId, (newPlaceId, oldPlaceId) => {
  console.log('placeId changed from', oldPlaceId, 'to', newPlaceId)
  if (props.showChat && newPlaceId && newPlaceId !== oldPlaceId) {
    wsClose()
    initializeConnection()
  }
})
</script>

<template>
  <v-card class="chat-component" flat>
    <!-- 채팅 메시지 영역 -->
    <div
      ref="chatMessagesRef"
      class="chat-messages"
      @mousedown.stop
    >
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

    <!-- 채팅 입력 영역 -->
    <v-card-actions v-show="showInputBox" class="chat-input-area">
      <v-text-field
        v-model="newMessage"
        placeholder="메시지를 입력하세요..."
        variant="outlined"
        density="compact"
        hide-details
        :disabled="!chatInputEnabled"
        @keyup.enter="sendMessage"
        class="chat-input"
      ></v-text-field>

      <v-btn
        color="primary"
        :disabled="!chatInputEnabled"
        @click="sendMessage"
        class="ml-2"
        size="small"
        variant="flat"
      >
        전송
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.chat-component {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  height: 100%;
  border-radius: 0;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background-color: #f9f9f9;
  touch-action: pan-y;
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
  animation: fadeIn 0.2s ease-in-out;
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

.my-message {
  .message-user {
    color: rgb(20, 131, 194); /* primary-color */
  }
}

.chat-input-area {
  padding: 8px 12px;
  border-top: 1px solid #eee;
  background-color: white;
}

.chat-input {
  font-size: 14px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>