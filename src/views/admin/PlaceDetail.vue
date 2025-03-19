<script setup lang="ts">
import { ref, onUnmounted, watch, nextTick, onMounted } from 'vue'
import {
  addPlaceHashtagAPI,
  delPlaceHashtagAPI,
  getHashtagsAPI,
  getPlacesDetailAPI,
  updatePlaceAPI,
  getSpecialDaysAPI,
  addSpecialDaysAPI,
  delSpecialDaysAPI,
  uploadPlaceFileAPI,
  delPlaceFileAPI,
  getCategoriesAPI, uploadLandmarkFileAPI
} from '@/network/admin'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import draggable from 'vuedraggable'
import { useToast } from 'vue-toastification'
import heic2any from 'heic2any'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const formRef = ref<HTMLFormElement | null>(null)
const placeFileRef = ref<HTMLFormElement | null>(null)
const landmarkFileRef = ref<HTMLFormElement | null>(null)
const hashtags = ref<object[]>([])
const photos = ref<object[]>([])
const hasHashtags = ref<number[]>([])
const iptPlaceName = ref('')
const iptPlaceCategory = ref('')
const categories = ref<object[]>([])
const iptPlaceAddress = ref('')
const iptPlaceLatitude = ref<number | null>(null)
const iptPlaceLongitude = ref<number | null>(null)
const iptPlaceDescriptionCheck = ref<string[]>([])
const iptPlaceDescription = ref<object[]>([])
const iptDuration = ref<number | null>(null)
const iptLandmarkUrl = ref('') // New field for landmark URL
const landmarkPreview = ref('') // For visual preview
const menus = ref<object[]>([])
const iptSearch = ref<string>('')
const iptSpecialday = ref<any>(null)
const activeSpecialDays = ref<object[]>([])
const getSpecialDaysYear = ref<string>('')
const getSpecialDaysMonth = ref<string>('')
let mobiInstance = ref<any>(null)
const editorOption = ref<object>({
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      // ['blockquote', 'code-block'],
      [{ header: 1 }, { header: 2 }],
      // [{ list: 'ordered' }, { list: 'bullet' }],
      [{ script: 'sub' }, { script: 'super' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ direction: 'rtl' }],
      [{ size: ['small', false, 'large', 'huge'] }],
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      // [{ color: [] }, { background: [] }],
      [{ font: [] }],
      [{ align: [] }],
      ['clean']
      // ['image']
    ]
  }
})
const languages = ref<object[]>([
  { language: '한국어', lang_code: 'ko', country: 'KR' },
  { language: '영어', lang_code: 'en', country: 'US, GB, AU' },
  { language: '일본어', lang_code: 'ja', country: 'JP' },
  { language: '중국어(간체)', lang_code: 'zh', country: 'CN' },
  { language: '프랑스어', lang_code: 'fr', country: 'FR, CA' },
  { language: '독일어', lang_code: 'de', country: 'DE' },
  { language: '스페인어', lang_code: 'es', country: 'ES, MX' },
  { language: '러시아어', lang_code: 'ru', country: 'RU' },
  { language: '이탈리아어', lang_code: 'it', country: 'IT' },
  { language: '베트남어', lang_code: 'vi', country: 'VN' },
  { language: '태국어', lang_code: 'th', country: 'TH' }
])
watch(iptPlaceDescriptionCheck, (newCodes) => {
  // 배열이 아닌 경우 빈 배열로 초기화
  if (!Array.isArray(iptPlaceDescription.value)) {
    iptPlaceDescription.value = []
  }
  // 선택되지 않은 언어의 description 제거
  iptPlaceDescription.value = iptPlaceDescription.value.filter((desc: any) =>
    newCodes.includes(desc.lang_code)
  )
  // 새로 추가된 언어의 description 객체 추가
  newCodes.forEach((lang_code) => {
    if (!iptPlaceDescription.value.some((desc: any) => desc.lang_code === lang_code)) {
      const langObj = languages.value.find((lang: any) => lang.lang_code === lang_code)
      const country = Array.isArray(langObj?.country) ? langObj.country[0] : langObj?.country || ''
      iptPlaceDescription.value.push({ lang_code, country, description: '' })
    }
  })
})

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
    iptDuration.value = res?.data?.duration
    iptLandmarkUrl.value = res?.data?.landmark_url || '' // Load landmark URL from API
    landmarkPreview.value = res?.data?.landmark_url || '' // Set preview as well
    menus.value = res?.data?.menus
    hasHashtags.value = res?.data?.hashtags
    photos.value = res?.data?.photos
    iptPlaceDescription.value = res?.data?.descriptions

    // 선택된 언어 코드 동기화
    iptPlaceDescription.value.forEach((item: any) => {
      if (!iptPlaceDescriptionCheck.value.includes(item.lang_code)) {
        iptPlaceDescriptionCheck.value.push(item.lang_code)
      }
    })
    if (res?.data?.operating_hours?.length) operatingHours.value = res?.data?.operating_hours
    await showMap()
  }
}

