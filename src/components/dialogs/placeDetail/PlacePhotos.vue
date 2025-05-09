<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import VueEasyLightbox from 'vue-easy-lightbox'

interface PhotoItem {
  url?: string;
  title?: string;
  alt?: string;
  photo_id?: string | number;
}

const props = defineProps({
  loading: {
    type: Boolean,
    default: true
  },
  photos: {
    type: Array as () => PhotoItem[],
    default: () => []
  },
  isMaxHeight: {
    type: Boolean,
    default: false
  }
})

// 스크롤 컨테이너 참조
const scrollContainerRef = ref(null)

// 라이트박스 상태
const lightboxVisible = ref(false)
const lightboxIndex = ref(0)

// 부모 컨테이너와의 이벤트 충돌 방지 처리
onMounted(() => {
  const scrollContainer = scrollContainerRef.value
  if (!scrollContainer) return

  // 터치 이벤트 처리 - 가로 스크롤과 드래그 충돌 방지
  const handleTouchStart = (e) => {
    const touchStartX = e.touches[0].clientX
    const touchStartY = e.touches[0].clientY
    let isHorizontalMovement = false

    // 터치 이동 감지 핸들러
    const handleTouchMove = (moveEvent) => {
      // 이미 가로 이동으로 판단된 경우 이벤트 전파 중단
      if (isHorizontalMovement) {
        moveEvent.stopPropagation()
        return
      }

      const currentX = moveEvent.touches[0].clientX
      const currentY = moveEvent.touches[0].clientY
      const diffX = Math.abs(currentX - touchStartX)
      const diffY = Math.abs(currentY - touchStartY)

      // 가로 이동인지 판단 (유의미한 차이가 있는 경우)
      if (diffX > diffY && diffX > 5) {
        isHorizontalMovement = true
        moveEvent.stopPropagation()
      }
    }

    // 이벤트 리스너 정리 함수
    const cleanupListeners = () => {
      document.removeEventListener('touchmove', handleTouchMove, { capture: true })
      document.removeEventListener('touchend', cleanupListeners)
      document.removeEventListener('touchcancel', cleanupListeners)
    }

    document.addEventListener('touchmove', handleTouchMove, { capture: true, passive: false })
    document.addEventListener('touchend', cleanupListeners, { once: true })
    document.addEventListener('touchcancel', cleanupListeners, { once: true })
  }

  scrollContainer.addEventListener('touchstart', handleTouchStart, { passive: true })
})

// 화면에 표시할 최대 10개 사진 제한
const limitedPhotos = computed(() => {
  return props.photos && props.photos.length > 0 ? props.photos.slice(0, 10) : []
})

// 전체 사진 개수 계산
const totalPhotosCount = computed(() => {
  return props.photos?.length || 0
})

// 표시 제한보다 더 많은 사진이 있는지 확인
const hasMorePhotos = computed(() => {
  return totalPhotosCount.value > 10
})

// 2행 레이아웃용 사진 그룹화 (첫 번째는 크게, 나머지는 3x3 그리드)
const groupedPhotos = computed(() => {
  if (!limitedPhotos.value.length) return { firstPhoto: null, topRow: [], bottomRow: [] }

  const firstPhoto = limitedPhotos.value[0]
  const remainingPhotos = limitedPhotos.value.slice(1)

  // 나머지 사진을 두 행으로 분리
  const topRow = remainingPhotos.slice(0, 3)
  const bottomRow = remainingPhotos.slice(3, 6)

  return {
    firstPhoto,
    topRow,
    bottomRow
  }
})

// vue-easy-lightbox용 이미지 데이터 준비
const lightboxImgs = computed(() => {
  return props.photos && props.photos.length > 0
    ? props.photos.map((photo) => ({
      src: photo?.url,
      title: photo?.title || '',
      alt: photo?.alt || ''
    }))
    : []
})

// 라이트박스 설정 옵션
const lightboxOptions = {
  escDisabled: false,
  moveDisabled: false,
  swipeTolerance: 50,
  loop: true,
  zoomScale: 0.2,
  maxZoom: 3,
  minZoom: 0.5,
  rotateDisabled: true,
  teleport: 'body', // body에 직접 렌더링
  maskClosable: true,
  toolbar: ['prev', 'next'], // 좌우 이동 버튼만 표시
  pinchDisabled: false
}

// 라이트박스 열기 핸들러
const openLightbox = (index, event) => {
  // 로딩 중이거나 사진이 없으면 실행하지 않음
  if (props.loading || !props.photos || props.photos.length === 0) {
    return
  }

  // 이벤트 전파 중단
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }

  // z-index 충돌 방지를 위해 바텀시트 스타일 임시 조정
  const adjustBottomSheetStyles = () => {
    const bottomSheetElements = document.querySelectorAll('.vue-spring-bottom-sheet-container')
    bottomSheetElements.forEach(el => {
      if (el instanceof HTMLElement) {
        el.style.zIndex = '1000'
      }
    })
  }

  adjustBottomSheetStyles()

  // 스크롤과 터치 동작 제한
  document.body.style.overflow = 'hidden'
  document.body.style.touchAction = 'none'

  // 라이트박스 열기
  lightboxIndex.value = index
  lightboxVisible.value = true
}

