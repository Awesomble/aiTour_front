<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, onActivated, Ref, computed } from 'vue'
import { useUserStore, useGlobalStore } from '@/store'
import { useRouter, useRoute } from 'vue-router'
import { getPlacesListAPI } from '@/network/app'
import { calculateRadiusBoundaries } from '@/composables/useGPS'
import { createLighterColor } from '@/components/maps/utils/mapHelpers'

// Composables 임포트
import useRadarState, { Place } from '@/components/radar/composables/useRadarState'
import useInteractions from '@/components/radar/composables/useInteractions'
import useGpsTransform from '@/components/radar/composables/useGpsTransform'

// 상태 관리 스토어 초기화
const userStore = useUserStore()
const globalStore = useGlobalStore()
const router = useRouter()
const route = useRoute()

// 레이더 컨테이너 참조
const radarContainer: Ref<HTMLElement | null> = ref(null)
// 활성화된 마커
const activeMarkerId: Ref<string | null> = ref(null)

// API 호출 관련 상수
const DEFAULT_FETCH_PAGE = 1
const DEFAULT_FETCH_LIMIT = 10

interface MapBoundaries {
  lat_min: number
  lat_max: number
  lng_min: number
  lng_max: number
  [key: string]: any
}

interface ApiResponse {
  data?: {
    items?: Place[]
  }
}

// Composables 사용
const radarState = useRadarState()
const {
  zoomLevel,
  animationKey,
  placeItems,
  containerSize,
  zoomLevelProperties,
  isContainerSizeValid,
  setZoomCooldown,
  getIconSize,
  isZoomCooldown,
  updateContainerSize
} = radarState

const interactions = useInteractions(zoomLevel, setZoomCooldown, animationKey)
const {
  radarStyle,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleMouseLeave,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd
} = interactions

const gpsTransform = useGpsTransform()
const adjustedPlacePositions = computed(() => {
  return gpsTransform.getAdjustedPlacePositions(
    placeItems.value,
    isContainerSizeValid,
    globalStore,
    zoomLevel,
    containerSize
  )
})
/**
 * 반경 API 호출 함수
 */
const getRadius = async (): Promise<void> => {
  const currentMapInfo = calculateRadiusBoundaries(
    globalStore.lat,
    globalStore.lng,
    zoomLevel.value
  ) as MapBoundaries
  if (!currentMapInfo) return
  try {
    const res: ApiResponse = await getPlacesListAPI(
      DEFAULT_FETCH_PAGE,
      DEFAULT_FETCH_LIMIT,
      [],
      currentMapInfo.lat_min,
      currentMapInfo.lat_max,
      currentMapInfo.lng_min,
      currentMapInfo.lng_max
    )

    if (res?.data?.items) {
      placeItems.value = res.data.items
    }
  } catch (error) {
    console.error('반경 데이터 가져오기 오류:', error)
  }
}

