<script setup lang="ts">
import { ref, onBeforeMount } from 'vue'
import { getPlacesAPI, addPlaceAPI, updatePlaceAPI, delPlaceAPI } from '@/network/admin'
import { useRouter } from 'vue-router' // 실제 경로에 맞게 수정

const router = useRouter()
const formRef = ref<HTMLFormElement | null>(null)
const places = ref<any[]>([])
const iptPlaceName = ref('')
const iptPlaceCategory = ref('')
const iptPlaceAddress = ref('')
const iptPlaceLatitude = ref<number | null>(null)
const iptPlaceLongitude = ref<number | null>(null)
const iptPlaceDescription = ref<string>('')
const iptPlaceCost = ref<number | null>(null)

// 검색어
const iptSearch = ref('')

const rules = ref({
  required: (value: string) => !!value || 'Required.'
})

// v-data-table에 사용할 헤더
const headers = ref([
  { key: 'place_id', title: 'ID' },
  { key: 'name', title: 'Name' },
  { key: 'category', title: 'Category' },
  { key: 'address', title: 'Address' },
  { key: 'action', title: 'Action', align: 'end' }
])

// place 목록 불러오기
const getPlaces = async () => {
  const res = await getPlacesAPI()
  if (res?.data) {
    places.value = res.data
  } else {
    places.value = []
  }
}

// place 추가
const addPlace = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  const newPlace = {
    name: iptPlaceName.value,
    category: iptPlaceCategory.value,
    address: iptPlaceAddress.value,
    latitude: iptPlaceLatitude.value,
    longitude: iptPlaceLongitude.value,
    cost: iptPlaceCost.value,
    description: iptPlaceDescription.value
  }
  const res = await addPlaceAPI(newPlace)
  if (res?.status === 200) {
    // 입력 필드 초기화
    formRef.value.reset()
    getPlaces()
  }
}

const goPlaceDetail = async (id: string) => {
  router.push({ name: 'admin-place-detail', params: { id: id } })
}
// place 수정 (간단 예시)
// 실제론 별도 다이얼로그나 폼을 통해 수정 로직 구현 가능
const updatePlace = async (item: any) => {
  const res = await updatePlaceAPI(item.place_id, {
    name: item.name,
    category: item.category,
    address: item.address
  })
  if (res?.status === 200) {
    getPlaces()
  }
}

// 초기 실행
onBeforeMount(() => {
  getPlaces()
})
</script>

<template>
  <v-row>
    <v-col cols="12" v-if="places.length">
      <v-card title="Place List">
        <v-card-text>
          <!-- 검색 필드 -->
          <v-text-field
            v-model="iptSearch"
            label="Search"
            prepend-inner-icon="mdi-magnify"
            single-line
            hide-details
            class="mb-4"
          />
          <v-data-table-virtual
            :headers="headers"
            :items="places"
            :search="iptSearch"
            dense
            outlined
          >
            <template v-slot:item.place_id="{ item }">
              <a
                class="data-table-link"
                href="javascript:;"
                @click="goPlaceDetail(item.place_id)"
              >{{ item.place_id }}</a>
            </template>
            <template v-slot:item.action="{ item }">
              <v-btn density="compact" color="red" @click="delPlace(item.place_id)"> Delete </v-btn>
            </template>
          </v-data-table-virtual>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col cols="12">
      <v-card title="Place Add">
        <v-form ref="formRef">
          <v-card-text>
            <v-row no-gutters>
              <v-col cols="12" lg="6" md="12">
                <v-text-field
                  v-model="iptPlaceName"
                  label="Name"
                  density="compact"
                  hide-details
                  clearable
                  :rules="[rules.required]"
                />
              </v-col>
              <v-col cols="12" lg="6" md="12">
                <v-text-field
                  v-model="iptPlaceCategory"
                  label="Category"
                  density="compact"
                  hide-details
                  clearable
                  :rules="[rules.required]"
                />
              </v-col>
              <v-col cols="12" lg="6" md="12">
                <v-text-field
                  v-model="iptPlaceAddress"
                  label="Address"
                  density="compact"
                  hide-details
                  single-line
                  :rules="[rules.required]"
                />
              </v-col>
              <v-col cols="12" lg="6" md="12">
                <v-text-field
                  v-model="iptPlaceLatitude"
                  label="Latitude"
                  density="compact"
                  hide-details
                  clearable
                  :rules="[rules.required]"
                />
              </v-col>
              <v-col cols="12" lg="6" md="12">
                <v-text-field
                  v-model="iptPlaceLongitude"
                  label="Longitude"
                  density="compact"
                  hide-details
                  clearable
                  :rules="[rules.required]"
                />
              </v-col>
              <v-col cols="12" lg="6" md="12">
                <v-text-field
                  v-model="iptPlaceCost"
                  label="Cost"
                  density="compact"
                  hide-details
                  clearable
                  :rules="[rules.required]"
                />
              </v-col>
              <v-col cols="12" lg="6" md="12">
                <v-textarea
                  v-model="iptPlaceDescription"
                  label="Description"
                  density="compact"
                  hide-details
                  clearable
                  :rules="[rules.required]"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-form>
        <v-card-actions class="justify-center">
          <v-btn variant="tonal" color="white" class="w-25" @click.prevent="addPlace">Add</v-btn>
        </v-card-actions>
      </v-card>
    </v-col>
  </v-row>
</template>

<style scoped lang="scss">
.data-table-link {
  text-decoration: none;
  color: blue;
  font-weight: bold;
}
</style>