const updatePlace = async () => {
  const sanitizedData = operatingHours.value.map(({ is_show, ...rest }) => rest)
  const res = await updatePlaceAPI(String(route.params.id), {
    name: iptPlaceName.value,
    category:
      typeof iptPlaceCategory.value === 'number'
        ? iptPlaceCategory.value
        : iptPlaceCategory.value.category_id,
    address: iptPlaceAddress.value,
    latitude: iptPlaceLatitude.value,
    longitude: iptPlaceLongitude.value,
    duration: Number(iptDuration.value),
    landmark_url: iptLandmarkUrl.value, // Include landmark_url in update
    descriptions: iptPlaceDescription.value,
    menus: menus.value,
    operating_hours: sanitizedData,
    photo_ids: photos.value.map((item) => item.photo_id)
  })
  if (res?.status === 200) {
    getPlacesDetail()
    toast.success('Success Updated Place')
    return
  }
  toast.error('Error Updating Place')
}
const getCategories = async () => {
  const res = await getCategoriesAPI()
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

// Process and upload image file (common function for both regular photos and landmark images)
const processImageUpload = async (file: File, isLandmark: boolean = false) => {
  console.log(file)
  // HEIC 파일인 경우 JPEG로 변환
  if (file?.type === 'image/heic' || file?.name.toLowerCase().endsWith('.heic')) {
    try {
      const convertedBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.8
      })
      file = new File([convertedBlob as Blob], file.name.replace(/\.heic$/i, '.jpg'), {
        type: 'image/jpeg'
      })
    } catch (err) {
      console.error('HEIC conversion failed', err)
      return
    }
  }

  const reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onload = (event) => {
    const img = new Image()
    img.src = event.target?.result as string
    img.onload = () => {
      const MAX_WIDTH = 1800
      const MAX_HEIGHT = 1800
      let { width, height } = img

      if (width > height) {
        if (width > MAX_WIDTH) {
          height = Math.floor(height * (MAX_WIDTH / width))
          width = MAX_WIDTH
        }
      } else {
        if (height > MAX_HEIGHT) {
          width = Math.floor(width * (MAX_HEIGHT / height))
          height = MAX_HEIGHT
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        async (blob) => {
          if (blob) {
            let res: any = null
            const formData = new FormData()
            formData.append('file', blob, file.name)

            // For landmark uploads, set a special flag
            if (isLandmark) {
              formData.append('is_landmark', 'true')
              res = await uploadLandmarkFileAPI(String(route.params.id), formData)
            } else {
              res = await uploadPlaceFileAPI(String(route.params.id), formData)
            }
            // If this is a landmark image, update the landmark_url field
            if (isLandmark && res?.status === 200 && res?.data?.url) {
              iptLandmarkUrl.value = res.data.url
              landmarkPreview.value = res.data.url
              toast.success('Landmark image uploaded successfully')
            } else {
              // Otherwise, refresh all place data
              getPlacesDetail()
            }
          }
        },
        file.type,
        0.8
      )
    }
  }
}

// Regular photo upload
const thumbUpload = async (file: File) => {
  await processImageUpload(file)
}

// Landmark image upload
const landmarkUpload = async (file: File) => {
  await processImageUpload(file, true)
}

const delPlaceFile = async (file: any) => {
  const res = await delPlaceFileAPI(String(route.params.id), String(file.photo_id))
  console.log(res)
  getPlacesDetail()
}