// 마커 클릭 핸들러
const handleMarkerClick = async (placeId: any) => {
  // activeMarkerId 상태 업데이트
  if (activeMarkerId.value === placeId) {
    activeMarkerId.value = null
  } else {
    activeMarkerId.value = placeId
  }

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

// 줌 레벨 변경 시 반경 API 재호출
watch(zoomLevel, () => {
  getRadius()
})

let timeoutInst: any = null

watch([globalStore.lat, globalStore.lng], () => {
  // 기존 타이머가 있으면 취소
  if (timeoutInst) {
    clearTimeout(timeoutInst)
  }

  // 10초 후에 getRadius 호출하는 새 타이머 설정
  timeoutInst = setTimeout(() => {
    getRadius()
    timeoutInst = null
  }, 5000) // 10초
})

// route.query.place 변경 시 activeMarkerId 상태 동기화
watch(
  () => route.query.place,
  (newPlaceId) => {
    activeMarkerId.value = newPlaceId ? String(newPlaceId) : null
  },
  { immediate: true }
)

// 랜드마크 여부 확인
const isLandmark = (place: Place): boolean => {
  return !!place.landmark_url
}

// 컴포넌트 마운트 시 이벤트 리스너 등록
onMounted(() => {
  setTimeout(() => {
    updateContainerSize(radarContainer)
    getRadius()
  }, 100)

  if (radarContainer.value) {
    radarContainer.value.addEventListener('mousedown', handleMouseDown)
    radarContainer.value.addEventListener('touchstart', handleTouchStart, { passive: false })
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchend', handleTouchEnd)
    radarContainer.value.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('resize', () => updateContainerSize(radarContainer))
  }
})

// 방향 표시 컴포넌트가 globalStore.bearing 값 변경을 감지
watch(
  () => globalStore.bearing,
  (newBearing) => {
    console.log('방향 변경:', newBearing)
  }
)

onActivated(() => {
  updateContainerSize(radarContainer)
  getRadius()
})

// 컴포넌트 언마운트 시 이벤트 리스너 해제
onBeforeUnmount(() => {
  if (radarContainer.value) {
    radarContainer.value.removeEventListener('mousedown', handleMouseDown)
    radarContainer.value.removeEventListener('touchstart', handleTouchStart)
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('touchmove', handleTouchMove)
    window.removeEventListener('mouseup', handleMouseUp)
    window.removeEventListener('touchend', handleTouchEnd)
    radarContainer.value.removeEventListener('mouseleave', handleMouseLeave)
    window.removeEventListener('resize', () => updateContainerSize(radarContainer))
  }
})
</script>

<template>
  <v-container class="discovery-container pa-4">
    <div class="header d-flex justify-space-between align-center mb-4 status-bar-pt2">
      <div class="title">
        <h2 class="text-h6 font-weight-bold">
          🔥 반경 {{ zoomLevelProperties.displayName }} 지역 탐색
        </h2>
      </div>
    </div>

    <!-- 레이더 컨테이너 -->
    <div class="radar-container" ref="radarContainer" :style="{ perspective: '1000px' }">
      <div class="radar-inner-container" :style="radarStyle()">
        <!-- 레이더 원형 애니메이션 -->
        <div
          v-for="index in zoomLevelProperties.circleCount"
          :key="`circle-${index}-${animationKey}`"
          class="radar-circle"
          :style="{
            animationDelay: `${index * 0.2}s`,
            width: `${(index + 1) * zoomLevelProperties.circleSpacing}px`,
            height: `${(index + 1) * zoomLevelProperties.circleSpacing}px`,
            opacity: `${zoomLevelProperties.opacityBase - index * zoomLevelProperties.opacityDecrement}`,
            borderWidth: `${zoomLevelProperties.circleWidth}px`
          }"
        />
        <!-- 장소 마커 표시 -->
        <div
          v-for="(place, index) in placeItems"
          :key="`place-${place.place_id}`"
          class="place-marker"
          :style="{
            transform: `translate(${adjustedPlacePositions[place.place_id]?.x || 0}px, ${adjustedPlacePositions[place.place_id]?.y || 0}px)`,
            zIndex: activeMarkerId === place.place_id ? 1000 : 10 + index
          }"
          @click="handleMarkerClick(place.place_id)"
        >
          <!-- 랜드마크 마커 -->
          <div
            v-if="isLandmark(place)"
            class="landmark-marker"
            :class="{ active: activeMarkerId === place.place_id }"
          >
            <img :src="place.landmark_url" class="landmark-image" alt="Landmark" />
          </div>

          <!-- 일반 핀 마커 -->
          <div v-else class="pin" :class="{ active: activeMarkerId === place.place_id }">
            <div class="pin-with-image">
              <div
                class="pin-inner-circle"
                :style="{
                  backgroundColor: place.category?.icon_color
                    ? createLighterColor(place.category.icon_color)
                    : '#f0f9ff'
                }"
              >
                <div
                  class="pin-icon-container"
                  v-html="place.category?.icon"
                  :style="{ color: place.category?.icon_color || '#4CAF50' }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 레이더 중앙 포인트 -->
        <div class="radar-center-point"></div>
        <div class="radar-center-point-outer"></div>

        <!-- 중앙 유저 표시 -->
        <div class="user-thumbnail">
          <v-avatar size="60">
            <v-img
              v-if="userStore.userInfo?.thumbnail_url"
              :src="userStore.userInfo?.thumbnail_url"
              cover
            />
          </v-avatar>
          <div
            class="direction-indicator"
            :style="{ transform: `rotate(${globalStore.bearing}deg)` }"
          />
        </div>
      </div>
    </div>

    <!-- 줌 레벨 버튼 컨트롤 -->
    <div v-if="false" class="zoom-buttons-container">
      <v-btn
        v-for="level in 3"
        :key="`zoom-btn-${level}`"
        :color="zoomLevel === level ? 'primary' : 'grey-lighten-3'"
        :variant="zoomLevel === level ? 'elevated' : 'flat'"
        :class="{ 'zoom-button-active': zoomLevel === level }"
        rounded="pill"
        elevation="1"
        size="x-small"
        @click="
          () => {
            zoomLevel = level
            animationKey++
          }
        "
      >
        {{ level }}km
      </v-btn>
    </div>
  </v-container>
