<script setup lang="ts">
import { ref, onBeforeMount, watch } from 'vue'
import { getPlacesAPI, addPlaceAPI, delPlaceAPI, getCategoriesAPI } from '@/network/admin'
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
const categories = ref<object[]>([])
const isShowDialog = ref<boolean>(false)
const iptSearch = ref('')

const rules = ref({
  required: (value: string) => !!value || 'Required.'
})

// v-data-table에 사용할 헤더
const headers = ref([
  { key: 'name', title: 'Name' },
  { key: 'category.name', title: 'Category' },
  { key: 'address', title: 'Address' },
  { key: 'action', title: 'Action', align: 'end' }
])

watch(
  () => isShowDialog.value,
  async (newVal) => {
     if (!categories.value.length) getCategories()
  }
)

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
    description: iptPlaceDescription.value
  }
  const res = await addPlaceAPI(newPlace)
  if (res?.status === 200) {
    // 입력 필드 초기화
    formRef.value.reset()
    getPlaces()
  }
  isShowDialog.value =false
}

const goPlaceDetail = (id: string) => {
  router.push({ name: 'admin-place-detail', params: { id: id } })
}

const getCategories = async () => {
  const res= await getCategoriesAPI()
  if (res?.status === 200 && res?.data) {
    categories.value = res?.data
  }
}

const delPlace = async (id: string) => {
  const res = await delPlaceAPI(id)
  if (res?.status === 200) {
    console.log(res)
  }
  getPlaces()
}

// 초기 실행
onBeforeMount(() => {
  getPlaces()
})
</script>

<template>
  <v-container fluid class="pa-0">
    <v-row>
      <v-col cols="12" v-if="places.length">
        <v-card :title="`Place List(${places.length})`" width="auto">
          <template #append>
            <v-btn density="compact" icon @click="isShowDialog = true">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </template>
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
              height="500"
            >
              <template v-slot:item.name="{ item }">
                <a
                  class="data-table-link"
                  href="javascript:;"
                  @click="goPlaceDetail(item.place_id)"
                >{{ item.name }}</a>
              </template>
              <template v-slot:item.action="{ item }">
                <v-btn density="compact" color="red" @click="delPlace(item.place_id)"> Delete </v-btn>
              </template>
            </v-data-table-virtual>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-dialog v-model="isShowDialog" width="auto">
      <v-card prepend-icon="mdi-account" title="Add Category">
        <v-card title="Place Add">
          <v-form ref="formRef">
            <v-card-text>
              <v-row no-gutters>
                <v-col cols="12">
                  <v-text-field
                    v-model="iptPlaceName"
                    label="Name"
                    density="compact"
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
                    hide-details
                    single-line
                    :rules="[rules.required]"
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="iptPlaceLatitude"
                    label="Latitude"
                    density="compact"
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
                    hide-details
                    clearable
                    :rules="[rules.required]"
                  />
                </v-col>
              </v-row>
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="primary" text="Save" variant="tonal" @click="addPlace">Add</v-btn>
            </v-card-actions>
          </v-form>
        </v-card>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped lang="scss">
.data-table-link {
  text-decoration: none;
  color: blue;
  font-weight: bold;
}
</style>
