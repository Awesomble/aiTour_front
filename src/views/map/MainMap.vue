<script setup lang="ts">
import { watch, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MainMap from '@/components/maps/index.vue'
import { getMainCategoriesAPI } from '@/network/app'

defineOptions({
  name: 'main-map'
})

const route = useRoute()
const router = useRouter()
const mapComponent = ref(null)
const mountIdx = ref(1)
const mainCategoryList = ref<object[] | null>(null)
const iptMainCategoryList = ref<number[]>([0])

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

watch(
  iptMainCategoryList,
  (newValue, oldValue) => {
    try {
      window.AndroidInterface.vibrate(2)
    } catch (err: any) {}
    if (!newValue.length) {
      iptMainCategoryList.value = [0]
      return
    }
    // 조건 2 & 3: 0과 다른 값이 함께 있을 때
    if (newValue.includes(0) && newValue.some((val) => val !== 0)) {
      // 0이 새로 추가되었는지 확인
      const zeroJustAdded = !oldValue.includes(0) && newValue.includes(0)
      if (zeroJustAdded) {
        // 조건 3: 0이 추가되었으면 [0]으로 설정
        iptMainCategoryList.value = [0]
      } else {
        // try {
        //   window.AndroidInterface.vibratePattern('success')
        // } catch (err: any) {}
        iptMainCategoryList.value = newValue.filter((val) => val !== 0)
      }
      return
    }
  },
  { deep: true }
)

// Navigate to user's location
const goToMyLocation = () => {
  if (mapComponent.value) {
    mapComponent.value.myLocationCall()
  }
}
const getMainCategories = async () => {
  const res = await getMainCategoriesAPI()
  if (res?.status === 200) {
    mainCategoryList.value = res?.data
  }
}
onMounted(() => {
  getMainCategories()
})
</script>

<template>
  <v-container class="pa-0 h-100 w-100" style="max-width: 100%; position: relative">
    <MainMap
      ref="mapComponent"
      :initial-center="{ lat: 37.5663, lng: 126.9779 }"
      :initial-zoom="16"
      :categories="[]"
      :active-category="mountIdx"
      @marker-click="handleMarkerClick"
    >
      <template #floating-controls>
        <!-- Category selector buttons -->
        <v-chip-group
          v-if="mainCategoryList?.length"
          v-model="iptMainCategoryList"
          multiple
          class="cate-box"
        >
          <v-chip text="🔥 Hot" :value="0" variant="flat" color="white" class="custom-chip" />
          <v-chip
            v-for="(cate, idx) in mainCategoryList"
            :key="cate.main_category_id"
            :value="idx + 1"
            :text="`${cate.icon} ${cate.name}`"
            variant="flat"
            class="custom-chip"
          />
        </v-chip-group>
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
.btn-floating {
  position: fixed;
  right: 15px;
  bottom: 180px;
  z-index: 99;
  background: linear-gradient(135deg, #1483c2, #2575fc);
  border-radius: 50%;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.btn-floating.active {
  animation: heartbeat 0.6s infinite;
}

@keyframes heartbeat {
  0% {
    transform: scale(1);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
}
.cate-box {
  position: absolute;
  left: 0;
  top: 30px;
  top: calc(30px + var(--status-bar-height));
  display: flex;
  flex-wrap: nowrap;
  gap: 10px;
  white-space: nowrap;
  overflow-x: auto;
  padding: 10px;
  scrollbar-width: none; /* Firefox에서 스크롤바 숨김 */
}

.cate-box::-webkit-scrollbar {
  display: none; /* Chrome, Safari에서 스크롤바 숨김 */
}

.custom-chip {
  background-color: rgba(255, 255, 255, 0.3) !important; /* 반투명 배경 */
  backdrop-filter: blur(8px); /* 블러 효과 */
  -webkit-backdrop-filter: blur(8px); /* Safari 지원 */
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 9999px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.1s ease;
  color: #222 !important; /* 텍스트 색상 진하게 */
  font-weight: 500; /* 텍스트 약간 두껍게 */
  text-shadow: 0 0 1px rgba(255, 255, 255, 0.5); /* 텍스트 가독성 향상 */
}

.custom-chip.v-chip--selected {
  background-color: rgba(25, 118, 210, 0.75) !important; /* 액티브 시 색상 */
  color: white !important;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.9);
}
</style>
