<script setup lang="ts">
import { onBeforeMount, ref, computed } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const tabsIdx = ref<number>(0)
const weather = ref({
  temperature: 0,
  description: '',
  icon: ''
})
const currencies = ref({
  USD: 0.00075,
  EUR: 0.00068,
  JPY: 0.11,
  CNY: 0.0054
})
const fromCurrency = ref('KRW')
const toCurrency = ref('USD')
const amount = ref(1000)
const convertedAmount = ref(0)

// Additional presets for common currency amounts
const presetAmounts = [1000, 5000, 10000, 50000, 100000]

// Quick swap function for currency exchange
const swapCurrencies = () => {
  const temp = fromCurrency.value
  fromCurrency.value = toCurrency.value
  toCurrency.value = temp
  calculateConversion()
}

const formattedResult = computed(() => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: toCurrency.value,
    maximumFractionDigits: 2
  }).format(convertedAmount.value)
})

onBeforeMount(() => {
  // Simulated weather data (would normally fetch from API)
  weather.value = {
    temperature: 23,
    description: '맑음',
    icon: 'mdi-weather-sunny'
  }
  
  calculateConversion()
})

const calculateConversion = () => {
  if (fromCurrency.value === 'KRW') {
    convertedAmount.value = amount.value * currencies.value[toCurrency.value]
  } else if (toCurrency.value === 'KRW') {
    convertedAmount.value = amount.value / currencies.value[fromCurrency.value]
  } else {
    const toKRW = amount.value / currencies.value[fromCurrency.value]
    convertedAmount.value = toKRW * currencies.value[toCurrency.value]
  }
}

const emergencyNumbers = [
  { country: '한국', police: '112', ambulance: '119', embassy: '02-123-4567', icon: 'mdi-flag', color: 'red darken-1' },
  { country: '일본', police: '110', ambulance: '119', embassy: '03-3452-7611', icon: 'mdi-flag', color: 'red' },
  { country: '미국', police: '911', ambulance: '911', embassy: '02-397-4114', icon: 'mdi-flag-outline', color: 'blue' },
  { country: '영국', police: '999', ambulance: '999', embassy: '02-3210-5500', icon: 'mdi-flag-variant', color: 'blue darken-2' }
]

const travelChecklist = [
  { text: '여권', done: false },
  { text: '비행기 티켓', done: false },
  { text: '호텔 예약 확인서', done: false },
  { text: '보험', done: false },
  { text: '충전기/어댑터', done: false },
  { text: '필수 약품', done: false }
]
</script>

