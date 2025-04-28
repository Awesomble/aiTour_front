<!-- CustomBottomSheet.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, defineExpose } from 'vue'
import BottomSheet from '@douxcode/vue-spring-bottom-sheet'
import '@douxcode/vue-spring-bottom-sheet/dist/style.css'
import dayjs from 'dayjs'

const bottomSheet = ref(null)
const instinctHeight = ref(250)
const expandOnContentDrag = ref(true)
const windowHeight = ref(0)
const snapPoints = ref<(string | number)[]>([])

// 폼 관련 상태
const formRef = ref<HTMLFormElement | null>(null)
const iptRange = ref<string | null>(null)
const iptAmount = ref<number | null>(null)
const iptAdults = ref<number>(1)
const iptChildren = ref<number>(0)
const iptInfants = ref<number>(0)
const dateInput = ref<HTMLInputElement | null>(null)
let mobiInstance = ref<any>(null)

const rules = ref({
  required: (value: string) => !!value || 'Required.'
})

// 스냅포인트 업데이트
const updateSnapPoints = () => {
  windowHeight.value = window.innerHeight
  snapPoints.value = [
    windowHeight.value * 0.99,
    windowHeight.value * 0.5,
    250,
    instinctHeight.value
  ]
}

// 컴포넌트 마운트시 초기화
onMounted(() => {
  updateSnapPoints()
  window.addEventListener('resize', updateSnapPoints)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateSnapPoints)
  if (mobiInstance.value) {
    mobiInstance.value.destroy()
  }
})

const snapToPoint = (index: number) => {
  bottomSheet.value?.snapToPoint(index)
}

const open = async () => {
  if (!bottomSheet.value) return

  bottomSheet.value.open()
  // 열린 후 기본 스냅포인트로 이동
  setTimeout(() => {
    snapToPoint(1)
  }, 200)

  // Mobiscroll 초기화
  await nextTick()
  initializeMobiscroll()
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
  })

  close()
}

const initializeMobiscroll = () => {
  if (mobiInstance.value) {
    mobiInstance.value.destroy()
  }
  const inputElement = document.querySelector('#dateInput')
  if (inputElement) {
    mobiInstance.value = mobiscroll.datepicker(inputElement, {
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
      }
    })
  } else {
    console.error('Mobiscroll input element not found')
  }
}

defineExpose({
  open,
  close,
  snapToPoint
})
</script>

<template>
  <BottomSheet
    ref="bottomSheet"
    :blocking="true"
    :can-swipe-close="true"
    :can-backdrop-close="false"
    :expand-on-content-drag="expandOnContentDrag"
    :snap-points="snapPoints"
    :default-snap-point="1"
    @instinct-height="updateSnapPoints"
  >
    <div class="bottom-sheet-wrapper">
      <div class="header-area">
        <v-toolbar color="#f8f8f8" dark flat elevation="0">
          <v-btn color="black" icon="mdi-close" @click="close" />
          <v-toolbar-title class="text-black">Your travel plans</v-toolbar-title>
          <v-spacer></v-spacer>
        </v-toolbar>
      </div>

      <div class="content-area">
        <v-form ref="formRef">
          <v-row dense>
            <v-col>
              <input id="dateInput" style="visibility: hidden" />
            </v-col>
          </v-row>

          <v-row class="box pa-4" dense>
            <v-col>
              <v-row dense>
                <v-col cols="4">
                  <span class="text-subtitle-1 font-weight-bold">성인</span>
                  <div class="text-caption">13세 이상</div>
                </v-col>
                <v-col cols="8" class="d-flex align-center justify-end">
                  <v-btn
                    icon
                    size="x-small"
                    @click="iptAdults--"
                    :disabled="iptAdults === 1"
                    variant="outlined"
                  >
                    <v-icon>mdi-minus</v-icon>
                  </v-btn>
                  <span class="mx-2 text-subtitle-1">{{ iptAdults }}</span>
                  <v-btn
                    icon
                    size="x-small"
                    @click="iptAdults++"
                    variant="outlined"
                    :disabled="iptAdults >= 4"
                  >
                    <v-icon>mdi-plus</v-icon>
                  </v-btn>
                </v-col>
              </v-row>

              <v-row dense class="mt-2">
                <v-col cols="4">
                  <span class="text-subtitle-1 font-weight-bold">어린이</span>
                  <div class="text-caption">2~12세</div>
                </v-col>
                <v-col cols="8" class="d-flex align-center justify-end">
                  <v-btn
                    icon
                    size="x-small"
                    @click="iptChildren--"
                    :disabled="iptChildren === 0"
                    variant="outlined"
                  >
                    <v-icon>mdi-minus</v-icon>
                  </v-btn>
                  <span class="mx-2 text-subtitle-1">{{ iptChildren }}</span>
                  <v-btn
                    icon
                    size="x-small"
                    @click="iptChildren++"
                    variant="outlined"
                    :disabled="iptChildren >= 4"
                  >
                    <v-icon>mdi-plus</v-icon>
                  </v-btn>
                </v-col>
              </v-row>

              <v-row dense class="mt-2">
                <v-col cols="4">
                  <span class="text-subtitle-1 font-weight-bold">유아</span>
                  <div class="text-caption">2세 미만</div>
                </v-col>
                <v-col cols="8" class="d-flex align-center justify-end">
                  <v-btn
                    icon
                    size="x-small"
                    @click="iptInfants--"
                    :disabled="iptInfants === 0"
                    variant="outlined"
                  >
                    <v-icon>mdi-minus</v-icon>
                  </v-btn>
                  <span class="mx-2 text-subtitle-1">{{ iptInfants }}</span>
                  <v-btn
                    icon
                    size="x-small"
                    @click="iptInfants++"
                    variant="outlined"
                    :disabled="iptInfants >= 4"
                  >
                    <v-icon>mdi-plus</v-icon>
                  </v-btn>
                </v-col>
              </v-row>
            </v-col>
          </v-row>

          <v-row dense class="box mt-6 pa-4">
            <v-col cols="12">
              <v-text-field
                variant="outlined"
                prefix="$"
                prepend-inner-icon="mdi-currency-usd"
                :rules="[rules.required]"
                v-model="iptAmount"
                clearable
                type="tel"
                @keyup.enter="createCall"
                hide-details
                placeholder="Enter the total travel cost"
              />
            </v-col>
          </v-row>
        </v-form>
      </div>

      <div class="fixed-bottom">
        <v-row no-gutters align="center" class="bottom-actions pa-4">
          <v-col cols="3">
            <v-btn variant="outlined" @click="clearCall">Clear</v-btn>
          </v-col>
          <v-spacer />
          <v-col cols="8">
            <v-btn
              color="blue-darken-2"
              variant="elevated"
              size="large"
              elevation="1"
              class="w-100"
              @click="createCall"
            >
              <v-icon left class="mr-2">mdi-robot</v-icon>
              AI 일정 생성
            </v-btn>
          </v-col>
        </v-row>
      </div>
    </div>
  </BottomSheet>
</template>

<style scoped>
.bottom-sheet-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f8f8f8;
}

.header-area {
  border-bottom: 1px solid #eee;
}

.content-area {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.box {
  border-radius: 15px;
  background-color: #fff;
}

.fixed-bottom {
  position: sticky;
  bottom: 0;
  background: white;
  border-top: 1px solid #e4e4e4;
  z-index: 1;
}

/* 컨텐츠 영역 스타일링 */
:deep([data-vsbs-content]) {
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>