// 라이트박스 닫기 핸들러
const handleHide = () => {
  lightboxVisible.value = false

  // 바텀시트 스타일 복원
  const restoreBottomSheetStyles = () => {
    const bottomSheetElements = document.querySelectorAll('.vue-spring-bottom-sheet-container')
    bottomSheetElements.forEach(el => {
      if (el instanceof HTMLElement) {
        el.style.zIndex = ''
      }
    })
  }

  restoreBottomSheetStyles()

  // 스크롤과 터치 동작 복원
  document.body.style.overflow = ''
  document.body.style.touchAction = ''
}
</script>

<template>
  <div class="horizontal-instagram-gallery">
    <!-- 가로 스크롤 컨테이너 -->
    <div
      ref="scrollContainerRef"
      class="scroll-container"
      @click.stop
    >
      <!-- 사진 그리드 (가로 구조) -->
      <div class="photo-grid">
        <!-- 왼쪽: 첫 번째 큰 사진 -->
        <div
          v-if="groupedPhotos.firstPhoto"
          class="grid-item-large"
          @click.stop="openLightbox(0, $event)"
          @touchstart.stop
        >
          <v-img
            :src="groupedPhotos.firstPhoto.url"
            alt="Featured photo"
            cover
            :aspect-ratio="1"
            class="grid-photo"
            lazy-src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
          >
            <template v-slot:placeholder>
              <div class="d-flex align-center justify-center fill-height">
                <v-progress-circular
                  indeterminate
                  size="24"
                  color="grey-lighten-4"
                ></v-progress-circular>
              </div>
            </template>
          </v-img>
        </div>

        <!-- 오른쪽: 작은 사진들 2행 그리드 -->
        <div class="grid-small-photos">
          <!-- 상단 행 -->
          <div class="grid-row">
            <div
              v-for="(photo, index) in groupedPhotos.topRow"
              :key="photo?.photo_id"
              class="grid-item-small"
              :class="{
                'grid-item-last':
                  index === 2 && hasMorePhotos && groupedPhotos.bottomRow.length === 0
              }"
              @click.stop="openLightbox(index + 1, $event)"
              @touchstart.stop
            >
              <v-img
                :src="photo?.url"
                :alt="`Photo ${index + 2}`"
                cover
                :aspect-ratio="1"
                class="grid-photo"
                lazy-src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
              >
                <template v-slot:placeholder>
                  <div class="d-flex align-center justify-center fill-height">
                    <v-progress-circular
                      indeterminate
                      size="24"
                      color="grey-lighten-4"
                    ></v-progress-circular>
                  </div>
                </template>

                <!-- 하단 행이 없는 경우 마지막 이미지에 사진 개수 표시 -->
                <div
                  v-if="index === 2 && hasMorePhotos && groupedPhotos.bottomRow.length === 0"
                  class="photo-count-overlay"
                >
                  <span class="photo-count">+{{ totalPhotosCount - 4 }}</span>
                </div>
              </v-img>
            </div>
          </div>

          <!-- 하단 행 -->
          <div class="grid-row">
            <div
              v-for="(photo, index) in groupedPhotos.bottomRow"
              :key="photo?.photo_id"
              class="grid-item-small"
              :class="{ 'grid-item-last': index === 2 && hasMorePhotos }"
              @click.stop="openLightbox(index + 4, $event)"
              @touchstart.stop
            >
              <v-img
                :src="photo?.url"
                :alt="`Photo ${index + 5}`"
                cover
                :aspect-ratio="1"
                class="grid-photo"
                lazy-src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
              >
                <template v-slot:placeholder>
                  <div class="d-flex align-center justify-center fill-height">
                    <v-progress-circular
                      indeterminate
                      size="24"
                      color="grey-lighten-4"
                    ></v-progress-circular>
                  </div>
                </template>

                <!-- 마지막 이미지에 남은 사진 개수 표시 -->
                <div v-if="index === 2 && hasMorePhotos" class="photo-count-overlay">
                  <span class="photo-count">+{{ totalPhotosCount - 7 }}</span>
                </div>
              </v-img>
            </div>
          </div>
        </div>

        <!-- 사진이 없을 때 플레이스홀더 표시 -->
        <div v-if="!loading && limitedPhotos.length === 0" class="no-photos">
          <span>No photos available</span>
        </div>
      </div>
    </div>

    <!-- 라이트박스 (body에 렌더링) -->
    <teleport to="body">
      <vue-easy-lightbox
        :visible="lightboxVisible"
        :imgs="lightboxImgs"
        :index="lightboxIndex"
        :options="lightboxOptions"
        @hide="handleHide"
      />
    </teleport>

    <!-- 로딩 상태 표시 -->
    <div v-if="loading" class="gallery-skeleton">
      <div class="skeleton-layout">
        <div class="skeleton-large"></div>
        <div class="skeleton-grid">
          <div class="skeleton-row">
            <div class="skeleton-item" v-for="n in 3" :key="`top-${n}`"></div>
          </div>
          <div class="skeleton-row">
            <div class="skeleton-item" v-for="n in 3" :key="`bottom-${n}`"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* 갤러리 기본 스타일 */
