<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'


const API_BASE_URL = 'https://aitour-api.awesomble.com/openai'
// const API_BASE_URL = 'http://3.36.140.131:8080/openai'
const threadId = ref<string | null>(null)
const message = ref<string>('')
const responses = ref<{ id: number; content: string }[]>([])
const responsesContent = ref<any>('')

// 스레드 생성 함수
const createThread = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/create_thread`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    const data = await response.json()
    threadId.value = data.thread_id
    localStorage.threadId = threadId.value
    console.log('Thread created:', threadId.value)
  } catch (error) {
    console.error('Error creating thread:', error)
  }
}

// 메시지 전송 및 응답 수신 함수
const sendMessage = async () => {
  if (!threadId.value || !message.value) {
    console.error('Thread ID or message is missing')
    return
  }

  try {
    responsesContent.value = ''
    const eventSource = new EventSource(
      `${API_BASE_URL}/message?thread_id=${threadId.value}&message=${encodeURIComponent(
        message.value
      )}`
    )

    // 서버에서 오는 데이터 수신
    eventSource.onmessage = (event) => {
      const content = event.data
      responsesContent.value += content
      responses.value.push({
        id: responses.value.length + 1,
        content
      })
    }

    // 에러 처리
    eventSource.onerror = (error) => {
      console.error('Error in EventSource:', error)
      eventSource.close()
    }
  } catch (error) {
    console.error('Error sending message:', error)
  }
}
onBeforeMount(() => {
  const newThreadId = localStorage.threadId
  if (newThreadId) threadId.value = newThreadId
  else createThread()
})
</script>

<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-textarea rows="2" v-model="message" placeholder="Enter your message" />
        <v-btn class="ml-4" @click="sendMessage" :disabled="!threadId">Send</v-btn>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <div v-html="responsesContent" />
      </v-col>
    </v-row>
  </v-container>
</template>

<style lang="scss">
// ----------------  THE BASICS

@import url('https://fonts.googleapis.com/css?family=Oswald|Roboto:400,700');

body {
  font-size: 14px;
  line-height: 1.5;
}

// ----------------  THE FONTS

h1,
h2,
h3,
h4,
h5,
h6 {
  font-family: 'Oswald', sans-serif;
}

h1 {
  font-size: 2rem;
  margin-bottom: 0.5em;
}

p {
  font-family: 'Roboto', sans-serif;
  font-size: 0.8rem;
}

// ----------------  LAYOUT

.time-box {
  max-width: 1024px;
  width: 90%;
  margin: 0 auto;
}

// ----------------  THE FONTS

$border-color: rgba(black, 0.3);

.timeline-item {
  padding: 3em 2em 2em;
  position: relative;
  color: rgba(black, 0.7);
  border-left: 2px solid $border-color;

  p {
    font-size: 1rem;
  }

  &::before {
    content: attr(date-is);
    position: absolute;
    left: 2em;
    font-weight: bold;
    top: 1em;
    display: block;
    font-family: 'Roboto', sans-serif;
    font-weight: 700;
    font-size: 0.785rem;
  }

  &::after {
    width: 10px;
    height: 10px;
    display: block;
    top: 1em;
    position: absolute;
    left: -7px;
    border-radius: 10px;
    content: '';
    border: 2px solid $border-color;
    background: white;
  }

  &:last-child {
    border-image: linear-gradient(to bottom, $border-color 60%, rgba($border-color, 0)) 1 100%;
  }
}
/* CSS */
.button-13 {
  background-color: #fff;
  border: 1px solid #d5d9d9;
  border-radius: 8px;
  box-shadow: rgba(213, 217, 217, 0.5) 0 2px 5px 0;
  box-sizing: border-box;
  color: #0f1111;
  cursor: pointer;
  display: inline-block;
  font-family: 'Amazon Ember', sans-serif;
  font-size: 13px;
  line-height: 29px;
  padding: 0 10px 0 11px;
  position: relative;
  text-align: center;
  text-decoration: none;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  vertical-align: middle;
  width: 100px;
}

.button-13:hover {
  background-color: #f7fafa;
}

.button-13:focus {
  border-color: #008296;
  box-shadow: rgba(213, 217, 217, 0.5) 0 2px 5px 0;
  outline: 0;
}
</style>
