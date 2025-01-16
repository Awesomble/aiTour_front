<script setup lang="ts">
import { ref, defineEmits, defineProps, watch, UnwrapRef, onMounted, nextTick } from 'vue'
import dayjs from 'dayjs'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update', value: string): void
}>()
const props = defineProps({
  isShow: {
    type: Boolean,
    required: true
  }
})

const formRef = ref<HTMLFormElement | null>(null)
const dialog = ref<boolean>(true)
const iptRange = ref<string | null>(null)
const iptAmount = ref<number | null>(null)
const iptDate = ref<any>(null)
const iptAdults = ref<number>(1)
const iptChildren = ref<number>(0)
const iptInfants = ref<number>(0)
const rules = ref({
  required: (value: string) => !!value || 'Required.'
})
const guestCategories = ref<object[]>([
  {
    label: '성인',
    description: '13세 이상',
    counter: 1
  },
  {
    label: '어린이',
    description: '2~12세',
    counter: 0
  },
  {
    label: '유아',
    description: '2세 미만',
    counter: 0
  }
])

watch(
  () => props.isShow,
  async (newVal) => {
    dialog.value = newVal
    if (newVal) {
      await nextTick() // DOM이 업데이트된 후
      initializeMobiscroll()
    }
  }
)
const increment = (counter: number) => {
  console.log(counter)
  counter++
}
const decrement = (counter: number) => {
  if (counter > 0) counter--
}
const close = () => {
  emit('close')
}
const createCall = async () => {
  const { valid } = await formRef.value?.validate()
  if (!valid) return
  emit(
    'update',
    `여행가간: ${iptRange.value} 여행총비용: ${iptAmount.value} 여행자수는 어른: ${iptAdults.value} 어린이: ${iptChildren.value} 아기: ${iptInfants.value}`
  )
  close()
}
let mobiInstance = ref<any>(null)
const dateInput = ref<HTMLInputElement | null>(null)
const initializeMobiscroll = () => {
  if (mobiInstance.value) {
    mobiInstance.value.destroy()
  }

  const inputElement = document.querySelector('#dateInput')
  if (inputElement) {
    mobiInstance.value = mobiscroll.datepicker(inputElement, {
      controls: ['calendar'],
      select: 'range',
      display: 'inline',
      touchUi: true,
      theme: 'ios',
      min: dayjs().format('YYYY-MM-DD'),
      showOnClick: false,
      showOnFocus: false,
      onChange: function (args) {
        iptRange.value = args?.valueText
      }
    })
  } else {
    console.error('Mobiscroll input element not found')
  }
}
onMounted(async () => {
  await nextTick()
  initializeMobiscroll()
})
</script>

<template>
  <v-dialog v-model="dialog" transition="dialog-bottom-transition" fullscreen persistent>
    <v-toolbar color="#f8f8f8" dark flat elevation="0">
      <v-btn color="black" icon="mdi-close" @click="close" />
      <v-toolbar-title>Your travel plans</v-toolbar-title>
      <v-spacer></v-spacer>
      <!--      <v-toolbar-items>-->
      <!--        <v-btn text="Save" variant="text" @click="close"></v-btn>-->
      <!--      </v-toolbar-items>-->
    </v-toolbar>
    <v-card
      color="#f8f8f8"
      class="d-flex flex-column"
      style="height: calc(100% - 68px); min-height: calc(100% - 68px); padding-bottom: 70px"
    >
      <v-card-text>
        <v-form ref="formRef">
          <v-row dense>
            <v-col>
              <v-text-field
                ref="dateInput"
                label="Range"
                variant="outlined"
                :rules="[rules.required]"
                v-model="iptRange"
                clearable2
                readonly
              />
              <input id="dateInput" style="visibility: hidden" />
              <!--              <v-btn icon="mdi-human-male-female-child" size="x-large" />-->
              <!--              <v-btn icon="mdi-human-male-female" size="x-large" />-->
            </v-col>
          </v-row>
          <v-row dense>
            <v-col cols="12" md="4" sm="6">
              <v-text-field
                label="Amount"
                variant="outlined"
                model-value="10.00"
                prefix="$"
                :counter="10"
                :rules="[rules.required]"
                v-model="iptAmount"
                clearable
                @keyup.enter="createCall"
              />
              <small class="text-caption text-medium-emphasis"
                >*Enter the total cost per person.</small
              >
            </v-col>
          </v-row>
          <v-row dense>
            <v-col cols="4">
              <span class="text-subtitle-1 font-weight-bold">성인</span>
              <div class="text-caption">13세 이상</div>
            </v-col>
            <v-col cols="8" class="d-flex align-center justify-end">
              <v-btn icon size="x-small" @click="iptAdults--" :disabled="iptAdults === 1">
                <v-icon>mdi-minus</v-icon>
              </v-btn>
              <span class="mx-2 text-subtitle-1">{{ iptAdults }}</span>
              <v-btn icon size="x-small" @click="iptAdults++">
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </v-col>
          </v-row>
          <v-row dense>
            <v-col cols="4">
              <span class="text-subtitle-1 font-weight-bold">어린이</span>
              <div class="text-caption">2~12세</div>
            </v-col>
            <v-col cols="8" class="d-flex align-center justify-end">
              <v-btn icon size="x-small" @click="iptChildren--" :disabled="iptChildren === 0">
                <v-icon>mdi-minus</v-icon>
              </v-btn>
              <span class="mx-2 text-subtitle-1">{{ iptChildren }}</span>
              <v-btn icon size="x-small" @click="iptChildren++">
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </v-col>
          </v-row>
          <v-row dense>
            <v-col cols="4">
              <span class="text-subtitle-1 font-weight-bold">유아</span>
              <div class="text-caption">2세 미만</div>
            </v-col>
            <v-col cols="8" class="d-flex align-center justify-end">
              <v-btn icon size="x-small" @click="iptInfants--" :disabled="iptInfants === 0">
                <v-icon>mdi-minus</v-icon>
              </v-btn>
              <span class="mx-2 text-subtitle-1">{{ iptInfants }}</span>
              <v-btn icon size="x-small" @click="iptInfants++">
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-spacer />
      <v-card-actions style="position: fixed; left: 0; bottom: 0; width: 100%; background: #fff">
        <v-btn
          size="large"
          color="primary"
          block
          text="Create"
          variant="tonal"
          @click="createCall"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss"></style>
