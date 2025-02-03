<script setup lang="ts">
import { ref, onBeforeMount } from 'vue'
import {
  addPlaceHashtagAPI,
  delPlaceHashtagAPI,
  getHashtagsAPI,
  getPlacesDetailAPI,
  updatePlaceAPI
} from '@/network/admin'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs' // 실제 경로에 맞게 수정

const router = useRouter()
const route = useRoute()
const formRef = ref<HTMLFormElement | null>(null)
const hashtags = ref<object[]>([])
const hasHashtags = ref<number[]>([])
const iptPlaceName = ref('')
const iptPlaceCategory = ref('')
const iptPlaceAddress = ref('')
const iptPlaceLatitude = ref<number | null>(null)
const iptPlaceLongitude = ref<number | null>(null)
const iptPlaceDescription = ref<string>('')
const iptPlaceCost = ref<number | null>(null)
const iptSearch = ref<string>('')
const headers = ref<object[]>([
  {
    key: 'hashtag_id',
    sortable: false,
    title: 'ID'
  },
  { key: 'name', align: 'start', title: 'Name' },
  { key: 'action', align: 'end', title: 'Action' }
])
const operatingHours = ref<object[]>([
  {
    is_show: false,
    day_of_week: 'Monday',
    open_time: '',
    close_time: '',
    break_start: '',
    break_end: '',
    is_closed: false
  },
  {
    is_show: false,
    day_of_week: 'Tuesday',
    open_time: '',
    close_time: '',
    break_start: '',
    break_end: '',
    is_closed: false
  },
  {
    is_show: false,
    day_of_week: 'Wednesday',
    open_time: '',
    close_time: '',
    break_start: '',
    break_end: '',
    is_closed: false
  },
  {
    is_show: false,
    day_of_week: 'Thursday',
    open_time: '',
    close_time: '',
    break_start: '',
    break_end: '',
    is_closed: false
  },
  {
    is_show: false,
    day_of_week: 'Friday',
    open_time: '',
    close_time: '',
    break_start: '',
    break_end: '',
    is_closed: false
  },
  {
    is_show: false,
    day_of_week: 'Saturday',
    open_time: '',
    close_time: '',
    break_start: '',
    break_end: '',
    is_closed: false
  },
  {
    is_show: false,
    day_of_week: 'Sunday',
    open_time: '',
    close_time: '',
    break_start: '',
    break_end: '',
    is_closed: false
  }
])

const rules = ref({
  required: (value: string) => !!value || 'Required.'
})

const applyToAll = () => {
  // 월요일 데이터를 가져옵니다.
  const mondayData = operatingHours.value.find((day) => day.day_of_week === 'Monday')

  // 월요일 데이터를 기반으로 다른 요일을 업데이트합니다.
  operatingHours.value.forEach((day) => {
    if (day.day_of_week !== 'Monday') {
      // 월요일은 제외
      day.is_show = true
      day.open_time = mondayData.open_time
      day.close_time = mondayData.close_time
      day.break_start = mondayData.break_start
      day.break_end = mondayData.break_end
      day.is_closed = mondayData.is_closed
    }
  })
}
const getPlacesDetail = async () => {
  hasHashtags.value = []
  const res = await getPlacesDetailAPI(route.params.id)
  if (res?.status === 200) {
    iptPlaceName.value = res?.data?.name
    iptPlaceCategory.value = res?.data?.category
    iptPlaceAddress.value = res?.data?.address
    iptPlaceLatitude.value = res?.data?.latitude
    iptPlaceLongitude.value = res?.data?.longitude
    iptPlaceDescription.value = res?.data?.description
    iptPlaceCost.value = res?.data?.cost
    hasHashtags.value = res?.data?.hashtags
    if (res?.data?.operating_hours?.length) operatingHours.value = res?.data?.operating_hours
  }
}

const updatePlace = async () => {
  const sanitizedData = operatingHours.value.map(({ is_show, ...rest }) => rest)
  const res = await updatePlaceAPI(String(route.params.id), {
    name: iptPlaceName.value,
    category: iptPlaceCategory.value,
    address: iptPlaceAddress.value,
    latitude: iptPlaceLatitude.value,
    longitude: iptPlaceLongitude.value,
    cost: iptPlaceCost.value,
    description: iptPlaceDescription.value,
    operating_hours: sanitizedData
  })
  if (res?.status === 200) {
    getPlacesDetail()
  }
}

const getHashtags = async () => {
  const res = await getHashtagsAPI()
  if (res?.data) {
    hashtags.value = res.data
  } else {
    hashtags.value = [] // Fallback to an empty array
  }
}
const addPlaceHashtag = async (hashtagId: number) => {
  const res = await addPlaceHashtagAPI(String(route.params.id), {
    hashtag_ids: [Number(hashtagId)]
  })
  await getPlacesDetail()
}
const delPlaceHashtag = async (hashtagId: number) => {
  const res = await delPlaceHashtagAPI(String(route.params.id), String(hashtagId))
  await getPlacesDetail()
}

// 초기 실행
onBeforeMount(() => {
  getPlacesDetail()
  getHashtags()
})
</script>