const changeGeocode = async () => {
  if (!iptPlaceAddress.value) return
  if (!google.maps) {
    console.error('Google Maps가 올바르게 로드되지 않았습니다.')
    return
  }
  // const {Geocoder} = await google.maps.importLibrary('geocoding')
  const { Geocoder } = await google.maps.importLibrary('geocoding')
  const geocoder = new Geocoder()
  geocoder
    .geocode({ address: iptPlaceAddress.value })
    .then(async ({ results }) => {
      if (results && results.length > 0) {
        const location = results[0].geometry.location
        iptPlaceLatitude.value = location.lat()
        iptPlaceLongitude.value = location.lng()
        showMap()
        console.log('Latitude:', location.lat(), 'Longitude:', location.lng())
        // 지도의 중심을 geocoding 결과로 업데이트 (옵션)
      } else {
        console.error('Geocoding 결과가 없습니다.')
      }
    })
    .catch((e: any) => window.alert('Geocoder failed due to: ' + e))
}
const showMap = async () => {
  await nextTick()
  const mapDiv = document.getElementById('instMap')
  if (!mapDiv) {
    return
  }
  if (iptPlaceLatitude.value == null || iptPlaceLongitude.value == null) {
    return
  }

  try {
    const { Map } = await google.maps.importLibrary('maps')
    const { Marker } = await google.maps.importLibrary('marker')

    // Create map
    const map = new Map(mapDiv, {
      center: { lat: iptPlaceLatitude.value, lng: iptPlaceLongitude.value },
      zoom: 17,
      disableDefaultUI: true
    })

    // Create marker
    let marker = new Marker({
      map,
      position: { lat: iptPlaceLatitude.value, lng: iptPlaceLongitude.value },
      title: 'Place Location',
      draggable: true // Make marker draggable
    })

    // Add click listener to the map
    map.addListener('click', (event) => {
      // Update marker position
      marker.setPosition(event.latLng)

      // Update the latitude and longitude fields
      iptPlaceLatitude.value = event.latLng.lat()
      iptPlaceLongitude.value = event.latLng.lng()
    })

    // Add drag end listener to the marker
    marker.addListener('dragend', () => {
      const position = marker.getPosition()
      if (position) {
        // Update the latitude and longitude fields
        iptPlaceLatitude.value = position.lat()
        iptPlaceLongitude.value = position.lng()
      }
    })
  } catch (error) {
    console.error('Error initializing map:', error)
  }
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

const landmarkFileUpload = () => {
  landmarkFileRef.value?.click()
}

// Function to clear the landmark image
const clearLandmarkUrl = () => {
  iptLandmarkUrl.value = ''
  landmarkPreview.value = ''
}

// 초기 실행
onMounted(async () => {
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
                <!-- Landmark URL Field -->
                <v-col cols="12">
                  <v-text-field
                    v-model="iptPlaceAddress"
                    append-inner-icon="mdi-magnify"
                    label="Address"
                    density="compact"
                    variant="outlined"
                    hide-details
                    clearable
                    :rules="[rules.required]"
                    @click:append-inner="changeGeocode"
                  />
                  <div
                    id="instMap"
                    style="width: 100%"
                    :style="[
                      iptPlaceLatitude && iptPlaceLongitude ? 'height: 500px;' : 'height: 0;'
                    ]"
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
                    v-model="iptDuration"
                    label="Duration"
                    density="compact"
                    variant="outlined"
                    suffix="min"
                    hide-details
                    clearable
                  />
                </v-col>
                <v-col cols="12">
                  <div class="d-flex align-center gap-3 mb-3">
                    <div class="text-subtitle-2">Landmark Image</div>
                    <v-spacer></v-spacer>
                    <v-btn
                      size="small"
                      color="primary"
                      density="compact"
                      variant="text"
                      prepend-icon="mdi-upload"
                      @click="landmarkFileUpload"
                    >
                      Upload
                    </v-btn>
                    <v-btn
                      v-if="landmarkPreview"
                      size="small"
                      color="error"
                      density="compact"
                      variant="text"
                      prepend-icon="mdi-delete"
                      @click="clearLandmarkUrl"
                    >
                      Remove
                    </v-btn>
                  </div>

                  <div v-if="iptLandmarkUrl" class="d-flex gap-2">
                    <!-- Preview area (smaller height) -->
                    <div class="landmark-preview flex-grow-0 mr-2" style="width: 120px">
                      <v-img
                        :src="landmarkPreview"
                        height="80"
                      />
                    </div>

                    <!-- URL input field -->
                    <v-textarea
                      v-model="iptLandmarkUrl"
                      density="compact"
                      variant="outlined"
                      hide-details
                      readonly
                      rows="3"
                    />
                  </div>

                  <!-- Hidden file input -->
                  <v-file-input
                    ref="landmarkFileRef"
                    accept="image/png, image/jpeg, image/bmp, image/heic"
                    class="d-none"
                    @update:modelValue="landmarkUpload"
                  />
                </v-col>
                <v-col cols="12">
                  <v-divider></v-divider>
                  <p class="d-flex w-100 justify-space-between">Description</p>
                  <v-chip-group v-model="iptPlaceDescriptionCheck" column multiple>
                    <v-chip
                      v-for="(l, idx) in languages"
                      :key="`languages${idx}`"
                      :text="l.country"
                      :value="l.lang_code"
                      variant="outlined"
                      filter
                    ></v-chip>
                  </v-chip-group>
                  <div
                    v-for="(d, idx) in iptPlaceDescription"
                    :key="`description${idx}`"
                    style="position: relative"
                  >
                    <quill-editor
                      v-model:content="d.description"
                      :options="editorOption"
                      :value="d.description"
                      :contentType="'html'"
                      :placeholder="d.country"
                    />
                  </div>
                </v-col>
              </v-row>
              <v-row no-gutters class="ga-2 mt-8">
                <v-divider></v-divider>
                <p class="d-flex w-100 justify-space-between">
                  Menus
                  <v-btn
                    density="compact"
                    icon
                    @click="
                      menus.push({ menu_category: '', menu_name: '', price: '', description: '' })
                    "
                  >
                    <v-icon>mdi-plus</v-icon>
                  </v-btn>
                </p>
                <draggable
                  v-model="menus"
                  @start="drag = true"
                  @end="drag = false"
                  animation="200"
                  ghostClass="ghost"
                  item-key="photo_id"
                  class="w-100"
                >
                  <template #item="{ element, index }">
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
                          <tr v-if="!t.is_closed">
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
                          <tr v-if="!t.is_closed">
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
                          <tr v-if="!t.is_closed">
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
                          <tr v-if="!t.is_closed">
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

              <v-btn block @click.prevent="updatePlace" color="primary"
              ><strong>Update</strong></v-btn
              >
            </v-card-text>
          </v-form>
        </v-card>
      </v-col>
      <v-col cols="12" xs="12" sm="12" md="6" xl="4" xxl="4">
        <v-card title="Photo Add" color="white">
          <template #append>
            <v-btn density="compact" icon @click="placeFileUpload">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </template>
          <v-card-text>
            <draggable
              v-model="photos"
              group="people"
              @start="drag = true"
              @end="drag = false"
              animation="200"
              ghostClass="ghost"
              item-key="photo_id"
              tag="v-row"
              class="mt-2x"
            >
              <template #item="{ element }">
                <v-col class="position-relative" cols="4">
                  <v-img :src="element.url" aspect-ratio="1" class="bg-grey-lighten-2" cover>
                    <template v-slot:placeholder>
                      <v-row align="center" class="fill-height ma-0" justify="center">
                        <v-progress-circular
                          color="grey-lighten-5"
                          indeterminate
                        ></v-progress-circular>
                      </v-row>
                    </template>
                  </v-img>
                  <v-btn
                    density="compact"
                    icon="mdi-delete-circle"
                    class="position-absolute top-0 right-0"
                    @click="delPlaceFile(element)"
                  />
                </v-col>
              </template>
            </draggable>
            <v-file-input
              ref="placeFileRef"
              accept="image/png, image/jpeg, image/bmp, image/heic"
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
              <v-btn
                color="primary"
                @click="addSpecialDays"
                class="w-50"
                :block="
                  activeSpecialDays.findIndex((day) => day.special_date === iptSpecialday) === -1
                "
              >
                Apply day
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style lang="scss">
.ghost {
  opacity: 0.5;
}
</style>