<template>
  <v-container class="pa-2">
    <h1 class="text-h5 mb-3 text-center primary--text">여행 대시보드</h1>
    
    <v-row dense>
      <!-- 날씨 정보 -->
      <v-col cols="12" md="6" lg="3">
        <v-card class="dashboard-card elevation-3" color="light-blue lighten-5">
          <v-card-title class="py-2 text-primary">
            <v-icon large :color="weather.description === '맑음' ? 'amber' : 'blue'">{{ weather.icon }}</v-icon>
            <span class="ml-2">현재 날씨</span>
          </v-card-title>
          <v-card-text class="text-center pa-2">
            <div class="text-h3 font-weight-bold amber--text text--darken-2">{{ weather.temperature }}°C</div>
            <div class="text-subtitle-1 blue--text">{{ weather.description }}</div>
            <div class="text-caption grey--text">서울, 대한민국</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <!-- 환율 계산기 -->
      <v-col cols="12" md="6" lg="3">
        <v-card class="dashboard-card elevation-3" color="green lighten-5">
          <v-card-title class="py-2 text-primary">
            <v-icon large color="green">mdi-currency-usd</v-icon>
            <span class="ml-2">환율 계산기</span>
          </v-card-title>
          <v-card-text class="pa-2">
            <div class="d-flex align-center mb-2">
              <v-text-field
                v-model="amount"
                type="number"
                label="금액"
                density="compact"
                hide-details
                class="mr-2"
                @input="calculateConversion"
              ></v-text-field>
              
              <v-btn-toggle v-model="tabsIdx" density="compact" color="green">
                <v-btn icon @click="swapCurrencies">
                  <v-icon>mdi-swap-horizontal</v-icon>
                </v-btn>
              </v-btn-toggle>
            </div>
            
            <div class="d-flex">
              <v-select
                v-model="fromCurrency"
                :items="['KRW', 'USD', 'EUR', 'JPY', 'CNY']"
                label="변환할 통화"
                density="compact"
                hide-details
                class="mr-2"
                @change="calculateConversion"
              ></v-select>
              
              <v-select
                v-model="toCurrency"
                :items="['USD', 'EUR', 'JPY', 'CNY', 'KRW']"
                label="변환될 통화"
                density="compact"
                hide-details
                @change="calculateConversion"
              ></v-select>
            </div>
            
            <!-- Quick amount buttons -->
            <div class="d-flex flex-wrap justify-center mt-2">
              <v-btn
                v-for="preset in presetAmounts"
                :key="preset"
                size="x-small"
                color="green lighten-1"
                class="ma-1"
                @click="amount = preset; calculateConversion()"
              >
                {{ preset.toLocaleString() }}원
              </v-btn>
            </div>
            
            <div class="text-subtitle-1 text-center mt-2 py-2 green lighten-4 rounded font-weight-bold">
              {{ amount.toLocaleString() }} {{ fromCurrency }} = {{ formattedResult }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <!-- 긴급 전화 연결 - 심플 아이콘 버전 -->
      <v-col cols="12" md="6" lg="3">
        <v-card class="dashboard-card elevation-3" color="red lighten-5">
          <v-card-title class="py-2 text-primary">
            <v-icon large color="red">mdi-phone-in-talk</v-icon>
            <span class="ml-2">긴급 전화번호</span>
          </v-card-title>
          <v-card-text class="pa-2">
            <v-row dense>
              <v-col v-for="(item, i) in emergencyNumbers" :key="i" cols="6">
                <v-card flat class="emergency-card pa-2" :color="item.color + ' lighten-5'">
                  <div class="text-subtitle-2 font-weight-bold mb-1">{{ item.country }}</div>
                  <div class="d-flex justify-space-between">
                    <v-btn
                      icon
                      variant="text"
                      color="red"
                      density="compact"
                      :href="`tel:${item.police}`"
                      :title="`경찰: ${item.police}`"
                    >
                      <v-icon>mdi-police-badge</v-icon>
                    </v-btn>
                    
                    <v-btn
                      icon
                      variant="text"
                      color="red"
                      density="compact"
                      :href="`tel:${item.ambulance}`"
                      :title="`구급차: ${item.ambulance}`"
                    >
                      <v-icon>mdi-ambulance</v-icon>
                    </v-btn>
                    
                    <v-btn
                      icon
                      variant="text"
                      color="blue"
                      density="compact"
                      :href="`tel:${item.embassy}`"
                      :title="`대사관: ${item.embassy}`"
                    >
                      <v-icon>mdi-office-building</v-icon>
                    </v-btn>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
      
      <!-- 여행 체크리스트 -->
      <v-col cols="12" md="6" lg="3">
        <v-card class="dashboard-card elevation-3" color="purple lighten-5">
          <v-card-title class="py-2 text-primary">
            <v-icon large color="purple">mdi-format-list-checks</v-icon>
            <span class="ml-2">여행 체크리스트</span>
          </v-card-title>
          <v-card-text class="pa-0">
            <v-list density="compact" class="pa-0">
              <v-list-item v-for="(item, i) in travelChecklist" :key="i" class="px-2">
                <template v-slot:prepend>
                  <v-checkbox
                    v-model="item.done"
                    color="purple"
                    hide-details
                    density="compact"
                  ></v-checkbox>
                </template>
                <v-list-item-title :class="{ 'text-decoration-line-through grey--text': item.done, 'purple--text text--darken-1': !item.done }">
                  {{ item.text }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- 추가 기능 행 -->
    <v-row class="mt-2" dense>
      <v-col cols="12">
        <v-card class="elevation-3" color="grey lighten-4">
          <v-tabs
            v-model="tabsIdx"
            centered
            color="deep-purple"
            background-color="grey lighten-3"
            show-arrows
          >
            <v-tab><v-icon class="mr-2">mdi-map-marker</v-icon>관광지 추천</v-tab>
            <v-tab><v-icon class="mr-2">mdi-lightbulb-on</v-icon>여행 팁</v-tab>
            <v-tab><v-icon class="mr-2">mdi-train-car</v-icon>교통 정보</v-tab>
          </v-tabs>
          
          <v-window v-model="tabsIdx">
            <v-window-item>
              <v-card flat>
                <v-card-text>
                  <v-row dense>
                    <v-col v-for="n in 3" :key="n" cols="12" md="4">
                      <v-card class="mx-auto" elevation="2">
                        <v-img
                          height="150"
                          src="https://picsum.photos/300/200"
                          cover
                          gradient="to bottom, rgba(0,0,0,0) 60%, rgba(0,0,0,0.8)"
                        >
                          <template v-slot:placeholder>
                            <v-row class="fill-height ma-0" align="center" justify="center">
                              <v-progress-circular indeterminate color="primary"></v-progress-circular>
                            </v-row>
                          </template>
                          <div class="d-flex fill-height align-end">
                            <div class="text-subtitle-1 white--text pa-2 font-weight-bold">인기 관광지 {{ n }}</div>
                          </div>
                        </v-img>
                        <v-card-text class="py-2">
                          다양한 관광지를 둘러보고 여행 계획을 세워보세요.
                        </v-card-text>
                        <v-card-actions class="px-2 py-0">
                          <v-btn
                            color="deep-purple"
                            variant="text"
                            size="small"
                          >
                            자세히 보기
                          </v-btn>
                        </v-card-actions>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-window-item>
            
            <v-window-item>
              <v-card flat>
                <v-card-text>
                  <v-list dense>
                    <v-list-item v-for="n in 5" :key="n" class="px-2 mb-1" rounded color="blue lighten-5">
                      <template v-slot:prepend>
                        <v-icon color="blue">mdi-lightbulb-on-outline</v-icon>
                      </template>
                      <v-list-item-title class="font-weight-medium">여행 팁 {{ n }}</v-list-item-title>
                      <v-list-item-subtitle>
                        더 좋은 여행을 위한 팁과 조언을 확인하세요.
                      </v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </v-card-text>
              </v-card>
            </v-window-item>
            
            <v-window-item>
              <v-card flat>
                <v-card-text>
                  <v-row dense>
                    <v-col cols="12" md="6">
                      <v-card elevation="1" color="light-green lighten-5">
                        <v-card-title class="py-2">
                          <v-icon color="light-green darken-1" class="mr-2">mdi-bus</v-icon>
                          대중교통
                        </v-card-title>
                        <v-card-text class="py-2">
                          현지 대중교통 정보와 이용 방법을 확인하세요.
                        </v-card-text>
                      </v-card>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-card elevation="1" color="amber lighten-5">
                        <v-card-title class="py-2">
                          <v-icon color="amber darken-1" class="mr-2">mdi-car</v-icon>
                          택시/렌터카
                        </v-card-title>
                        <v-card-text class="py-2">
                          택시 이용 방법 및 렌터카 서비스 정보를 확인하세요.
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-window-item>
          </v-window>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style lang="scss">
.dashboard-card {
  transition: all 0.2s;
  height: 100%;
  display: flex;
  flex-direction: column;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1) !important;
  }
  
  .v-card-title {
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }
}

.text-primary {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  
  .v-icon {
    margin-right: 8px;
  }
}

.emergency-card {
  transition: all 0.2s;
  
  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}
</style>
