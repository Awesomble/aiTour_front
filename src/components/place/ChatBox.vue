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

// 모바일 브라우저 최적화를 위한 추가 상태
const isKeyboardVisible = ref(false)
const keyboardHeight = ref(0)
const initialViewportHeight = ref(0)
const isIOS = ref(false)
const chatInputRef = ref<HTMLElement | null>(null)

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
  autoReconnect: false, // 자동 재연결 비활성화
  immediate: false,
  onConnected: () => {
    console.log('WebSocket 연결됨')
    chatInputEnabled.value = true
    connectionError.value = ''
  },
  onDisconnected: (e) => {
    console.log('WebSocket 연결 종료:', e)
    chatInputEnabled.value = false
    connectionError.value = '채팅 서버에 연결할 수 없습니다. 다시 시도해 주세요.'
    emit('connection-error', '연결 종료')
  },
  onError: (ws, event) => {
    console.error('WebSocket 오류 발생:', event)
    connectionError.value = '연결 오류가 발생했습니다'
    emit('connection-error', event)
    chatInputEnabled.value = false // 입력 비활성화
  }
})

const isConnected = computed(() => status.value === 'OPEN')

// 브라우저 환경 감지
onMounted(() => {
  isIOS.value = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

  if (window.visualViewport) {
    initialViewportHeight.value = window.visualViewport.height
  } else {
    initialViewportHeight.value = window.innerHeight
  }
})

// 향상된 키보드 감지 함수
const detectKeyboard = () => {
  if (!window.visualViewport) return

  const viewportHeight = window.visualViewport.height
  const windowHeight = window.innerHeight

  // 키보드가 올라온 것으로 판단할 임계값 (iOS와 안드로이드 다르게 처리)
  const threshold = isIOS.value ? 100 : 150
  const heightDiff = windowHeight - viewportHeight

  // 이전 상태 저장 (변경 감지용)
  const wasKeyboardVisible = isKeyboardVisible.value

  // 키보드 상태 업데이트
  isKeyboardVisible.value = heightDiff > threshold

  if (isKeyboardVisible.value) {
    keyboardHeight.value = heightDiff

    // 키보드가 방금 표시됐을 때만 처리
    if (!wasKeyboardVisible) {
      console.log('키보드 표시됨, 높이:', keyboardHeight.value)
    }

    // 인풋 영역 위치 조정 (iOS Safari 용)
    if (isIOS.value) {
      adjustInputPosition()
    }

    // 스크롤 위치 조정
    scrollToBottom(true)
  } else if (wasKeyboardVisible) {
    // 키보드가 방금 사라졌을 때 처리
    console.log('키보드 숨겨짐')

    // 인풋 영역 원래 위치로 복원
    if (isIOS.value) {
      resetInputPosition()
    }
  }
}

// 인풋 위치 조정 함수
const adjustInputPosition = () => {
  const chatInputArea = document.querySelector('.chat-input-area') as HTMLElement
  if (chatInputArea) {
    chatInputArea.style.position = 'absolute'
    chatInputArea.style.bottom = `${keyboardHeight.value}px`
    chatInputArea.style.zIndex = '1000'

    // iOS에서 채팅 메시지 영역 패딩 조정
    if (chatMessagesRef.value) {
      chatMessagesRef.value.style.paddingBottom = `${keyboardHeight.value + 60}px`
    }
  }
}

// 인풋 위치 초기화 함수
const resetInputPosition = () => {
  const chatInputArea = document.querySelector('.chat-input-area') as HTMLElement
  if (chatInputArea) {
    chatInputArea.style.position = 'fixed'
    chatInputArea.style.bottom = '0'

    // 채팅 메시지 영역 패딩 원래대로
    if (chatMessagesRef.value) {
      chatMessagesRef.value.style.paddingBottom = '70px'
    }
  }
}

// 향상된 스크롤 함수
const scrollToBottom = (immediate = false) => {
  if (!chatMessagesRef.value) return

  // 즉시 실행
  chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight

  if (immediate) {
    // 여러 시점에 스크롤 적용 (키보드 애니메이션 중에도 스크롤 유지)
    setTimeout(() => {
      if (chatMessagesRef.value) {
        chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
      }
    }, 50)

    setTimeout(() => {
      if (chatMessagesRef.value) {
        chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
      }
    }, 300)
  }
}

// 인풋 포커스 이벤트 핸들러
const handleInputFocus = () => {
  console.log('인풋 포커스 발생')

  // iOS에서는 포커스 직후에 스크롤이 동작하지 않을 수 있으므로
  // 약간의 지연 후 스크롤 실행
  setTimeout(() => {
    scrollToBottom(true)
  }, 100)
}

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

