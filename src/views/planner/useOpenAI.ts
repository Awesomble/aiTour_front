import { ref } from 'vue'
import { openaiService } from './openaiService'

export interface StreamData {
  jsonData: any[]
}

// 이벤트 유형 정의
export type StreamEventType = 'start' | 'data' | 'end' | 'error'

export function useOpenAI() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const streamData = ref<StreamData>({ jsonData: [] })

  // 이벤트 관련 설정
  const eventTarget = new EventTarget()

  // 이벤트 리스너 등록
  const on = (event: StreamEventType, callback: EventListener) => {
    eventTarget.addEventListener(event, callback)
    return () => eventTarget.removeEventListener(event, callback)
  }

  // 이벤트 발생
  const emit = (event: StreamEventType, detail?: any) => {
    eventTarget.dispatchEvent(new CustomEvent(event, { detail }))
  }

  const sendMessage = async (messageText: string) => {
    try {
      isLoading.value = true
      error.value = null
      streamData.value = { jsonData: [] }

      // 스트림 시작 이벤트 발생
      emit('start')

      const eventSource = openaiService.createMessageStream(messageText)

      // 메시지 이벤트 핸들러
      eventSource.onmessage = (event) => {
        if (event.data === 'done') {
          isLoading.value = false
          eventSource.close()
          emit('end')
          return
        }

        try {
          const data = JSON.parse(event.data)

          if (data.object) {
            // 중복 방지를 위해 place_id 기반으로 확인
            const exists = streamData.value.jsonData.some(
              (item) => item.place_id === data.object.place_id
            )

            if (!exists) {
              streamData.value.jsonData.push(data.object)
              // 데이터 추가 이벤트 발생
              emit('data', data.object)
            }
          } else if (data.error) {
            error.value = data.error
            emit('error', data.error)
          }
        } catch (err) {
          console.error('응답 처리 중 오류:', err)
          error.value = '응답 데이터 파싱 중 오류가 발생했습니다.'
          emit('error', error.value)
        }
      }

      eventSource.onerror = (err) => {
        // 연결 종료된 경우는 에러로 처리하지 않음 (이미 done으로 처리됨)
        if (eventSource.readyState === EventSource.CLOSED) {
          return
        }

        error.value = '스트림 처리 중 오류가 발생했습니다.'
        isLoading.value = false
        eventSource.close()
        emit('error', error.value)
      }

      return eventSource
    } catch (err) {
      error.value = '메시지를 전송하는 중 오류가 발생했습니다.'
      isLoading.value = false
      emit('error', error.value)
      return null
    }
  }

  // 스트림 데이터 초기화
  const resetStream = () => {
    streamData.value = { jsonData: [] }
  }

  return {
    isLoading,
    error,
    streamData,
    sendMessage,
    resetStream,
    on  // 이벤트 리스너 등록 메서드 제공
  }
}