.horizontal-instagram-gallery {
  width: 100%;
  position: relative;
  background-color: white;
  padding: 8px 0;
  max-width: 100%;
  overflow: hidden; /* 컨테이너 오버플로우 제어 - 중요 */
}

/* 가로 스크롤 컨테이너 */
.scroll-container {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch; /* iOS에서 부드러운 스크롤링 */
  cursor: grab;
  scroll-behavior: smooth;
  /* Chrome, Safari, Opera용 스크롤바 숨기기 */
  &::-webkit-scrollbar {
    display: none;
  }
  /* IE, Edge, Firefox용 스크롤바 숨기기 */
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* 가로 레이아웃 사진 그리드 */
.photo-grid {
  display: flex;
  padding: 0 16px 8px 16px;
  gap: 8px;
  min-width: min-content; /* 내용에 맞게 최소 너비 설정 */
  width: max-content; /* 내용물 너비에 맞춤 - 가로 스크롤 허용 */
  margin: 0 auto; /* 중앙 정렬 */
}

/* 큰 첫 번째 사진 */
.grid-item-large {
  flex: 0 0 auto;
  width: 200px; /* 조금 더 작게 조정 */
  height: 200px;
  position: relative;
  cursor: pointer;

  &:hover::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
  }
}

/* 작은 사진 그리드 */
.grid-small-photos {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 그리드 내 행 */
.grid-row {
  display: flex;
  gap: 4px;
}

/* 작은 그리드 사진 */
.grid-item-small {
  flex: 0 0 auto;
  width: 98px; /* 조금 더 작게 조정 */
  height: 98px;
  position: relative;
  cursor: pointer;

  &:hover::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
  }
}

/* 모든 사진의 종횡비 유지 */
.grid-photo {
  width: 100%;
  height: 100%;
  border-radius: 4px;
}

/* 사진 개수 오버레이 */
.photo-count-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  border-radius: 4px;
}

.photo-count {
  color: white;
  font-size: 20px;
  font-weight: 600;
}

/* 사진 없음 메시지 */
.no-photos {
  flex: 0 0 auto;
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
  color: #666;
  font-size: 14px;
  border-radius: 4px;
}

/* 스켈레톤 로딩 상태 */
.gallery-skeleton {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 3;
  background-color: white;
  padding: 8px 16px;
  overflow: hidden; /* 스켈레톤 오버플로우 제어 */
}

.skeleton-layout {
  display: flex;
  gap: 8px;
  max-width: 100%;
  overflow: hidden;
}

.skeleton-large {
  width: 200px;
  height: 200px;
  background-color: #f0f0f0;
  animation: skeleton-pulse 1.5s infinite;
  border-radius: 4px;
  flex-shrink: 0;
}

.skeleton-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.skeleton-row {
  display: flex;
  gap: 4px;
}

.skeleton-item {
  width: 98px;
  height: 98px;
  background-color: #f0f0f0;
  animation: skeleton-pulse 1.5s infinite;
  border-radius: 4px;
  flex-shrink: 0;
}

/* vue-easy-lightbox 스타일 오버라이드 */
:deep(.vel-modal) {
  z-index: 100000 !important; /* 매우 높은 z-index로 설정 */
}

:deep(.vue-easy-lightbox) {
  z-index: 100000 !important; /* 매우 높은 z-index로 설정 */
}

:deep(.vel-img-wrapper) {
  touch-action: none !important; /* 모바일에서 핀치 줌 방지 */
}

:deep(.vel-img) {
  max-width: 100vw !important;
  max-height: 100vh !important;
}

/* 미사용 도구 모음 버튼 숨기기 */
:deep(.vel-toolbar > *:not(.vel-btns-next):not(.vel-btns-prev)) {
  display: none !important;
}

@keyframes skeleton-pulse {
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.6;
  }
}

/* 미디어 쿼리 - 작은 화면에서 더 작게 조정 */
@media (max-width: 480px) {
  .grid-item-large {
    width: 180px;
    height: 180px;
  }

  .grid-item-small {
    width: 88px;
    height: 88px;
  }

  .no-photos {
    width: 180px;
    height: 180px;
  }

  .skeleton-large {
    width: 180px;
    height: 180px;
  }

  .skeleton-item {
    width: 88px;
    height: 88px;
  }
}
</style>