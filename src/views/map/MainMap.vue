<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MainMap from '@/components/maps/MainMap.vue'
import { Toilet, Camera } from 'lucide-vue-next'

defineOptions({
  name: 'main-map'
})

const route = useRoute()
const router = useRouter()
const mapComponent = ref(null)
const mountIdx = ref(1)

// Category definitions
const categories = [
  { id: 83, icon: Camera, name: 'Photo Spots' },
  { id: [77, 82], icon: Toilet, name: 'Restrooms' }
]

// Handle marker click
const handleMarkerClick = async (placeId: any) => {
  // 현재 쿼리 파라미터에서 place만 제외한 다른 파라미터 유지
  const { place: _, ...restQuery } = route.query

  if (route.query.place) {
    // 먼저 place를 제거한 URL로 히스토리 상태 대체 (히스토리 추가 없음)
    await router.replace({ query: restQuery })

    // 그 다음 새로운 place로 이동 (히스토리에 추가)
    await router.push({ query: { ...restQuery, place: placeId } })
  } else {
    // place가 없는 경우 바로 이동
    await router.push({ query: { ...restQuery, place: placeId } })
  }
}

// Set active category
const setCategory = (categoryIds: any, idx: any) => {
  mountIdx.value = idx
  if (mapComponent.value) {
    mapComponent.value.setActiveCategory(idx)
  }
}

// Navigate to user's location
const goToMyLocation = () => {
  if (mapComponent.value) {
    mapComponent.value.myLocationCall()
  }
}
</script>

<template>
  <v-container class="pa-0 h-100 w-100" style="max-width: 100%; position: relative;">
    <MainMap
      ref="mapComponent"
      :initial-center="{ lat: 37.5663, lng: 126.9779 }"
      :initial-zoom="16"
      :categories="categories[mountIdx]?.id || []"
      :active-category="mountIdx"
      @marker-click="handleMarkerClick"
    >
      <template #floating-controls>
        <!-- Category selector buttons -->
        <div class="mounter">
          <ul>
            <li v-for="(category, idx) in categories" :key="idx">
              <v-btn
                :color="mountIdx === idx ? 'primary' : 'white'"
                @click="setCategory(category.id, idx)"
                icon
              >
                <component :is="category.icon" :stroke-width="1" />
              </v-btn>
            </li>
          </ul>
        </div>

        <!-- My location button -->
        <v-btn
          class="btn-floating"
          icon="mdi-image-filter-center-focus"
          color="primary"
          @click="goToMyLocation"
        />
      </template>
    </MainMap>
  </v-container>
</template>

<style lang="scss">
.mounter {
  position: fixed;
  right: 20px;
  bottom: 140px;
  z-index: 99;
  ul {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    padding: 10px 0 8px;
    gap: 10px;
    li {
      a {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 50px;
        height: 50px;
        border: 4px solid #1483c2;
        border-radius: 50px;
        background-color: #fff;
        color: #000;
        font-size: 14px;
      }
    }
  }
}

.btn-floating {
  position: fixed;
  right: 20px;
  bottom: 80px;
  z-index: 99;
}
</style>