<template>
  <div>
    <button @click="createThread">Create Thread</button>
    <input v-model="message" placeholder="Enter your message" />
    <button @click="sendMessage">Send Message</button>

    <div>
      <h3>Assistant Response:</h3>
      <span v-for="response in responses" :key="response.id">
        {{ response.content }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// 서버 URL 설정
const API_BASE_URL = 'http://3.36.140.131:8000';
// http://3.36.140.131:8000/places
// 상태 관리
const threadId = ref<string | null>(null);
const message = ref<string>('');
const responses = ref<{ id: number; content: string }[]>([]);

// 스레드 생성 함수
async function createThread() {
  try {
    const response = await fetch(`${API_BASE_URL}/create_thread`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    threadId.value = data.thread_id;
    console.log('Thread created:', threadId.value);
  } catch (error) {
    console.error('Error creating thread:', error);
  }
}

// 메시지 전송 및 응답 수신 함수
async function sendMessage() {
  if (!threadId.value || !message.value) {
    console.error('Thread ID or message is missing');
    return;
  }

  try {
    const eventSource = new EventSource(
      `${API_BASE_URL}/message?thread_id=${threadId.value}&message=${encodeURIComponent(message.value)}`
    );

    // 서버에서 오는 데이터 수신
    eventSource.onmessage = (event) => {
      const content = event.data;
      responses.value.push({
        id: responses.value.length + 1,
        content,
      });
    };

    // 에러 처리
    eventSource.onerror = (error) => {
      console.error('Error in EventSource:', error);
      eventSource.close();
    };
  } catch (error) {
    console.error('Error sending message:', error);
  }
}
</script>