// 개선된 메시지 전송 함수
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
      scrollToBottom(true)
    } else {
      wsSend(JSON.stringify(messageData))
    }
    newMessage.value = ''

    // iOS에서 키보드를 유지하면서 인풋에 포커스 유지
    if (isIOS.value && isKeyboardVisible.value) {
      const inputElement = chatInputRef.value?.querySelector('input')
      if (inputElement) {
        setTimeout(() => {
          inputElement.focus()
        }, 10)
      }
    }
  } catch (error) {
    console.error('메시지 전송 중 오류가 발생했습니다:', error)
  }
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
  // VisualViewport API 사용
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', detectKeyboard)
    window.visualViewport.addEventListener('scroll', detectKeyboard)
  } else {
    // 대체 방안: resize 이벤트 사용
    window.addEventListener('resize', detectKeyboard)
  }

  // 스크롤 관련 이벤트 리스너
  if (chatMessagesRef.value) {
    chatMessagesRef.value.addEventListener('wheel', handleWheel, { passive: false })
    chatMessagesRef.value.addEventListener('touchstart', handleTouchStart, { passive: false })
    chatMessagesRef.value.addEventListener('touchmove', handleTouchMove, { passive: false })
  }

  // 인풋 관련 이벤트 리스너
  setTimeout(() => {
    const inputElement = chatInputRef.value?.querySelector('input')
    if (inputElement) {
      inputElement.addEventListener('focus', handleInputFocus)
      inputElement.addEventListener('click', handleInputFocus)
    }
  }, 500)
})

onBeforeUnmount(() => {
  // 이벤트 리스너 제거
  if (window.visualViewport) {
    window.visualViewport.removeEventListener('resize', detectKeyboard)
    window.visualViewport.removeEventListener('scroll', detectKeyboard)
  } else {
    window.removeEventListener('resize', detectKeyboard)
  }

  if (chatMessagesRef.value) {
    chatMessagesRef.value.removeEventListener('wheel', handleWheel)
    chatMessagesRef.value.removeEventListener('touchstart', handleTouchStart)
    chatMessagesRef.value.removeEventListener('touchmove', handleTouchMove)
  }

  const inputElement = chatInputRef.value?.querySelector('input')
  if (inputElement) {
    inputElement.removeEventListener('focus', handleInputFocus)
    inputElement.removeEventListener('click', handleInputFocus)
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
  [() => props.showChat, placeId],
  ([newShowChat, newPlaceId], [oldShowChat, oldPlaceId]) => {
    console.log('상태 변경:', { showChat: newShowChat, placeId: newPlaceId })

    // 기존 연결 종료
    if (isConnected.value) {
      console.log('기존 WebSocket 연결 종료')
      wsClose()
    }

    // 새 연결 시작 (조건 만족 시에만)
    if (newShowChat && newPlaceId) {
      console.log('새 WebSocket 연결 시작')
      initializeConnection()
    }
  },
  { immediate: true }
)

watch(data, (newData) => {
  if (newData) {
    console.log('WebSocket 메시지 수신:', newData)
    try {
      const message = JSON.parse(newData)

      // 시스템 메시지 처리
      if (message.message_type === 'system') {
        emit('update-participant-count', message.content)
        return
      }

      // 중복 메시지 필터링
      const isDuplicate = chatMessages.value.some(
        msg => msg.message_id === message.message_id
      )

      if (!isDuplicate && message.message_id && message.content) {
        chatMessages.value.push(message)
        scrollToBottom()
      }
    } catch (e) {
      console.error('WebSocket 메시지 파싱 오류:', e)
    }
  }
})
</script>

<template>
  <v-card
    class="chat-component"
    :class="{ 'keyboard-visible': isKeyboardVisible }"
    flat
  >
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
    <v-card-actions
      v-show="showInputBox"
      class="chat-input-area"
      ref="chatInputRef"
    >
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
        :autofocus="false"
        :rules="[]"
        :counter="false"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
        inputmode="text"
      />

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
/* 채팅 컴포넌트 CSS 최적화 */
.chat-component {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  height: 100%;
  border-radius: 0;
  position: relative;
  /* iOS 최적화 */
  -webkit-tap-highlight-color: transparent;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background-color: #f9f9f9;

  /* 스크롤 최적화 */
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  touch-action: pan-y;

  /* 키보드 위 공간 확보 */
  padding-bottom: 70px;

  /* 성능 최적화 */
  will-change: scroll-position;
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
}

.chat-input-area {
  padding: 8px 12px;
  border-top: 1px solid #eee;
  background-color: white;

  /* 키보드 위치 처리 */
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;

  /* 하드웨어 가속 */
  transform: translate3d(0,0,0);
  -webkit-transform: translate3d(0,0,0);
  will-change: transform;

  /* 트랜지션 제거로 인한 지연 방지 */
  transition: none;

  /* iOS 노치 영역 대응 */
  padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px));

  /* iOS 사파리 최적화 */
  -webkit-backface-visibility: hidden;
}

/* 입력 필드 최적화 */
.chat-input {
  -webkit-appearance: none;
  appearance: none;
  transform: translateZ(0);
  will-change: transform;

  /* 포커스 시 모바일 스타일 개선 */
  outline-width: 0;
  -webkit-tap-highlight-color: transparent;

  /* 인풋 지연 방지를 위한 성능 최적화 */
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
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

  /* 성능 최적화된 애니메이션 */
  animation: fadeIn 0.2s ease-out;
  will-change: transform, opacity;
  transform: translateZ(0);
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
  color: rgb(20, 131, 194); /* primary-color */
}

/* iOS 사파리 포커스 스타일 개선 */
.chat-input:focus {
  outline: none !important;
  -webkit-appearance: none;
}

/* 키보드가 표시될 때 채팅 메시지 영역 조정 */
.keyboard-visible .chat-messages {
  /* 모바일 사파리에서 키보드가 올라왔을 때 콘텐츠가 가려지지 않도록 패딩 조정 */
  padding-bottom: 120px; /* 키보드 높이에 따라 조정 */
}

/* 애니메이션 최적화 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>