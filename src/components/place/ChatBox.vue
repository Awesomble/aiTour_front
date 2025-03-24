<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { getChatMessagesAPI, getMeAPI } from '@/network/app'
import { useUserStore } from '@/store'
import { useWebSocket } from '@vueuse/core'
import { getInitials } from '@/plugins/utils'

// 메시지 인터페이스 정의
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

// User Store 초기화
const userStore = useUserStore()

// 컴포넌트 Props 정의
const props = defineProps({
  loading: { type: Boolean, default: true },
  detail: { type: Object, default: () => ({}) },
  showChat: { type: Boolean, default: false },
  heightState: { type: String, default: 'min' },
})

// 이벤트 정의
const emit = defineEmits(['system-message', 'update-participant-count'])

// Chat 관련 상태
const chatMessages = ref<ChatMessage[]>([])
const newMessage = ref('')
const isLoading = ref(true)
const chatInputEnabled = ref(false)
const currentUser = ref({ sub: '', user_name: '방문자' })
const chatMessagesRef = ref<HTMLElement | null>(null)
const participantCount = ref(0)

// 장소 ID 계산
const placeId = computed(() => props.detail?.place_id || '')
const showInputBox = computed(() => props.heightState !== 'min')
// WebSocket URL 구성
const wsUrl = computed(() => {
  const token = userStore.userInfo?.accessToken || ''
  return `ws://localhost:8000/chat/ws/${placeId.value}?token=${token}`
})

// useWebSocket hook
const {
  status,
  send: wsSend,
  open: wsOpen,
  close: wsClose
} = useWebSocket(wsUrl, {
  autoReconnect: false,
  immediate: false,
  onConnected: () => {
    console.log('WebSocket 연결됨')
    chatInputEnabled.value = true
  },
  onDisconnected: (e) => {
    console.log('WebSocket 연결 종료:', e)
    chatInputEnabled.value = false
  },
  onMessage: (ws, event) => {
    try {
      const data = JSON.parse(event.data)
      if (data.type === 'heartbeat') {
        console.log('서버 하트비트 수신, 응답 전송')
        wsSend(JSON.stringify({ type: 'heartbeat_response' }))
      } else if (data.type === 'connection_status' || data.type === 'auth_status') {
        // 연결 상태 메시지 처리
        console.log('Connection status:', data)
      } else if (data.message_type === 'system') {
        // 시스템 메시지 처리
        emit('update-participant-count', data.content)

        // 참가자 수 업데이트 확인
        // const participantMatch = data.content.match(/현재 (\d+)명이 참여/)
        // if (participantMatch && participantMatch[1]) {
        //   participantCount.value = parseInt(participantMatch[1])
        //   emit('update-participant-count', participantCount.value)
        // }

        // 입장/퇴장 메시지 처리
        // if (data.content.includes('입장') || data.content.includes('퇴장')) {
        //   console.log('사용자 입장/퇴장:', data.content)
        // }
      } else {
        // 일반 메시지 추가
        chatMessages.value.push(data)
        scrollToBottom()
      }
    } catch (e) {
      console.error('메시지 처리 오류:', e)
    }
  }
})

// WebSocket 연결 상태
const isConnected = computed(() => status.value === 'OPEN')

// 연결 시도
const connectWebSocket = () => {
  if (!placeId.value) {
    console.warn('place_id가 없어 WebSocket 연결을 시도하지 않습니다.')
    return
  }
  wsOpen()
}

// 채팅 기록 로드
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

    // 시스템 메시지 확인 (참가자 수 추출)
    const systemMessages = response.data.filter((msg: ChatMessage) => msg.message_type === 'system')
    for (const msg of systemMessages) {
      const participantMatch = msg.content.match(/현재 (\d+)명이 참여/)
      if (participantMatch && participantMatch[1]) {
        participantCount.value = parseInt(participantMatch[1])
        emit('update-participant-count', participantCount.value)
        break // 가장 최근 참가자 수 정보 사용
      }
    }

    // 일반 메시지만 필터링
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

// 사용자 정보 로드
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
  }
}

// 메시지 전송
const sendMessage = () => {
  if (!newMessage.value.trim()) {
    return
  }

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

// 스크롤을 최신 메시지 위치로
const scrollToBottom = () => {
  setTimeout(() => {
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
    }
  }, 50)
}

// 스크롤 이벤트 처리 함수
const handleWheel = (e: WheelEvent) => {
  // 이벤트 전파 중지 (부모의 드래그 핸들링 방지)
  e.stopPropagation()
}

const handleTouchStart = (e: TouchEvent) => {
  // 스크롤 영역 내에서만 이벤트 캡처
  if (chatMessagesRef.value && e.target && chatMessagesRef.value.contains(e.target as Node)) {
    e.stopPropagation()
  }
}

const handleTouchMove = (e: TouchEvent) => {
  // 스크롤 영역 내에서만 이벤트 캡처
  if (chatMessagesRef.value && e.target && chatMessagesRef.value.contains(e.target as Node)) {
    e.stopPropagation()
  }
}

// 이벤트 리스너 등록/제거
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

// showChat 변화에 따라 WebSocket 연결 관리
watch(
  () => props.showChat,
  (newVal) => {
    console.log('showChat changed to:', newVal)
    if (newVal) {
      loadUserInfo().then(() => {
        loadChatHistory().then(() => {
          connectWebSocket()
        })
      })
    } else {
      wsClose()
    }
  },
  { immediate: true }
)

// placeId 변화 시 재연결
watch(placeId, (newPlaceId, oldPlaceId) => {
  console.log('placeId changed from', oldPlaceId, 'to', newPlaceId)
  if (props.showChat && newPlaceId && newPlaceId !== oldPlaceId) {
    loadChatHistory().then(() => {
      wsClose()
      connectWebSocket()
    })
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

.empty-messages {
  display: flex;
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