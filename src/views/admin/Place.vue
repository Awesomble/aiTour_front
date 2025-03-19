<script setup lang="ts">
import { ref, onBeforeUnmount, watch, nextTick, useTemplateRef, onMounted } from 'vue'
import { getPlacesAPI, addPlaceAPI, delPlaceAPI, getCategoriesAPI } from '@/network/admin'
import { useRouter } from 'vue-router'
import { vInfiniteScroll } from '@vueuse/components'
import { useToast } from 'vue-toastification'

const router = useRouter()
const toast = useToast()
const formRef = ref<HTMLFormElement | null>(null)
const placesList = ref<any[]>([])
const iptPlaceName = ref('')
const iptPlaceCategory = ref('')
const iptPlaceAddress = ref('')
const categories = ref<object[]>([])
const isShowDialog = ref<boolean>(false)
const iptQueryName = ref<string>('')
const iptQueryCategiry = ref<number[]>([])
const iptQueryAdress = ref<string>('')
const page = ref<number>(0)
const totalPage = ref<number>(0)
const totalCnt = ref<number>(1)
const loadingError = ref(false)
const isLoading = ref(false) // 로딩 상태 추가
const retryCount = ref(0) // 재시도 카운트 추가
const maxRetries = 3 // 최대 재시도 횟수

const rules = ref({
  required: (value: string) => !!value || 'Required.'
})

// place 목록 불러오기
const getPlaces = async () => {
  // 이미 오류가 발생했거나 로딩 중이면 호출 중단
  if (loadingError.value || isLoading.value) return;

  // 이미 모든 데이터를 불러왔으면 호출 중단
  if (placesList.value.length >= totalCnt.value && totalCnt.value > 0) return;

  isLoading.value = true
  page.value++

  try {
    const res = await getPlacesAPI(page.value, iptQueryCategiry.value, iptQueryName.value, iptQueryAdress.value)
    if (res?.data?.items) {
      placesList.value.push(...res.data.items)
      totalPage.value = res.data.total_pages
      totalCnt.value = res.data.total_count
      // 성공적으로 데이터를 가져오면 재시도 카운트 초기화
      retryCount.value = 0
    }
  } catch (error) {
    console.error("Error fetching places", error)

    // 재시도 횟수가 최대 재시도 횟수보다 적으면 다시 시도
    if (retryCount.value < maxRetries) {
      retryCount.value++
      page.value-- // 실패한 페이지 다시 시도
      toast.warning(`Loading failed. Retrying... (${retryCount.value}/${maxRetries})`)

      // 1초 후에 다시 시도
      setTimeout(() => {
        isLoading.value = false
        getPlaces()
      }, 1000)
      return
    }

    // 최대 재시도 횟수 초과
    loadingError.value = true
    toast.error(`Failed to load places after ${maxRetries} attempts. Please try again later.`)
  } finally {
    if (!loadingError.value) {
      isLoading.value = false
    }
  }
}

// 더 불러올 데이터가 있는지 체크
const canLoadMore = () => {
  return !loadingError.value && !isLoading.value && placesList.value.length < totalCnt.value
}

// 오류 상태 초기화 및 재시도 함수
const resetErrorAndRetry = () => {
  loadingError.value = false
  retryCount.value = 0
  resetList()
}

// place 추가
const addPlace = async () => {
  const { valid } = await formRef.value?.validate()
  if (!valid) return
  const newPlace = {
    name: iptPlaceName.value,
    category: iptPlaceCategory.value,
    address: iptPlaceAddress.value,
  }
  const res = await addPlaceAPI(newPlace)
  console.log(res)
  if (res?.status === 200) {
    // 입력 필드 초기화
    formRef.value?.reset()
    resetList()
    toast.success('Success Append Place')
    await router.push({ name: 'admin-place-detail', params: { id: res?.data?.place_id } })
    return
  }
  isShowDialog.value = false
  toast.error('Error Append Place')
}

const getCategories = async () => {
  try {
    const res = await getCategoriesAPI()
    if (res?.status === 200 && res?.data) {
      categories.value = res?.data
    }
  } catch (error) {
    console.error("Error fetching categories", error)
    toast.error("Failed to load categories")
  }
}

