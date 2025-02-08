<script setup lang="ts">
import { ref, onBeforeMount, onUnmounted } from 'vue'
import {
  addPlaceHashtagAPI,
  delPlaceHashtagAPI,
  getHashtagsAPI,
  getPlacesDetailAPI,
  updatePlaceAPI,
  getSpecialDaysAPI,
  addSpecialDaysAPI,
  delSpecialDaysAPI, uploadPlaceFileAPI, delPlaceFileAPI, getCategoriesAPI
} from '@/network/admin'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import draggable from 'vuedraggable'

const router = useRouter()
const route = useRoute()
const formRef = ref<HTMLFormElement | null>(null)
const placeFileRef = ref<HTMLFormElement | null>(null)
const hashtags = ref<object[]>([])
const photos = ref<object[]>([])
const hasHashtags = ref<number[]>([])
const iptPlaceName = ref('')
const iptPlaceCategory = ref('')
const categories = ref<object[]>([])
const iptPlaceAddress = ref('')
const iptPlaceLatitude = ref<number | null>(null)
const iptPlaceLongitude = ref<number | null>(null)
const iptPlaceDescription = ref<string>('')
const menus = ref<object[]>([])
const iptSearch = ref<string>('')
const iptSpecialday = ref<any>(null)
const activeSpecialDays = ref<object[]>([])
const getSpecialDaysYear = ref<string>('')
const getSpecialDaysMonth = ref<string>('')
let mobiInstance = ref<any>(null)
const iptSpecialdayDetail = ref<object>({
  open_time: '',
  close_time: '',
  break_start: '',
  break_end: '',
  is_closed: '',
  description: ''
})
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
      day.open_time = mondayData?.open_time
      day.close_time = mondayData?.close_time
      day.break_start = mondayData?.break_start
      day.break_end = mondayData?.break_end
      day.is_closed = mondayData?.is_closed
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
    menus.value = res?.data?.menus
    hasHashtags.value = res?.data?.hashtags
    photos.value = res?.data?.photos
    if (res?.data?.operating_hours?.length) operatingHours.value = res?.data?.operating_hours
  }
}