<template>
  <v-container>
    <v-row>
      <v-col cols="6" lg="6" md="6">
        <v-card title="Place Add" color="white">
          <v-form ref="formRef">
            <v-card-text>
              <v-row no-gutters class="ga-2">
                <v-col cols="12">
                  <v-text-field
                    v-model="iptPlaceName"
                    label="Name"
                    density="compact"
                    variant="outlined"
                    hide-details
                    clearable
                    :rules="[rules.required]"
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="iptPlaceCategory"
                    label="Category"
                    density="compact"
                    variant="outlined"
                    hide-details
                    clearable
                    :rules="[rules.required]"
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="iptPlaceAddress"
                    label="Address"
                    density="compact"
                    variant="outlined"
                    hide-details
                    clearable
                    :rules="[rules.required]"
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="iptPlaceLatitude"
                    label="Latitude"
                    density="compact"
                    variant="outlined"
                    hide-details
                    clearable
                    :rules="[rules.required]"
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="iptPlaceLongitude"
                    label="Longitude"
                    density="compact"
                    variant="outlined"
                    hide-details
                    clearable
                    :rules="[rules.required]"
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="iptPlaceCost"
                    label="Cost"
                    density="compact"
                    variant="outlined"
                    hide-details
                    clearable
                    :rules="[rules.required]"
                  />
                </v-col>
                <v-col cols="12">
                  <v-textarea
                    v-model="iptPlaceDescription"
                    label="Description"
                    density="compact"
                    variant="outlined"
                    hide-details
                    clearable
                    :rules="[rules.required]"
                  />
                </v-col>
                <v-col
                  v-for="(t, idx) in operatingHours"
                  :key="`operatingHours${t.day_of_week}`"
                  cols="12"
                >
                  <v-card-actions class="pa-0" density="compact">
                    <v-btn color="black" :text="t.day_of_week"></v-btn>
                    <v-spacer></v-spacer>
                    <v-btn
                      :icon="t.is_show ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                      @click="t.is_show = !t.is_show"
                    ></v-btn>
                  </v-card-actions>
                  <v-expand-transition>
                    <div v-show="t.is_show">
                      <v-divider></v-divider>
                      <v-card-text>
                        <v-table class="text-caption" density="compact">
                          <tbody>
                            <tr align="right">
                              <th>Close</th>
                              <td>
                                <v-switch
                                  v-model="t.is_closed"
                                  hide-details
                                  density="compact"
                                  color="primary"
                                ></v-switch>
                              </td>
                            </tr>
                            <tr v-if="t.is_closed">
                              <th>OpenTime</th>
                              <td>
                                <v-text-field
                                  v-model="t.open_time"
                                  density="compact"
                                  variant="outlined"
                                  placeholder="09:00:00"
                                  hide-details
                                  clearable
                                />
                              </td>
                            </tr>
                            <tr v-if="t.is_closed">
                              <th>CloseTime</th>
                              <td>
                                <v-text-field
                                  v-model="t.close_time"
                                  density="compact"
                                  variant="outlined"
                                  placeholder="22:00:00"
                                  hide-details
                                  clearable
                                />
                              </td>
                            </tr>
                            <tr v-if="t.is_closed">
                              <th>BreakStart</th>
                              <td>
                                <v-text-field
                                  v-model="t.break_start"
                                  density="compact"
                                  variant="outlined"
                                  placeholder="14:00:00"
                                  hide-details
                                  clearable
                                />
                              </td>
                            </tr>
                            <tr v-if="t.is_closed">
                              <th>BreakEne</th>
                              <td>
                                <v-text-field
                                  v-model="t.break_end"
                                  density="compact"
                                  variant="outlined"
                                  placeholder="17:00:00"
                                  hide-details
                                  clearable
                                />
                              </td>
                            </tr>
                          </tbody>
                        </v-table>
                        <v-divider class="py-2" v-if="idx === 0" />
                        <v-btn v-if="idx === 0" color="red" block @click="applyToAll">Apply to all days</v-btn>
                      </v-card-text>
                    </div>
                  </v-expand-transition>
                </v-col>
              </v-row>
            </v-card-text>
          </v-form>
        </v-card>
      </v-col>
      <v-col cols="6" lg="6" md="6">
        <v-card title="Add Hashtag" color="white">
          <v-card-text>
            <v-sheet v-if="hasHashtags?.length"
              border="md"
              class="pa-2 mx-auto"
            >
              <v-chip-group mandatory>
                <v-chip
                  v-for="(h, idx) in hasHashtags"
                  :key="`hashtag${idx}`"
                  closable
                  @click="delPlaceHashtag(h.hashtag_id)"
                >
                  {{ h.name }}
                </v-chip>
              </v-chip-group>
            </v-sheet>
            <v-data-table-virtual
              :headers="headers"
              :items="hashtags"
              :search="iptSearch"
              height="700"
            >
              <template v-slot:item.action="{ item }">
                <v-btn
                  v-if="!hasHashtags.filter((itm) => itm.hashtag_id === item.hashtag_id).length"
                  density="compact"
                  color="blue"
                  @click="addPlaceHashtag(item.hashtag_id)"
                  >추가</v-btn
                >
                <v-btn v-else density="compact" color="red" @click="delPlaceHashtag(item.hashtag_id)"
                  >삭제</v-btn
                >
              </template>
            </v-data-table-virtual>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" lg="6" md="6">
        <v-card title="Add Specialday" color="white">
          <v-card-text>
            <v-date-picker
              show-adjacent-months
              style="width: 100%"
              :min="dayjs().format('YYYY-MM-DD')"
            ></v-date-picker>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-bottom-navigation
      color="primary"
      grow
      class="fixed"
    >
      <v-spacer />

      <v-btn
        class="w-100"
        @click.prevent="updatePlace"
        style="background-color: #1483C2!important;color: white"
      ><strong>Update</strong></v-btn
      >
    </v-bottom-navigation>
  </v-container>
</template>

<style lang="scss">
.v-bottom-navigation {
  position: fixed!important;
  bottom: 0;
  right: 0;
}
</style>
