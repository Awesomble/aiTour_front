<!-- CustomBottomSheet.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, defineExpose, computed, watch, defineEmits } from 'vue'
import BottomSheet from '@douxcode/vue-spring-bottom-sheet'
import '@douxcode/vue-spring-bottom-sheet/dist/style.css'
import dayjs from 'dayjs'
import { Calendar, Users, Wallet } from 'lucide-vue-next'

const emit = defineEmits([
  'create'
])

const bottomSheet = ref(null)
const snapPoints = ref<string[] |  number[]>(['90%'])
const expansionPanel = ref<number | null>(0)
const mobiscrollContainer = ref<HTMLDivElement | null>(null)

// 폼 관련 상태
const formRef = ref<HTMLFormElement | null>(null)
const iptRange = ref<string | null>(null)
const iptAmount = ref<number | null>(null)
const iptAdults = ref<number>(1)
const iptChildren = ref<number>(0)
const iptInfants = ref<number>(0)
const iptPrompt = ref<string>('')
const selectedActivities = ref<string[]>([])
const activityOptions = [
  { label: '관광', icon: 'mdi-camera' },
  { label: '휴식', icon: 'mdi-beach' },
  { label: '먹방', icon: 'mdi-food' },
  { label: '쇼핑', icon: 'mdi-shopping' },
  { label: '자연', icon: 'mdi-tree' },
  { label: '박물관', icon: 'mdi-bank' }
]
let mobiInstance = ref<any>(null)

const rules = ref({
  required: (value: string) => !!value || 'Required.'
})

// 여행객 수 요약 텍스트
const travelersText = computed(() => {
  const parts = []
  if (iptAdults.value) parts.push(`성인 ${iptAdults.value}`)
  if (iptChildren.value) parts.push(`어린이 ${iptChildren.value}`)
  if (iptInfants.value) parts.push(`유아 ${iptInfants.value}`)
  return parts.length ? parts.join(', ') : '여행객 수'
})

// 금액 표시 텍스트
const amountText = computed(() => {
  return iptAmount.value ? `$${Number(iptAmount.value).toLocaleString()}` : '여행 예산'
})

// expansionPanel 변경 감지
watch(expansionPanel, async (newValue) => {
  if (Number(newValue) === 0) {
    await nextTick()
    initializeMobiscroll()
  }
})

const open = async () => {
  if (!bottomSheet.value) return
  bottomSheet.value.open()
  await nextTick()

  if (expansionPanel.value === 0) {
    initializeMobiscroll()
  }
}

const close = () => {
  bottomSheet.value?.close()
}

const clearCall = () => {
  if (mobiInstance.value) {
    mobiInstance.value.setVal(null)
    iptRange.value = null
  }
  iptAdults.value = 1
  iptChildren.value = 0
  iptInfants.value = 0
  iptAmount.value = null
  iptPrompt.value = ''
  expansionPanel.value = 0
}

const createCall = async () => {
  const { valid } = await formRef.value?.validate()
  if (!valid) return

  console.log('Travel data:', {
    range: iptRange.value,
    amount: iptAmount.value,
    adults: iptAdults.value,
    children: iptChildren.value,
    infants: iptInfants.value,
    prompt: iptPrompt.value
  })
  emit('create', {
    range: iptRange.value,
    amount: iptAmount.value,
    adults: iptAdults.value,
    children: iptChildren.value,
    infants: iptInfants.value,
    prompt: iptPrompt.value
  })
  close()
}

const initializeMobiscroll = () => {
  if (mobiInstance.value) {
    mobiInstance.value.destroy()
    mobiInstance.value = null
  }

  const inputElement = document.querySelector('#dateInput')
  if (inputElement && window.mobiscroll) {
    mobiInstance.value = window.mobiscroll.datepicker(inputElement, {
      controls: ['calendar'],
      showRangeLabels: false,
      select: 'range',
      display: 'inline',
      touchUi: true,
      theme: 'ios',
      min: dayjs().format('YYYY-MM-DD'),
      showOnClick: false,
      showOnFocus: false,
      maxRange: 7,
      onChange: function (args: any) {
        iptRange.value = args?.valueText
        if (args?.value?.[0] && args?.value?.[1]) {
          expansionPanel.value = 1
        }
      }
    })

    // 초기화 후 값 설정
    if (iptRange.value && mobiInstance.value) {
      try {
        const dates = iptRange.value.split(' - ')
        if (dates.length === 2) {
          mobiInstance.value.setVal([new Date(dates[0]), new Date(dates[1])])
        }
      } catch (error) {
        console.error('Error setting mobiscroll value:', error)
      }
    }
  }
}

