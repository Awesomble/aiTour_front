<script setup lang="ts">
import { onActivated, onBeforeMount, onBeforeUnmount, onMounted, ref } from 'vue'
import MyPlanDialog from '@/components/dialogs/MyPlan.vue'
import dayjs from 'dayjs'

defineOptions({
  name: 'tour-planner'
})

const API_BASE_URL = import.meta.env?.VITE_APP_URL
const planContainer = ref<HTMLDivElement | null>(null)
const threadId = ref<string | null>(null)
const responses = ref<{ id: number; content: string }[]>([])
const responsesContent = ref<any>('')
const iptPlan = ref<any | null>(null)
const myPlanDialog = ref<boolean>(false)
const dateList = ref<string[]>([])
const selectedDate = ref<number | null>(null)
const loading = ref<boolean>(false)
// 스레드 생성 함수
const createThread = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/openai/create_thread`, {
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

const realData = ref<object[]>([])
let buffer = ''
const sendMessage = async () => {
  if (!threadId.value || !iptPlan.value) {
    console.error('Thread ID or message is missing')
    return
  }
  try {
    responsesContent.value = ''
    loading.value = true
    const eventSource = new EventSource(
      `${API_BASE_URL}/openai/message?thread_id=${threadId.value}&message=${encodeURIComponent(
        `여행가간: ${iptPlan.value.range} 여행총비용: ${
          Number(iptPlan.value.amount?.replace(/,/g, '')) * 1440
        }원 여행자수는 어른: ${iptPlan.value.adults} 어린이: ${iptPlan.value.children} 아기: ${
          iptPlan.value.infants
        } 정보를 기준으로 서울 여행 코스를 json 형식으로 만들어 주세요.`
      )}`
    )

    // 서버에서 오는 데이터 수신
    eventSource.onmessage = (event) => {
      const content = event.data
      buffer += content // 스트림 데이터 추가

      // 버퍼에서 JSON 객체를 하나씩 추출
      while (buffer.includes('{') && buffer.includes('}')) {
        const startIdx = buffer.indexOf('{')
        const endIdx = buffer.indexOf('}', startIdx)

        // JSON 객체가 완성되지 않았으면 루프 종료
        if (startIdx === -1 || endIdx === -1) break

        const jsonChunk = buffer.substring(startIdx, endIdx + 1) // JSON 객체 추출
        try {
          const parsedObject = JSON.parse(jsonChunk) // JSON 파싱

          // 유효한 JSON 객체인지 확인 후 저장
          if (parsedObject.category && parsedObject.place_id && parsedObject.name) {
            realData.value.push(parsedObject) // 데이터 저장
            console.log('Added to realData:', parsedObject)
          } else {
            console.error('Invalid JSON structure:', jsonChunk)
          }
        } catch (error) {
          console.warn('Error parsing JSON chunk:', error.message, jsonChunk)
        }

        // 처리된 데이터는 버퍼에서 제거
        buffer = buffer.substring(endIdx + 1)
      }

      responsesContent.value += content
      responses.value.push({
        id: responses.value.length + 1,
        content
      })
      loading.value = false
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
// 메시지 전송 및 응답 수신 함수
const reSearch = async (id: string) => {
  if (!threadId.value || !id) {
    console.error('Thread ID or message is missing')
    return
  }

  try {
    // 특정 id의 요소를 찾음
    const targetElement = document.getElementById(id)
    if (!targetElement) {
      console.error(`Element with id "${id}" not found`)
      return
    }
    targetElement.innerHTML = ''
    // 서버와 EventSource 연결
    const eventSource = new EventSource(
      `${API_BASE_URL}/openai/research?thread_id=${threadId.value}&message=${encodeURIComponent(
        `${targetElement.innerHTML} 다른 데이터로 교체해줘`
      )}`
    )

    // 서버에서 오는 데이터 수신
    eventSource.onmessage = (event) => {
      const content = event.data

      // 기존 콘텐츠에 스트리밍 데이터 누적
      targetElement.innerHTML += content

      // responses 배열에 데이터 추가
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
const updatePlanCall = (plan: string) => {
  iptPlan.value = plan
  if (iptPlan.value?.range) {
    const [startDateStr, endDateStr] = iptPlan.value?.range.split(' - ')

    // dayjs로 파싱
    const startDate = dayjs(startDateStr, 'MM/DD/YYYY')
    const endDate = dayjs(endDateStr, 'MM/DD/YYYY')
    dateList.value = generateDateList(startDate, endDate)
    selectedDate.value = 1
    sendMessage()
  }
}

const generateDateList = (start: any, end: any) => {
  const dateList = []
  let current = start
  while (current.isBefore(end) || current.isSame(end)) {
    dateList.push(current.format('YYYY-MM-DD')) // 원하는 포맷으로 변경 가능
    current = current.add(1, 'day') // 하루씩 추가
  }
  return dateList
}

const checkThread = async () => {
  const newThreadId = localStorage.threadId
  if (newThreadId) threadId.value = newThreadId
  else await createThread()
}
onActivated( async () => {
  // await checkThread()
  // if (!iptPlan.value) myPlanDialog.value = true
})
onBeforeMount(async () => {
})
onMounted(() => {
  // if (window?.AndroidBridge) {
  //   // URL 액션 호출
  //   window.AndroidBridge.handleUrlAction("share:https://example.com");
  // } else {
  //   console.error("AndroidBridge is not available");
  // }
})
onBeforeUnmount(() => {})
</script>

<template>
  <v-container class="pa-2">
    개발중
  </v-container>
  <div class="tour-planner" v-if="false">
    <div class="map-section">
<!--      <GMapMap-->
<!--        :center="mapCenter"-->
<!--        :zoom="12"-->
<!--        :options="{ zoomControl: true, mapTypeControl: false }"-->
<!--        style="width: 100%; height: 400px;"-->
<!--      >-->
<!--        &lt;!&ndash; 기존 마커 관련 코드는 유지 &ndash;&gt;-->
<!--      </GMapMap>-->
    </div>

    <!-- 하단 리스트 섹션 -->
    <div class="list-section" v-if="false">
      <v-slide-x-reverse-transition group>
        <v-container>
          <v-row v-if="!iptPlan" class="d-flex justify-center align-center fill-height">
            <v-card class="text-center pa-4 mt-14 elevation-1" max-width="350" color="white">
              <div class="image-stack">
                <v-img src="https://picsum.photos/500/300?image=234" class="stacked-image bottom" />
              </div>
              <v-card-text class="mt-6">
                <h3 class="font-weight-bold">When if not <span class="text-primary">today?</span></h3>
                <p>It's time to start a new adventure</p>
                <v-divider class="pt-6" />
                <v-btn block color="primary" class="ma-auto" @click="myPlanDialog = true">
                  Create your first trip
                </v-btn>
              </v-card-text>
            </v-card>
          </v-row>
          <template v-else>
            <v-row>
              <v-col cols="12" class="d-flex justify-center ga-2">
                <v-chip-group column>
                  <v-chip v-if="iptPlan?.range" prepend-icon="mdi-calendar-range" variant="elevated">{{
                    iptPlan.range
                  }}</v-chip>
                  <v-chip
                    v-if="iptPlan?.amount"
                    color="primary"
                    prepend-icon="mdi-currency-krw"
                    variant="elevated"
                    >{{
                      String(Number(iptPlan.amount.replace(/,/g, '')) * 1440).toLocaleString()
                    }}</v-chip
                  >
                  <v-chip
                    v-if="iptPlan?.adults"
                    color="secondary"
                    prepend-icon="mdi-human-male-female"
                    variant="elevated"
                    >{{ iptPlan?.adults }}</v-chip
                  >
                  <v-chip
                    v-if="iptPlan?.children"
                    color="success"
                    prepend-icon="mdi-human-male-female-child"
                    variant="elevated"
                    >{{ iptPlan?.children }}</v-chip
                  >
                  <v-chip
                    v-if="iptPlan?.infants"
                    color="surface"
                    prepend-icon="mdi-baby"
                    variant="elevated"
                    >{{ iptPlan?.infants }}</v-chip
                  >
                </v-chip-group>
              </v-col>
            </v-row>
            <v-row class="justify-center">
              <v-btn-group divided>
                <v-btn
                  v-for="(d, idx) in dateList"
                  :key="idx + d"
                  :color="selectedDate === idx + 1 ? 'primary' : 'white'"
                  :disabled="selectedDate === idx + 1"
                  @click="selectedDate = idx + 1"
                  >{{ dayjs(d).format('dd') }}<br />{{ dayjs(d).format('DD') }}</v-btn
                >
              </v-btn-group>
            </v-row>
            <v-row class="plan-list pb-16">
              <v-col cols="12">
                <v-skeleton-loader
                  v-if="loading"
                  class="mx-auto"
                  elevation="1"
                  color="white"
                  type="article"
                ></v-skeleton-loader>
                <v-slide-x-reverse-transition group>
                  <v-row
                    v-for="(item, index) in realData.filter((itm) => itm.day === `Day ${selectedDate}`)"
                    :key="index"
                    align="start"
                    class="mb-1 align-center plan"
                    :class="{
                      last:
                        index === realData.filter((itm) => itm.day === `Day ${selectedDate}`).length - 1
                    }"
                  >
                    <!-- 좌측 아이콘 -->
                    <v-col cols="2" class="text-center icon-container">
                      <v-avatar class="icon-circle timeline-avatar" color="red lighten-2">
                        <span class="icon-text">{{ item.category.substr(0, 1).toUpperCase() }}</span>
                      </v-avatar>
                    </v-col>

                    <!-- 우측 컨텐츠 -->
                    <v-col cols="10">
                      <v-card class="content-card" color="white">
                        <v-card-title class="d-flex justify-space-between">
                          <span class="title-text">{{ item.name }}</span>
                          <span class="category-text">{{ item.category }}</span>
                        </v-card-title>
                        <v-card-subtitle class="subtitle-text">
                          {{ item.description }}
                        </v-card-subtitle>
                        <v-card-actions>
                          <v-btn text color="orange">VIEW DETAILS</v-btn>
                        </v-card-actions>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-slide-x-reverse-transition>
              </v-col>
            </v-row>
            <v-row v-if="false">
              <v-col>
                <div ref="planContainer" v-html="responsesContent" />
              </v-col>
            </v-row>
          </template>
        </v-container>
      </v-slide-x-reverse-transition>
    </div>
  </div>
  <v-btn class="btn-floating" icon="mdi-airplane" color="primary" @click="myPlanDialog = true" />
<!--  <MyPlanDialog :is-show="myPlanDialog" @close="myPlanDialog = false" @update="updatePlanCall" />-->
</template>

<style lang="scss">
.tour-planner {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.map-section {
  flex: 0 0 400px; /* 맵 섹션의 높이를 400px로 고정 */
}

.list-section {
  flex: 1;
  overflow-y: auto; /* 리스트가 길어질 경우 스크롤 가능하도록 설정 */
  padding: 20px;
}

.btn-floating {
  position: fixed;
  right: 10px;
  bottom: 80px;
  z-index: 99;
}

/* 아이콘 컨테이너 스타일 */
.icon-container {
  display: flex;
  justify-content: center;
  position: relative;
  .timeline-avatar {
    font-weight: bold;
    color: white;
    width: 50px;
    height: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: unset;
    z-index: 1;
    &::after {
      content: '';
      position: absolute;
      width: 1px;
      background-color: #ccc;
      left: 50%;
      top: 50px;
      height: 0;
      z-index: -1;
      transform: translateX(-50%);
      animation: growHeight 0.3s ease-in-out 0.3s forwards;
    }
  }
}
@keyframes growHeight {
  from {
    height: 0; /* 초기 높이 */
  }
  to {
    height: 130px; /* 최종 높이 */
  }
}
.plan-list .plan.last .icon-container .timeline-avatar::after {
  display: none !important;
}
</style>