const updatePlace = async () => {
  const sanitizedData = operatingHours.value.map(({ is_show, ...rest }) => rest)
  console.log(iptPlaceCategory.value)
  const res = await updatePlaceAPI(String(route.params.id), {
    name: iptPlaceName.value,
    category: typeof iptPlaceCategory.value === 'number' ? iptPlaceCategory.value : iptPlaceCategory.value.category_id,
    address: iptPlaceAddress.value,
    latitude: iptPlaceLatitude.value,
    longitude: iptPlaceLongitude.value,
    description: iptPlaceDescription.value,
    menus: menus.value,
    operating_hours: sanitizedData,
    photo_ids: photos.value.map(item => item.photo_id)
  })
  if (res?.status === 200) {
    getPlacesDetail()
  }
}
const getCategories = async () => {
  const res= await getCategoriesAPI()
  if (res?.status === 200 && res?.data) {
    categories.value = res?.data
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

const getSpecialDays = async () => {
  activeSpecialDays.value = []
  const activeDays: any[] = []
  const res = await getSpecialDaysAPI(
    String(route.params.id),
    getSpecialDaysYear.value,
    getSpecialDaysMonth.value
  )
  if (res?.status === 200 && res?.data?.length) {
    activeSpecialDays.value = res?.data
    res?.data.forEach((day: any) => {
      activeDays.push({
        date: dayjs(new Date(day.special_date)).format('YYYY-MM-DDTHH:mm'),
        highlight: 'red'
      })
    })
  }
  if (mobiInstance.value) {
    mobiInstance.value.setOptions({ colors: activeDays })
    checkSpecialDays()
  }
}
const addSpecialDays = async () => {
  if (!iptSpecialday.value) return
  const request = {
    special_date: new Date(iptSpecialday.value),
    open_time: iptSpecialdayDetail.value?.is_closed ? null : iptSpecialdayDetail.value?.open_time,
    close_time: iptSpecialdayDetail.value?.is_closed ? null : iptSpecialdayDetail.value?.close_time,
    break_start: iptSpecialdayDetail.value?.is_closed
      ? null
      : iptSpecialdayDetail.value?.break_start,
    break_end: iptSpecialdayDetail.value?.is_closed ? null : iptSpecialdayDetail.value?.break_end,
    is_closed: iptSpecialdayDetail.value?.is_closed,
    description: iptSpecialdayDetail.value?.description
  }
  const res = await addSpecialDaysAPI(String(route.params.id), request)
  getSpecialDays()
}
const delSpecialDays = async () => {
  const dayDetail = activeSpecialDays.value.find((day) => day.special_date === iptSpecialday.value)
  if (dayDetail) {
    const res = await delSpecialDaysAPI(String(route.params.id), dayDetail.special_day_id)
    getSpecialDays()
  }
}
const checkSpecialDays = async () => {
  const dayDetail = activeSpecialDays.value.find((day) => day.special_date === iptSpecialday.value)
  if (dayDetail) {
    console.log(dayDetail)
    iptSpecialdayDetail.value.open_time = dayDetail.open_time
    iptSpecialdayDetail.value.close_time = dayDetail.close_time
    iptSpecialdayDetail.value.break_start = dayDetail.break_start
    iptSpecialdayDetail.value.break_end = dayDetail.break_end
    iptSpecialdayDetail.value.is_closed = dayDetail.is_closed
    iptSpecialdayDetail.value.description = dayDetail.description
  } else {
    iptSpecialdayDetail.value = {
      open_time: '',
      close_time: '',
      break_start: '',
      break_end: '',
      is_closed: '',
      description: ''
    }
  }
}

const thumbUpload = async (file: any) => {
  const formData = new FormData()
  formData.append('file', file)
  const res = await uploadPlaceFileAPI(String(route.params.id), formData)
  console.log(res)
  getPlacesDetail()
}
const delPlaceFile = async (file: any) => {
  const res = await delPlaceFileAPI(String(route.params.id), String(file.photo_id))
  console.log(res)
  getPlacesDetail()
}

const destroyMobiscroll = async () => {
  if (mobiInstance.value) {
    await mobiInstance.value.destroy()
  }
}
const initializeMobiscroll = async () => {
  await destroyMobiscroll()
  const inputElement = document.querySelector('#dateInput')
  if (inputElement) {
    mobiInstance.value = mobiscroll.datepicker(inputElement, {
      controls: ['calendar'],
      display: 'inline',
      touchUi: true,
      theme: 'ios',
      dateFormat: 'YYYY-MM-DD',
      min: dayjs().format('YYYY-MM-DD'),
      onChange: function (args: any) {
        iptSpecialday.value = args?.valueText
        checkSpecialDays()
      },
      onPageChange: function (args: any) {
        console.log('====', args.month)
        getSpecialDaysYear.value = dayjs(args.month).format('YYYY')
        getSpecialDaysMonth.value = dayjs(args.month).format('MM')
        getSpecialDays()
      }
    })
  } else {
    console.error('Mobiscroll input element not found')
  }
}
const placeFileUpload = () => {
  placeFileRef.value?.click()
}
// 초기 실행
onBeforeMount(async () => {
  await initializeMobiscroll()
  getSpecialDaysYear.value = dayjs().format('YYYY')
  getSpecialDaysMonth.value = dayjs().format('MM')
  await getSpecialDays()
  getPlacesDetail()
  getHashtags()
  getCategories()
})
onUnmounted(() => {
  destroyMobiscroll()
})
</script>

<template>
  <v-container fluid class="pa-0">
    <v-row no-gutters class="pb-8">
      <v-col cols="12" xs="12" sm="12" md="6" xl="4" xxl="4">
        <v-card title="Place Update" color="white">
          <v-form ref="formRef">
            <v-card-text>
              <v-row no-gutters class="ga-2">
                <p>Default info</p>
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
                  <v-autocomplete
                    v-model="iptPlaceCategory"
                    :items="categories"
                    color="blue-grey-lighten-2"
                    item-title="name"
                    item-value="category_id"
                    label="Category"
                    density="compact"
                    variant="outlined"
                    closable-chips
                    hide-details
                  >
                    <template v-slot:item="{ props, item }">
                      <v-list-item
                        v-bind="props"
                        :subtitle="item.raw.description"
                        :title="item.raw.name"
                      ></v-list-item>
                    </template>
                  </v-autocomplete>
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
              </v-row>
              <v-row no-gutters class="ga-2 mt-8">
                <v-divider></v-divider>
                <p class="d-flex w-100 justify-space-between">
                  Menus
                  <v-btn density="compact" icon @click="menus.push({menu_category:'',menu_name:'',price:'', description:''})">
                    <v-icon>mdi-plus</v-icon>
                  </v-btn>
                </p>
                <draggable
                  v-model="menus"
                  @start="drag=true"
                  @end="drag=false"
                  item-key="photo_id"
                  class="w-100"
                >
                  <template #item="{element, index}">
                    <v-row no-gutters class="w-100 d-flex child-flex">
                      <v-col cols="2">
                        <v-text-field
                          v-model="element.menu_category"
                          label="Category"
                          density="compact"
                          variant="outlined"
                          hide-details
                          clearable
                        />
                      </v-col>
                      <v-col cols="2">
                        <v-text-field
                          v-model="element.menu_name"
                          label="Name"
                          density="compact"
                          variant="outlined"
                          hide-details
                          clearable
                          :rules="[rules.required]"
                        />
                      </v-col>
                      <v-col cols="2">
                        <v-text-field
                          v-model="element.price"
                          label="Price"
                          density="compact"
                          variant="outlined"
                          hide-details
                          clearable
                          type="tel"
                          :rules="[rules.required]"
                        />
                      </v-col>
                      <v-col cols="5">
                        <v-text-field
                          v-model="element.description"
                          label="Description"
                          density="compact"
                          variant="outlined"
                          hide-details
                          clearable
                        />
                      </v-col>
                      <v-col cols="1">
                        <v-btn
                          color="grey-lighten-1"
                          icon="mdi-delete"
                          variant="text"
                          @click="menus.splice(index, 1)"
                        />
                      </v-col>
                    </v-row>
                  </template>
                </draggable>
              </v-row>
              <v-row no-gutters class="ga-2 mt-8">
                <v-divider></v-divider>
                <p>Operating hours</p>
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
                        <v-btn v-if="idx === 0" color="red" block @click="applyToAll"
                          >Apply to all days</v-btn
                        >
                      </v-card-text>
                    </div>
                  </v-expand-transition>
                </v-col>
              </v-row>

              <v-divider class="py-2" />

              <v-btn
                block
                @click.prevent="updatePlace"
                color="primary"
              ><strong>Update</strong></v-btn
              >
            </v-card-text>
          </v-form>
        </v-card>
      </v-col>
      <v-col cols="12" xs="12" sm="12" md="6" xl="4" xxl="4">
        <v-card title="Photo Add"
                color="white"
        >
          <template #append>
            <v-btn density="compact" icon @click="placeFileUpload">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </template>
          <v-card-text>
            <v-row class="mt-2">
              <draggable
                v-model="photos"
                group="people"
                @start="drag=true"
                @end="drag=false"
                item-key="photo_id"
                class="w-100 d-flex child-flex"
              >
                <template #item="{element}">
                  <v-col class="position-relative"
                         cols="4"
                  >
                    <v-img
                      :src="element.url"
                      aspect-ratio="1"
                      class="bg-grey-lighten-2"
                      cover
                    >
                      <template v-slot:placeholder>
                        <v-row
                          align="center"
                          class="fill-height ma-0"
                          justify="center"
                        >
                          <v-progress-circular
                            color="grey-lighten-5"
                            indeterminate
                          ></v-progress-circular>
                        </v-row>
                      </template>
                    </v-img>
                    <v-btn density="compact"
                           icon="mdi-delete-circle"
                           class="position-absolute top-0 right-0"
                           @click="delPlaceFile(element)"
                    />
                  </v-col>
                </template>
              </draggable>
            </v-row>
            <v-file-input ref="placeFileRef"
                          accept="image/png, image/jpeg, image/bmp"
                          class="d-none"
                          @update:modelValue="thumbUpload"
            />
          </v-card-text>
        </v-card>

        <v-card title="Add Hashtag" color="white">
          <v-card-text>
            <v-sheet v-if="hasHashtags?.length" border="md" class="pa-2 mx-auto">
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
                <v-btn
                  v-else
                  density="compact"
                  color="red"
                  @click="delPlaceHashtag(item.hashtag_id)"
                >삭제</v-btn
                >
              </template>
            </v-data-table-virtual>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" xs="12" sm="12" md="6" xl="4" xxl="4" class="pb-4">
        <v-card title="Add Specialday" color="white">
          <v-card-text>
            <input id="dateInput" style="visibility: hidden" />
          </v-card-text>
          <v-card-text v-if="iptSpecialday">
            <v-table class="text-caption" density="compact">
              <tbody>
                <tr align="right">
                  <th>Close</th>
                  <td>
                    <v-switch
                      v-model="iptSpecialdayDetail.is_closed"
                      hide-details
                      density="compact"
                      color="primary"
                    ></v-switch>
                  </td>
                </tr>
                <tr v-if="!iptSpecialdayDetail.is_closed">
                  <th>OpenTime</th>
                  <td>
                    <v-text-field
                      v-model="iptSpecialdayDetail.open_time"
                      density="compact"
                      variant="outlined"
                      placeholder="09:00:00"
                      hide-details
                      clearable
                    />
                  </td>
                </tr>
                <tr v-if="!iptSpecialdayDetail.is_closed">
                  <th>CloseTime</th>
                  <td>
                    <v-text-field
                      v-model="iptSpecialdayDetail.close_time"
                      density="compact"
                      variant="outlined"
                      placeholder="22:00:00"
                      hide-details
                      clearable
                    />
                  </td>
                </tr>
                <tr v-if="!iptSpecialdayDetail.is_closed">
                  <th>BreakStart</th>
                  <td>
                    <v-text-field
                      v-model="iptSpecialdayDetail.break_start"
                      density="compact"
                      variant="outlined"
                      placeholder="14:00:00"
                      hide-details
                      clearable
                    />
                  </td>
                </tr>
                <tr v-if="!iptSpecialdayDetail.is_closed">
                  <th>BreakEne</th>
                  <td>
                    <v-text-field
                      v-model="iptSpecialdayDetail.break_end"
                      density="compact"
                      variant="outlined"
                      placeholder="17:00:00"
                      hide-details
                      clearable
                    />
                  </td>
                </tr>
                <tr>
                  <th>Description</th>
                  <td>
                    <v-textarea
                      v-model="iptSpecialdayDetail.description"
                      density="compact"
                      variant="outlined"
                      hide-details
                      clearable
                      rows="3"
                    />
                  </td>
                </tr>
              </tbody>
            </v-table>
            <v-divider class="py-2" />
            <div class="d-flex ga-2">
              <v-btn
                v-if="
                  activeSpecialDays.findIndex((day) => day.special_date === iptSpecialday) !== -1
                "
                color="red"
                @click="delSpecialDays"
                class="w-50"
              >
                Delete day</v-btn
              >
              <v-btn color="primary" @click="addSpecialDays" class="w-50" :block="activeSpecialDays.findIndex((day) => day.special_date === iptSpecialday) === -1"> Apply day </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style lang="scss">
</style>