// 여행객 패널에서 다음으로 이동
const handleTravelersComplete = () => {
  expansionPanel.value = 2
}

// 예산 입력 시 패널 닫기
const handleAmountInput = () => {
  if (iptAmount.value) {
    expansionPanel.value = null
  }
}

const addAmount = (value: number) => {
  iptAmount.value = (iptAmount.value || 0) + value
}

const addActivity = (activity: string) => {
  if (!iptPrompt.value.includes(activity)) {
    iptPrompt.value += iptPrompt.value ? `, ${activity}` : activity
  }
}

const selectActivity = (activity: string) => {
  const index = selectedActivities.value.indexOf(activity)
  if (index === -1) {
    selectedActivities.value.push(activity)
    addActivity(activity)
  } else {
    selectedActivities.value.splice(index, 1)
    // 프롬프트에서 해당 활동 제거 로직은 복잡하므로 생략
  }
}
onUnmounted(() => {
  if (mobiInstance.value) {
    mobiInstance.value.destroy()
    mobiInstance.value = null
  }
})

defineExpose({
  open,
  close
})
</script>

<template>
  <BottomSheet
    ref="bottomSheet"
    :blocking="true"
    :can-swipe-close="true"
    :can-backdrop-close="false"
    :expand-on-content-drag="true"
    :snap-points="snapPoints"
  >
    <template #header>
      <h3 class="py-2">📍 Seoul Travel Data Entry</h3>
    </template>
    <div class="bottom-sheet-wrapper">
      <div class="content-area">
        <v-form ref="formRef">
          <v-expansion-panels v-model="expansionPanel">
            <!-- 날짜 선택 패널 -->
            <v-expansion-panel value="0">
              <v-expansion-panel-title>
                <div class="d-flex align-center">
                  <Calendar :size="20" class="mr-3" />
                  <span v-if="!iptRange" class="text-subtitle-1 text-grey">여행 날짜</span>
                  <span v-else class="text-subtitle-1 font-weight-medium">{{ iptRange }}</span>
                </div>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <div ref="mobiscrollContainer">
                  <input
                    id="dateInput"
                    style="position: absolute; visibility: hidden;"
                  />
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <!-- 여행객 선택 패널 -->
            <v-expansion-panel value="1">
              <v-expansion-panel-title>
                <div class="d-flex align-center">
                  <Users :size="20" class="mr-3" />
                  <span v-if="iptAdults === 1 && iptChildren === 0 && iptInfants === 0" class="text-subtitle-1 text-grey">여행객 수</span>
                  <span v-else class="text-subtitle-1 font-weight-medium">{{ travelersText }}</span>
                </div>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-row dense>
                  <v-col cols="4">
                    <span class="text-subtitle-1 font-weight-medium">성인</span>
                    <div class="text-caption text-grey">13세 이상</div>
                  </v-col>
                  <v-col cols="8" class="d-flex align-center justify-end">
                    <v-btn
                      icon
                      size="small"
                      @click="iptAdults--"
                      :disabled="iptAdults === 1"
                      variant="outlined"
                    >
                      <v-icon>mdi-minus</v-icon>
                    </v-btn>
                    <span class="mx-3 text-h6">{{ iptAdults }}</span>
                    <v-btn
                      icon
                      size="small"
                      @click="iptAdults++"
                      variant="outlined"
                      :disabled="iptAdults >= 4"
                    >
                      <v-icon>mdi-plus</v-icon>
                    </v-btn>
                  </v-col>
                </v-row>

                <v-divider class="my-3" />

                <v-row dense>
                  <v-col cols="4">
                    <span class="text-subtitle-1 font-weight-medium">어린이</span>
                    <div class="text-caption text-grey">2~12세</div>
                  </v-col>
                  <v-col cols="8" class="d-flex align-center justify-end">
                    <v-btn
                      icon
                      size="small"
                      @click="iptChildren--"
                      :disabled="iptChildren === 0"
                      variant="outlined"
                    >
                      <v-icon>mdi-minus</v-icon>
                    </v-btn>
                    <span class="mx-3 text-h6">{{ iptChildren }}</span>
                    <v-btn
                      icon
                      size="small"
                      @click="iptChildren++"
                      variant="outlined"
                      :disabled="iptChildren >= 4"
                    >
                      <v-icon>mdi-plus</v-icon>
                    </v-btn>
                  </v-col>
                </v-row>

                <v-divider class="my-3" />

                <v-row dense>
                  <v-col cols="4">
                    <span class="text-subtitle-1 font-weight-medium">유아</span>
                    <div class="text-caption text-grey">2세 미만</div>
                  </v-col>
                  <v-col cols="8" class="d-flex align-center justify-end">
                    <v-btn
                      icon
                      size="small"
                      @click="iptInfants--"
                      :disabled="iptInfants === 0"
                      variant="outlined"
                    >
                      <v-icon>mdi-minus</v-icon>
                    </v-btn>
                    <span class="mx-3 text-h6">{{ iptInfants }}</span>
                    <v-btn
                      icon
                      size="small"
                      @click="iptInfants++"
                      variant="outlined"
                      :disabled="iptInfants >= 4"
                    >
                      <v-icon>mdi-plus</v-icon>
                    </v-btn>
                  </v-col>
                </v-row>

                <v-btn
                  color="primary"
                  variant="flat"
                  block
                  class="mt-6"
                  @click="handleTravelersComplete"
                >
                  확인
                </v-btn>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <!-- 예산 패널 -->
            <v-expansion-panel value="2">
              <v-expansion-panel-title>
                <div class="d-flex align-center">
                  <Wallet :size="20" class="mr-3" />
                  <span v-if="!iptAmount" class="text-subtitle-1 text-grey">여행 예산</span>
                  <span v-else class="text-subtitle-1 font-weight-medium">{{ amountText }}</span>
                </div>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-text-field
                  variant="outlined"
                  prefix="$"
                  :rules="[rules.required]"
                  v-model="iptAmount"
                  clearable
                  type="tel"
                  @keyup.enter="handleAmountInput"
                  @blur="handleAmountInput"
                  hide-details
                  placeholder="Enter the total travel cost"
                />

                <div class="mt-4">
                  <v-row dense>
                    <v-col v-for="value in [10, 50, 100, 1000]" :key="value" cols="3">
                      <v-btn
                        variant="tonal"
                        color="primary"
                        rounded="lg"
                        block
                        size="small"
                        @click="addAmount(value)"
                      >
                        +${{ value }}
                      </v-btn>
                    </v-col>
                  </v-row>
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <!-- 여행 프롬프트 패널 추가 -->

            <v-expansion-panel value="3">
              <v-expansion-panel-title>
                <div class="d-flex align-center">
                  <v-icon size="20" class="mr-3">mdi-text-box-outline</v-icon>
                  <span class="text-subtitle-1 text-grey">여행 스타일</span>
                </div>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <div class="chips-wrap-container">

                  <v-responsive class="overflow-y-auto" max-height="280">
                    <v-chip-group v-model="selectedActivities" multiple column>
                      <v-chip
                        v-for="activity in activityOptions"
                        :key="activity.label"
                        filter
                        variant="outlined"
                        size="small"
                        class="mb-2 mr-1"
                        @click="selectActivity(activity.label)"
                      >
                        <v-icon start size="16">{{ activity.icon }}</v-icon>
                        {{ activity.label }}
                      </v-chip>
                    </v-chip-group>
                  </v-responsive>
                </div>

                <v-textarea
                  v-model="iptPrompt"
                  variant="outlined"
                  label="여행 스타일 및 선호도를 입력해주세요"
                  hide-details
                  rows="3"
                  placeholder="예: 자연 풍경 위주의 여유로운 여행, 현지 맛집 탐방 등"
                  class="mt-2"
                ></v-textarea>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-form>
      </div>

      <div class="fixed-bottom">
        <v-btn rounded="lg" elevation="0" @click="close">닫기</v-btn>
        <v-btn
          color="blue-darken-2"
          variant="elevated"
          rounded="lg"
          elevation="1"
          class="w-75"
          size="large"
          @click="createCall"
        >
          <v-icon left class="mr-2">mdi-robot-excited</v-icon>
          AI 일정 생성
        </v-btn>
      </div>
    </div>
  </BottomSheet>
</template>

<style scoped lang="scss">
.bottom-sheet-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px 0 60px;
  .content-area {
    flex: 1;
    overflow-y: auto;
  }
}

.fixed-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px;
  padding-bottom: calc(10px + var(--nav-bar-height));
  background: white;
  box-sizing: border-box;
  border-top: 1px solid rgba(0,0,0,0.08);
  z-index: 1;
  gap: 10px;
}
</style>