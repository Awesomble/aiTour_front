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
import { onActivated, onMounted, onBeforeUnmount, defineProps, defineEmits, watch } from 'vue'
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
} = useMarkers(map, mapInfo, emit)

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
  <div id="instMap" class="h-100" style="width: 100%" />
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
.iam {
  position: relative;
  width: 14px;
  height: 14px;
  background-color: #1483C2;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1), 0 3px 10px rgba(0, 0, 0, 0.3);
  z-index: 10;
  animation: dot-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;

  /* 가상 요소를 사용한 파동 효과 */
  &::before, &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 2px solid #1483C2;
    transform: translate(-50%, -50%);
    opacity: 0;
  }

  /* 첫 번째 파동 */
  &::before {
    animation: ripple-effect 2s 0s cubic-bezier(0, 0.5, 0.5, 1) infinite;
  }

  /* 두 번째 파동 (지연 시간 적용) */
  &::after {
    animation: ripple-effect 2s 0.8s cubic-bezier(0, 0.5, 0.5, 1) infinite;
  }

  /* 방향 표시기 스타일 */
  .direction-indicator {
    position: absolute;
    width: 0;
    height: 0;
    top: -12px; /* 위치 조정 */
    left: 50%;
    transform-origin: bottom center; /* 회전 중심점 설정 */
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-bottom: 12px solid #1483C2; /* 삼각형 방향 표시기 */
    transform: translateX(-50%) rotate(0deg); /* 초기 회전 각도 */
    transition: transform 0.3s ease; /* 부드러운 회전 효과 */
    z-index: 11;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
  }
}

/* 핵심 원 펄스 애니메이션 */
@keyframes dot-pulse {
  0%, 100% {
    transform: scale(1);
    background-color: #1483C2;
  }
  50% {
    transform: scale(1.1);
    background-color: #1a9cf7;
  }
}

/* 파동 애니메이션 */
@keyframes ripple-effect {
  0% {
    width: 100%;
    height: 100%;
    opacity: 1;
  }
  100% {
    width: 300%;
    height: 300%;
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

// Route markers styling
.route-marker {
  cursor: pointer;

  .route-marker-inner {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: bold;
    white-space: nowrap;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
}

.start-marker .route-marker-inner {
  background-color: #4285F4;
  color: white;
}

.end-marker .route-marker-inner {
  background-color: #EA4335;
  color: white;
}

// Image styling
.landmark-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

// Animations
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

.route-marker {
  cursor: pointer;
  position: relative;
}

.route-marker-inner {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: bold;
  white-space: nowrap;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transform: scale(1);
  transition: transform 0.2s ease, box-shadow 0.3s ease;
}

.route-marker-inner:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
}

.start-marker .route-marker-inner {
  background-color: #4285F4;
  color: white;
  position: relative;
}

.start-marker .route-marker-inner::before {
  content: "";
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid #4285F4;
}

.end-marker .route-marker-inner {
  background-color: #EA4335;
  color: white;
  position: relative;
}

.end-marker .route-marker-inner::before {
  content: "";
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid #EA4335;
}

/* 맵 로드 애니메이션 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes pulseMarker {
  0% {
    transform: scale(1);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
}

.route-marker .route-marker-inner {
  animation: fadeIn 0.5s ease, pulseMarker 2s ease-in-out infinite;
  animation-delay: 0s, 0.5s;
}
</style>