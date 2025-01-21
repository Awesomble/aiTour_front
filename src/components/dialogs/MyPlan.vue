<script setup lang="ts">
import { ref, defineEmits, defineProps, watch, reactive, onMounted, nextTick } from 'vue'
import dayjs from 'dayjs'
import { vMaska } from "maska/vue"
import type { MaskInputOptions } from "maska"

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update', value: any): void
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
const iptAdults = ref<number>(1)
const iptChildren = ref<number>(0)
const iptInfants = ref<number>(0)
const dateInput = ref<HTMLInputElement | null>(null)
let mobiInstance = ref<any>(null)
const rules = ref({
  required: (value: string) => !!value || 'Required.'
})
const maskaOptions = reactive<MaskInputOptions>({
  mask: '9,99#',
  tokens: {
    '9': { pattern: /[0-9]/, repeated: true }
  },
  reversed: true
})

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
const close = () => {
  emit('close')
}
const clearCall = () => {
  if (mobiInstance.value) {
    mobiInstance.value.setVal(null)
    iptRange.value = null
  }
  iptAdults.value = 1;
  iptChildren.value = 0;
  iptInfants.value = 0;
  iptAmount.value = null;
}
const createCall = async () => {
  const { valid } = await formRef.value?.validate()
  if (!valid) return
  console.log(iptAmount.value, typeof iptAmount.value)
  emit(
    'update',
    {
      range: iptRange.value,
      amount: iptAmount.value,
      adults: iptAdults.value,
      children: iptChildren.value,
      infants: iptInfants.value,
    }
    // `여행가간: ${iptRange.value} 여행총비용: ${Number(iptAmount.value?.replace(/,/g, '')) * 1440}원 여행자수는 어른: ${iptAdults.value} 어린이: ${iptChildren.value} 아기: ${iptInfants.value}`
  )
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
                variant="outlined"
                :rules="[rules.required]"
                v-model="iptRange"
                clearable2
                readonly
                placeholder="Select your travel dates"
                v-if="false"
              />
              <input id="dateInput" style="visibility: hidden" />
              <!--              <v-btn icon="mdi-human-male-female-child" size="x-large" />-->
              <!--              <v-btn icon="mdi-human-male-female" size="x-large" />-->
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
              <v-row dense>
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
              <v-row dense>
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
            <v-col cols="12" md="4" sm="6">
              <v-text-field
                variant="outlined"
                model-value="10.00"
                prefix="$"
                prepend-inner-icon="mdi-currency-usd"
                :counter="10"
                :rules="[rules.required]"
                v-model="iptAmount"
                clearable
                type="tel"
                @keyup.enter="createCall"
                v-maska="maskaOptions"
                hide-details
                placeholder="Enter the total travel cost"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-spacer />
      <v-card-actions
        class="pa-4"
        style="position: fixed; left: 0; bottom: 0; width: 100%; background: #fff; border-top: 1px solid #e4e4e4;"
      >
        <v-btn variant="outlined" @click="clearCall">Clear</v-btn>
        <v-spacer />
        <v-btn class="w-33" color="primary" variant="tonal" @click="createCall"> Create </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
.box {
  border-radius: 15px;
  background-color: #fff;
}
</style>
