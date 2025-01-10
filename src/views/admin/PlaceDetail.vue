<script setup lang="ts">
import { ref, onBeforeMount } from 'vue'
import { getHashtagsAPI, getPlacesDetailAPI, updatePlaceAPI } from '@/network/admin'
import { useRoute, useRouter } from 'vue-router' // 실제 경로에 맞게 수정

const router = useRouter()
const route = useRoute()
const formRef = ref<HTMLFormElement | null>(null)
const hashtags = ref<any[]>([])
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

const rules = ref({
  required: (value: string) => !!value || 'Required.'
})
const removeHashtag = (id: number) => {
  const idx = hasHashtags.value.findIndex((tag) => tag.hashtag_id === id)
  if (idx !== -1) {
    hasHashtags.value.splice(idx, 1) // 인덱스 위치에서 1개 항목 제거
  }
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
    res?.data?.hashtags.forEach(itm => {
      hasHashtags.value.push(itm.hashtag_id)
    })
  }
}

const updatePlace = async () => {
  const res = await updatePlaceAPI(route.params.id, {
    name: iptPlaceName.value,
    category: iptPlaceCategory.value,
    address: iptPlaceAddress.value,
    latitude: iptPlaceLatitude.value,
    longitude: iptPlaceLongitude.value,
    cost: iptPlaceCost.value,
    description: iptPlaceDescription.value,
    hashtags: hasHashtags.value
  })
  if (res?.status === 200) {
    getPlacesDetail()
  }
}

const getHashtags = async () => {
  const res = (await getHashtagsAPI()) as any // Replace with the correct type if known
  if (res?.data) {
    hashtags.value = res.data
  } else {
    hashtags.value = [] // Fallback to an empty array
  }
}

// 초기 실행
onBeforeMount(() => {
  getPlacesDetail()
  getHashtags()
})
</script>

<template>
  <v-row>
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
          <v-card-text>
            <v-data-table-virtual
              dense
              outlined
              :headers="headers"
              :items="hashtags"
              :search="iptSearch"
            >
              <template v-slot:item.action="{ item }">
                <v-btn
                  v-if="!hasHashtags.includes(item.hashtag_id)"
                  density="compact"
                  color="blue"
                  @click="hasHashtags.push(item.hashtag_id)"
                  >추가</v-btn
                >
                <v-btn v-else density="compact" color="red" @click="removeHashtag(item.hashtag_id)"
                  >해제</v-btn
                >
              </template>
            </v-data-table-virtual>
          </v-card-text>
        </v-form>
        <v-card-actions class="justify-center">
          <v-btn variant="tonal" color="white" class="w-25" @click.prevent="updatePlace"
            >Update</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-col>
  </v-row>
</template>

<style scoped lang="scss"></style>
