// API 기본 URL 설정
const API_BASE_URL = 'http://localhost:8000' // 실제 서버 URL로 변경하세요

export const openaiService = {
  // 메시지 스트리밍 이벤트 소스 생성 함수
  createMessageStream(message: string): EventSource {
    const url = new URL(`${API_BASE_URL}/openai/message`)
    url.searchParams.append('message', message)

    // EventSource를 사용하여 서버-전송 이벤트(SSE) 연결 설정
    return new EventSource(url.toString())
  }
}