const delPlace = async (id: string) => {
  try {
    const res = await delPlaceAPI(id)
    if (res?.status === 200) {
      toast.success('Place deleted successfully')
      resetList()
    }
  } catch (error) {
    console.error("Error deleting place", error)
    toast.error('Failed to delete place')
  }
}

const resetList = () => {
  placesList.value = []
  page.value = 0
  totalCnt.value = 1
  loadingError.value = false
  retryCount.value = 0
  isLoading.value = false
  getPlaces()
}

// 초기 실행
onMounted(async () => {
  await getCategories()
  getPlaces()
})
</script>

<template>
  <v-container fluid class="pa-0">
    <v-row>
      <v-col cols="12">
        <v-card :title="`Place List(${totalCnt})`" width="auto">
          <template #append>
            <v-btn density="compact" icon @click="isShowDialog = true">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </template>
          <v-card-text>
            <!-- 검색 필드 -->
            <v-row no-gutters>
              <v-col cols="10" class="">
                <v-row no-gutters class="ga-1">
                  <v-col cols="4">
                    <v-autocomplete
                      v-model="iptQueryCategiry"
                      :items="categories"
                      color="blue-grey-lighten-2"
                      item-title="name"
                      item-value="category_id"
                      label="Category"
                      density="compact"
                      variant="outlined"
                      chips
                      closable-chips
                      multiple
                      hide-details
                    >
                      <template v-slot:chip="{ props, item }">
                        <v-chip v-bind="props" :text="item.raw.name"></v-chip>
                      </template>
                      <template v-slot:item="{ props, item }">
                        <v-list-item
                          v-bind="props"
                          :subtitle="item.raw.description"
                          :title="item.raw.name"
                        ></v-list-item>
                      </template>
                    </v-autocomplete>
                  </v-col>
                  <v-col cols="3">
                    <v-text-field
                      v-model="iptQueryName"
                      label="Name"
                      density="compact"
                      variant="outlined"
                      hide-details
                      clearable
                    />
                  </v-col>
                  <v-col cols="4">
                    <v-text-field
                      v-model="iptQueryAdress"
                      label="Adress"
                      density="compact"
                      variant="outlined"
                      hide-details
                      clearable
                    />
                  </v-col>
                </v-row>
              </v-col>
              <v-col cols="2" class="pl-4">
                <v-btn class="h-100 w-100" color="primary" @click="resetList">Search</v-btn>
              </v-col>
            </v-row>

            <v-divider class="my-6" />

            <!-- 에러 표시 영역 -->
            <v-alert
              v-if="loadingError"
              type="error"
              title="Failed to load places"
              text="An error occurred while loading the data."
              class="mb-4"
            >
              <template v-slot:append>
                <v-btn color="error" variant="text" @click="resetErrorAndRetry">
                  Try Again
                </v-btn>
              </template>
            </v-alert>

            <!-- 로딩 표시 -->
            <v-progress-linear
              v-if="isLoading"
              indeterminate
              color="primary"
              class="mb-4"
            ></v-progress-linear>

            <v-table
              style="display: block; height: calc(100vh - 300px); overflow: hidden; overflow-y: auto"
              v-infinite-scroll="[getPlaces, { distance: 10, canLoadMore }]"
            >
              <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Address</th>
                <th>Action</th>
              </tr>
              </thead>
              <tbody v-if="placesList?.length">
              <tr v-for="(item, idx) in placesList" :key="`list${idx}`">
                <td>
                  <router-link :to="{ name: 'admin-place-detail', params: { id: item?.place_id } }">{{ item?.name }}</router-link>
                </td>
                <td>{{ item?.category?.name }}</td>
                <td>{{ item?.address }}</td>
                <td>
                  <v-btn density="compact" color="red" @click="delPlace(item.place_id)">
                    Delete
                  </v-btn>
                </td>
              </tr>
              </tbody>
              <tbody v-else-if="!loadingError && !isLoading">
              <tr>
                <td colspan="4" class="text-center py-8">No places found</td>
              </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="isShowDialog" width="500">
      <v-card prepend-icon="mdi-map" title="Place Add">
        <v-form ref="formRef">
          <v-card-text>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="iptPlaceName"
                  label="Name"
                  density="compact"
                  variant="outlined"
                  hide-details
                  clearable
                  autofocus
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
                  single-line
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