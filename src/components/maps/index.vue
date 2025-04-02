<!--InstMap/-->
<!--  index.vue                 # 메인 컴포넌트 (기존 파일 간소화)-->
<!--  composables/              # 재사용 가능한 로직-->
<!--    useMapInitialization.ts # 지도 초기화 로직-->
<!--    useMarkers.ts           # 마커 관련 로직-->
<!--    useDirections.ts        # 길찾기 관련 로직-->
<!--    useMapEvents.ts         # 지도 이벤트 처리-->
<!--    useGPS.ts               # GPS 관련 로직-->
<!--  utils/                    # 유틸리티 함수-->
<!--    formatters.ts           # 포맷팅 유틸리티-->
<!--    mapHelpers.ts           # 지도 관련 헬퍼 함수-->
<script setup lang="ts">
import { onActivated, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, nextTick } from 'vue'
import { useMapStore } from '@/store'

// 모듈화된 컴포저블 가져오기
import { useMapInitialization } from './composables/useMapInitialization'
import { useMarkers } from './composables/useMarkers'
import { useDirections } from './composables/useDirections'
import { useMapEvents } from './composables/useMapEvents'
import { useGPS } from './composables/useGPS'

// Props 정의
const props = defineProps({
  initialCenter: {
    type: Object,
    default: () => ({ lat: 37.5663, lng: 126.9779 })
  },
  initialZoom: {
    type: Number,
    default: 14
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

// 이벤트 정의
const emit = defineEmits([
  'update:center',
  'update:zoom',
  'marker-click',
  'map-loaded',
  'markers-updated'
])

// 맵 스토어 초기화
const mapStore = useMapStore()

const onMapInfoUpdated = () => {
  fetchPlacesByCategory()
}

// 맵 초기화 컴포저블 사용
const {
  map,
  center,
  zoom,
  mapInfo,
  iamMarker,
  initializeMap,
  updateMapInfo,
  panToLocation,
  myLocationCall
} = useMapInitialization(props, emit, onMapInfoUpdated)

// GPS 관련 컴포저블 사용
const { initGPS, cleanupGPS } = useGPS()

// 맵 이벤트 컴포저블 사용
const { setupMapEventListeners, cleanupEventListeners } = useMapEvents(map, updateMapInfo, emit)

// 마커 관련 컴포저블 사용
const {
  isLoading,
  activePlaces,
  markerData,
  updateMarkers,
  updateMarkerVisibility,
  clearAllMarkers,
  removeMarkerByPlaceId,
  fetchPlacesByCategory
} = useMarkers(map, mapInfo, emit, iamMarker)

// 길찾기 관련 컴포저블 사용
const { clearDirections, findDirections } = useDirections(map)


// 컴포넌트 라이프사이클 훅
onMounted(async () => {
  initGPS()
  const mapInstance = await initializeMap()
  if (mapInstance) {
    setupMapEventListeners()

    // 초기 카테고리로 장소 불러오기
    fetchPlacesByCategory()
    // 로케이션 설정
    myLocationCall()
    // 스토어에 저장된 경로 정보가 있다면 로드
    if (mapStore.directions) {
      const { startLat, startLng, destLat, destLng } = mapStore.directions
      findDirections(startLat, startLng, destLat, destLng)
    }
  }
})

onBeforeUnmount(() => {
  cleanupGPS()
  cleanupEventListeners()
  clearAllMarkers()
  clearDirections()
})

onActivated(() => {
  if (map.value && markerData.value.length > 0) {
    // 캐시된 마커 복원
    activePlaces.value = markerData.value
    updateMarkers()
  } else {
    fetchPlacesByCategory()
  }

  if (map.value && iamMarker.value) {
    // Reattach marker to map if needed
    iamMarker.value.map = map.value
  }

  // 컴포넌트 활성화 시 경로 정보 복원
  if (mapStore.directions && map.value) {
    const { startLat, startLng, destLat, destLng } = mapStore.directions
    findDirections(startLat, startLng, destLat, destLng)
  }
})

// 줌 변경 시 마커 가시성 업데이트
watch(() => zoom.value, (newZoom) => {
  updateMarkerVisibility(newZoom)
})

// 카테고리 변경 함수
const setActiveCategory = (idx: number) => {
  fetchPlacesByCategory()
}

// 부모 컴포넌트에 노출할 함수
defineExpose({
  panToLocation,
  setActiveCategory,
  myLocationCall,
  clearAllMarkers,
  removeMarkerByPlaceId,
  findDirections,
  clearDirections
})
</script>

<template>
  <div id="instMap" class="inst-map" style="width: 100%" />
  <!-- SVG 필터 정의 -->
  <svg width="0" height="0" style="position: absolute;">
    <defs>
      <filter id="glow-effect" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3.5" result="blur" />
        <feFlood flood-color="#4285F4" flood-opacity="0.3" result="color"/>
        <feComposite in="color" in2="blur" operator="in" result="glow"/>
        <feMerge>
          <feMergeNode in="glow"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
  </svg>
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
    background-color: #007AFF;
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
      background-color: #007AFF;
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

// Pin styling
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
    box-shadow:
      0 5px 12px rgba(0, 0, 0, 0.2),
      0 0 0 4px rgba(24, 144, 255, 0.3);
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

// Pin with image styling
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

// Landmark marker styling
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

// Route markers styling
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