<script setup lang="ts">
import { ref, nextTick, defineProps, watch, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPlacesDetailAPI } from '@/network/app'
import NOTHUMB from '@/assets/images/img_noimage.png'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const dialog = ref<boolean>(false)
const detail = ref<object | null>(null)
const loading = ref<boolean>(false)
const today = dayjs().format('dddd')
const chipGroup = ref<HTMLFormElement | null>(null)

watch(
  () => route.query,
  (newId, oldId) => {
    console.log(newId, oldId)
    if (newId.place) {
      getPlacesDetail()
      dialog.value = true
    } else {
      setTimeout(() => {
        detail.value = null
      }, 100)
      dialog.value = false
    }
  }
)
const getPlacesDetail = async () => {
  if (!route.query?.place) return
  loading.value = true
  const res = await getPlacesDetailAPI(String(route.query.place))
  detail.value = res.data
  loading.value = false
  nextTick(() => {
    const groupEl = chipGroup.value?.$el
    const todayChip = groupEl?.querySelector('[data-today="true"]')
    if (todayChip) {
      todayChip.scrollIntoView({ behavior: 'smooth', inline: 'center' })
    }
  })
}
onMounted(async () => {
  console.log('PlaceDetail Mounted')
})
</script>

<template>
  <v-dialog v-model="dialog" transition="dialog-bottom-transition" class="place-detail" fullscreen>
    <v-toolbar elevation="0" density="compact" class="toolbar">
      <v-btn color="black" icon="mdi-close" @click="router.go(-1)" />
      <v-spacer></v-spacer>
    </v-toolbar>
    <v-card :disabled="loading" :loading="loading" class="w-100 mx-auto content overflow-x-hidden overflow-y-auto">
      <template v-slot:loader="{ isActive }">
        <v-progress-linear
          :active="isActive"
          color="deep-purple"
          height="4"
          indeterminate
        ></v-progress-linear>
      </template>
      <v-img v-if="!detail?.photos?.length" aspect-ratio="16/9" :src="NOTHUMB" />
      <tamplate v-else>
        <v-img aspect-ratio="16/9" :src="detail?.photos[0]?.url" />
      </tamplate>

      <v-card-item>
        <v-card-title>{{ detail?.name }}</v-card-title>
        <v-card-subtitle>
          <span class="me-1">{{ detail?.category?.name }}</span>
          <v-icon color="error" icon="mdi-fire-circle" size="small"></v-icon>
        </v-card-subtitle>
      </v-card-item>

      <v-card-text>
        <v-row align="center" class="mx-0">
          <v-rating
            :model-value="4.5"
            color="amber"
            density="compact"
            size="small"
            half-increments
            readonly
          />
          <div class="text-grey ms-4">4.5 (413)</div>
        </v-row>
        <div v-if="detail?.descriptions?.length">
          {{ detail?.descriptions[0]?.description }}
        </div>
        <v-divider class="mt-8 mb-4"></v-divider>
        <v-chip-group ref="chipGroup" class="operating-hours-chip-group">
          <v-chip
            v-for="(t, idx) in detail?.operating_hours"
            :key="`time${idx}`"
            color="primary"
            :variant="t.day_of_week === today ? 'elevated' : 'outlined'"
            :data-today="t.day_of_week === today ? 'true' : 'false'"
            size="x-small"
          >
            {{ t.day_of_week }}:
            <template v-if="t.is_closed">
              Closed
            </template>
            <template v-else>
              <template v-if="!t.open_time && !t.close_time">
                24 Hours Open
              </template>
              <template v-else>
                {{ t.open_time ? t.open_time : '-' }} ~ {{ t.close_time ? t.close_time : '-' }}
              </template>
              <span v-if="t.break_start && t.break_end">
          (Break: {{ t.break_start }} ~ {{ t.break_end }})
        </span>
            </template>
          </v-chip>
        </v-chip-group>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style lang="scss">
.place-detail {
  .toolbar {
    position: relative;
    z-index: 9;
    background-color: transparent;
  }
  .content {
    margin-top: -48px;
  }
}
</style>