</template>

<style scoped>
.discovery-container {
  position: relative;
  background-color: #f5f7fa;
  background-image: linear-gradient(135deg, #f5f7fa 0%, #eef3f8 100%);
  border-radius: 24px;
  overflow: visible;
  max-width: 480px;
  margin: 0 auto;
  height: 100vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  padding-bottom: 120px;
}

.radar-container {
  position: relative;
  width: 100%;
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: grab;
  overflow: visible;
  user-select: none;
}

.radar-container:active {
  cursor: grabbing;
}

.radar-inner-container {
  position: relative;
  width: 100%;
  height: 100%;
  will-change: transform;
}

/* 레이더 원 애니메이션 */
.radar-circle {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(100, 150, 255, 0.4);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: pulse 5s infinite cubic-bezier(0.4, 0, 0.2, 1);
  background: none;
}

/* 장소 마커 공통 스타일 */
.place-marker {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* 핀 스타일 */
.pin {
  position: relative;
  width: 35px;
  height: 35px;
  background-color: white;
  border-radius: 30px;
  border-bottom-left-radius: 5px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pin-appear 0.3s ease;
  transition: all 0.2s ease;
  cursor: pointer;
}

.pin.active {
  transform: scale(1.1);
  z-index: 10;
}

.pin.active .pin-icon-container svg {
  transform: scale(1.15);
}

.pin.active .pin-inner-circle {
  animation: pulse-light 1.5s ease-in-out infinite;
}

.pin.active .pin-image-container {
  transform: translateY(60%) scale(1.1);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
}

.pin-with-image {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pin-image-container {
  position: absolute;
  bottom: 0;
  width: 50px;
  height: 50px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  border: 2px solid white;
  transform: translateY(60%);
  z-index: 1;
}

.pin-inner-circle {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 2;
}

.pin-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  transition: all 0.2s ease;
}

.pin-icon-container svg {
  width: 16px;
  height: 16px;
  stroke-width: 1.2;
}

/* 랜드마크 마커 스타일 */
.landmark-marker {
  width: 60px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  transition: all 0.2s ease;
  cursor: pointer;
  animation: marker-appear 0.3s ease;
  transform-origin: center bottom;
  display: flex;
  align-items: center;
  justify-content: center;
}

.landmark-marker img {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
}

.landmark-marker:hover,
.landmark-marker.active {
  transform: scale(1.1);
  z-index: 10;
}

.landmark-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.landmark-marker.active {
  transform: scale(1.15) translateY(-5px) !important;
  z-index: 1000 !important;
}

.landmark-marker.active img {
  transform: scale(1.05);
  transition: transform 0.3s ease;
}

/* 레이더 중앙 포인트 */
.radar-center-point {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 10px;
  height: 10px;
  background-color: rgba(100, 170, 255, 0.8);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 15px rgba(100, 170, 255, 0.6);
  z-index: 8;
  animation: pulse-center 2s ease-in-out infinite;
}

.radar-center-point-outer {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 24px;
  height: 24px;
  border: 1.5px solid rgba(100, 170, 255, 0.5);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  z-index: 7;
  animation: pulse-outer 4s ease-in-out infinite;
}

/* 줌 레벨 버튼 컨트롤 */
.zoom-buttons-container {
  position: fixed;
  right: 10px;
  top: 50%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 100;
}

.zoom-buttons-container .v-btn {
  opacity: 0.75;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
  width: 30px;
  height: 30px;
  text-transform: none;
  font-weight: bold;
}

.zoom-buttons-container .v-btn:hover {
  opacity: 1;
  transform: scale(1.05);
}

.zoom-button-active {
  opacity: 1 !important;
  box-shadow: 0 0 15px rgba(25, 118, 210, 0.4);
  transform: scale(1.1);
  font-weight: bold !important;
}

/* 사용자 썸네일 */
.user-thumbnail {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 20;
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(100, 170, 255, 0.4);
  animation: float 4s ease-in-out infinite;

  /* 방향 표시 화살표 */
  .direction-indicator {
    position: absolute;
    top: 35px;
    left: -20px;
    transform-origin: center top;
    pointer-events: none;
    width: 100px;
    height: 250px;
    background: linear-gradient(to bottom, #36d1dc, #5b86e5);
    clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
    border-radius: 0 0 150px 150px;
    opacity: 0.1;
    z-index: 0;
  }
}

.user-thumbnail::after {
  content: '';
  position: absolute;
  width: 68px;
  height: 68px;
  top: -4px;
  left: -4px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.6);
  animation: pulse-user 4s infinite alternate;
}

/* 애니메이션 정의 */
@keyframes pin-appear {
  0% {
    transform: translateY(10px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes pulse-light {
  0% {
    box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(24, 144, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(24, 144, 255, 0);
  }
}

@keyframes marker-appear {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes pulse-marker {
  0% {
    transform: scale(0.8);
    opacity: 0.7;
  }
  70% {
    transform: scale(1.5);
    opacity: 0;
  }
  100% {
    transform: scale(0.8);
    opacity: 0;
  }
}

@keyframes pulse-outer {
  0% {
    width: 24px;
    height: 24px;
    opacity: 0.8;
  }
  50% {
    width: 28px;
    height: 28px;
    opacity: 0.5;
  }
  100% {
    width: 24px;
    height: 24px;
    opacity: 0.8;
  }
}

@keyframes pulse {
  0% {
    transform: translate(-50%, -50%) scale(0.95);
    opacity: 0.7;
  }
  65% {
    opacity: 0.3;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0;
  }
}

@keyframes pulse-center {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 1;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0.7;
  }
  100% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 1;
  }
}

@keyframes pulse-user {
  0% {
    transform: scale(1);
    opacity: 0.6;
  }
  100% {
    transform: scale(1.1);
    opacity: 0.2;
  }
}

@keyframes float {
  0% {
    transform: translate(-50%, -50%) translateY(0px);
    box-shadow: 0 0 15px rgba(100, 150, 255, 0.5);
  }
  50% {
    transform: translate(-50%, -50%) translateY(-8px);
    box-shadow: 0 15px 20px rgba(100, 150, 255, 0.3);
  }
  100% {
    transform: translate(-50%, -50%) translateY(0px);
    box-shadow: 0 0 15px rgba(100, 150, 255, 0.5);
  }
}
</style>
