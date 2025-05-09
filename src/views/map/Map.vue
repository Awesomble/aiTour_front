<script setup lang="ts">
import { onActivated, onMounted, onBeforeUnmount, defineProps, defineEmits, ref, nextTick } from 'vue'
import { useMapStore } from '@/store'
import { useMapInitialization } from './composables/useMapInitialization'
import { useMarkers } from './composables/useMarkers'
import { useDirections } from './composables/useDirections'
import { useIamMarker } from './composables/useIamMarker'
import { useGPS } from './composables/useGPS'
import { onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const props = defineProps({
  initialCenter: {
    type: Object,
    default: () => ({
      lat: 37.5663,
      lng: 126.9779
    })
  },
  initialZoom: {
    type: Number,
    default: 16
  },
  categories: {
    type: Array,
    default: () => []
  },
  activeCategory: {
    type: Number,
    default: null
  }
})

const emit = defineEmits([
  'update:center',
  'update:zoom',
  'marker-click',
  'map-loaded',
  'markers-updated'
])

const mapStore = useMapStore()
const mapInitialized = ref(false)

const { initGPS, cleanupGPS } = useGPS()

// 맵 초기화 콜백 함수들
const onZoomChanged = (currentZoom: number) => {
  // 줌 레벨 변경 시 마커 가시성 업데이트
  if (mapInitialized.value) {
    updateMarkerVisibility(currentZoom)
  }
}

const onMapIdle = () => {
  // 지도 이동/줌 완료 시 새로운 데이터 요청
  if (mapInitialized.value) {
    fetchPlacesByCategory()
  }
}

// 맵 정보 젼경시 처리
const onMapInfoUpdated = () => {
  // 이미 초기화되었을 때만 실행
  if (mapInitialized.value) {
    fetchPlacesByCategory()
  }
}

// 맵 초기화 컴포저블
const {
  map,
  center,
  zoom,
  mapInfo,
  initializeMap,
  updateMapInfo,
  panToLocation,
  cleanupMapEventListeners
} = useMapInitialization(props, emit, {
  onZoomChanged,
  onMapIdle,
  onMapInfoUpdated,
  onMapLoaded: async (mapInstance) => {
    // 맵 로드 완료 후 처리
    emit('map-loaded', mapInstance)

    // 초기화 완료 플래그 설정
    mapInitialized.value = true
    if (map.value) {
      await updateMapInfo() // 맵 경계 정보 업데이트
      await initializeIamMarker(map)
      await nextTick()
      await updateMarkerVisibility(zoom.value)
      await fetchPlacesByCategory()
    }
  }
})

// 마커 컴포저블
const {
  isLoading,
  activePlaces,
  markerData,
  updateMarkers,
  updateMarkerVisibility,
  clearAllMarkers,
  removeMarkerByPlaceId,
  fetchPlacesByCategory,
  loadMarkerLibrary,
} = useMarkers(map, mapInfo, emit, route, router)

// Iam마커 컴포저블
const { iamMarker, initializeIamMarker, updatePosition } = useIamMarker()

// 경로 컴포저블
const { clearDirections, findDirections } = useDirections(map)

onMounted(async () => {
  // GPS 초기화
  // initGPS()

  // 마커 라이브러리 미리 로드 (병렬 처리)
  const markerLibPromise = loadMarkerLibrary()

  // 맵 초기화
  const mapInstance = await initializeMap()

  // 마커 라이브러리 로드 완료 대기
  await markerLibPromise

  if (mapInstance) {


    // 방향 정보가 있다면 경로 표시
    // if (mapStore.directions) {
    //   const { startLat, startLng, destLat, destLng } = mapStore.directions
    //   await findDirections(startLat, startLng, destLat, destLng)
    // }

    // 이제 데이터를 가져오고 마커 표시

  }
})

onBeforeUnmount(() => {
  // cleanupGPS()
  cleanupMapEventListeners()
  clearAllMarkers()
  clearDirections()
  mapInitialized.value = false
})

onActivated(async () => {
  if (map.value) {
    await updateMapInfo() // 맵 경계 정보 업데이트
    await initializeIamMarker(map)
    await nextTick()
    await updateMarkerVisibility(zoom.value)
    await fetchPlacesByCategory()
  }
    // 마커 가시성 업데이트
    // 방향 정보 갱신 (필요시)
    // if (mapStore.directions) {
    //   const { startLat, startLng, destLat, destLng } = mapStore.directions
    //   await findDirections(startLat, startLng, destLat, destLng)
    // }
})

defineExpose({
  panToLocation,
  updatePosition,
  clearAllMarkers,
  removeMarkerByPlaceId,
  findDirections,
  clearDirections
})

onBeforeRouteUpdate(() => {
  // clearDirections()
})
</script>

<template>
  <div id="instMap" class="inst-map" style="width: 100%" />
  <slot name="floating-controls"></slot>
</template>

<style lang="scss">
.inst-map {
  height: calc(100% - 60px);
  height: calc(100% - 60px - var(--nav-bar-height));
}
.iam {
  position: relative;
  width: 24px;
  height: 24px;
  background-color: #ffffff;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  z-index: 999999;

  /* 중앙 푸른색 원 */
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 14px;
    height: 14px;
    background-color: #007aff;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.9);
    z-index: 1;
  }

  /* 외부 펄스 효과 */
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 122, 255, 0.15);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    animation: pulse-wave 2s ease-out infinite;
    z-index: 1;
  }

  /* 방향 표시기 - 그라데이션 삼각형 */
  .direction-indicator {
    position: absolute;
    top: -24px;
    left: 0;
    width: 26px;
    height: 36px;
    transform-origin: center bottom; /* 회전 중심점을 요소 중앙으로 설정 */
    z-index: 0;
    opacity: 0;
    transition: opacity 0.3s ease;
    background: linear-gradient(to bottom, rgba(0, 122, 255, 0) 0%, rgba(0, 122, 255, 0.8) 100%);
    clip-path: polygon(0% 0%, 100% 0%, 50% 100%); /* 삼각형 모양 */

    /* 점과 겹치는 부분을 위한 하단 확장 부분 */
    &::after {
      content: '';
      position: absolute;
      bottom: -6px;
      left: 50%;
      width: 2px;
      height: 6px;
      background-color: #007aff;
      transform: translateX(-50%);
    }
  }
}

/* 맥동하는 파란색 파동 효과 */
@keyframes pulse-wave {
  0% {
    width: 40%;
    height: 40%;
    opacity: 0.6;
  }
  100% {
    width: 200%;
    height: 200%;
    opacity: 0;
  }
}

/* 마커 스타일링은 원본 그대로 유지 */
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

  &.active {
    transform: scale(1.1);
    z-index: 10;

    .pin-icon-container svg {
      transform: scale(1.15);
    }

    .pin-inner-circle {
      animation: pulse-light 1.5s ease-in-out infinite;
    }

    .pin-image-container {
      transform: translateY(60%) scale(1.1);
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
    }
  }
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

  svg {
    width: 16px;
    height: 16px;
    stroke-width: 1.2;
  }
}

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
  img {
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
    object-fit: contain;
    display: block;
  }

  &:hover,
  &.active {
    transform: scale(1.1);
    z-index: 10;
  }
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
</style>