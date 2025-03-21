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

// Refs for container
const scrollContainerRef = ref(null)

// Lightbox state
const lightboxVisible = ref(false)
const lightboxIndex = ref(0)

// Minimal JS for preventing event conflicts with parent
onMounted(() => {
  const scrollContainer = scrollContainerRef.value
  if (!scrollContainer) return

  // Simple touch handler to prevent conflict with parent dragging
  const handleTouchStart = (e: TouchEvent) => {
    const touchStartX = e.touches[0].clientX
    const touchStartY = e.touches[0].clientY
    let isHorizontalMovement = false

    const handleTouchMove = (moveEvent: TouchEvent) => {
      // If we already determined this is horizontal, stop propagation
      if (isHorizontalMovement) {
        moveEvent.stopPropagation()
        return
      }

      const currentX = moveEvent.touches[0].clientX
      const currentY = moveEvent.touches[0].clientY
      const diffX = Math.abs(currentX - touchStartX)
      const diffY = Math.abs(currentY - touchStartY)

      // Determine if this is horizontal movement (and significant enough)
      if (diffX > diffY && diffX > 5) {
        isHorizontalMovement = true
        moveEvent.stopPropagation()
      }
    }

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

// Limit photos to max 10 for display grid
const limitedPhotos = computed(() => {
  return props.photos && props.photos.length > 0 ? props.photos.slice(0, 10) : []
})

// Calculate total photos count including hidden ones
const totalPhotosCount = computed(() => {
  return props.photos?.length || 0
})

// Check if we have additional photos beyond our limit
const hasMorePhotos = computed(() => {
  return totalPhotosCount.value > 10
})

// Group photos for two-row layout, first photo is large, others are in a 3x3 grid
const groupedPhotos = computed(() => {
  if (!limitedPhotos.value.length) return { firstPhoto: null, topRow: [], bottomRow: [] }

  const firstPhoto = limitedPhotos.value[0]
  const remainingPhotos = limitedPhotos.value.slice(1)

  // Split remaining photos into two rows
  const topRow = remainingPhotos.slice(0, 3)
  const bottomRow = remainingPhotos.slice(3, 6)

  return {
    firstPhoto,
    topRow,
    bottomRow
  }
})

// Prepare photos for vue-easy-lightbox
const lightboxImgs = computed(() => {
  return props.photos && props.photos.length > 0
    ? props.photos.map((photo) => ({
      src: photo?.url,
      title: photo?.title || '',
      alt: photo?.alt || ''
    }))
    : []
})

// Lightbox configuration options
const lightboxOptions = {
  escDisabled: false,
  moveDisabled: false,
  swipeTolerance: 50,
  loop: true,
  zoomScale: 0.2,
  maxZoom: 3,
  minZoom: 0.5,
  rotateDisabled: true,
  teleport: 'body',
  maskClosable: true,
  toolbar: 0,
  pinchDisabled: false
}

// Handle image click to open lightbox
const openLightbox = (index: number, event?: Event): void => {
  // Only allow opening the lightbox when popup is at max height
  if (!props.isMaxHeight) return

  // If we're still loading or there are no photos, don't open
  if (props.loading || !props.photos || props.photos.length === 0) return

  // Prevent event propagation
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }

  // Prevent body scroll and pinch-zoom when lightbox is open
  document.body.style.overflow = 'hidden'
  document.body.style.touchAction = 'none'

  lightboxIndex.value = index
  lightboxVisible.value = true
}

// Handle lightbox close
const handleHide = () => {
  lightboxVisible.value = false

  // Restore body scroll and touch behaviors
  document.body.style.overflow = ''
  document.body.style.touchAction = ''
}
</script>

<template>
  <div class="horizontal-instagram-gallery">
    <!-- Horizontal scrolling container with swipe behavior -->
    <div
      ref="scrollContainerRef"
      class="scroll-container"
      @click.stop
    >
      <!-- Photo grid with horizontal structure -->
      <div class="photo-grid">
        <!-- Left side: First large photo -->
        <div
          v-if="groupedPhotos.firstPhoto"
          class="grid-item-large"
          @click="openLightbox(0, $event)"
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

        <!-- Right side: Grid of smaller photos in 2 rows -->
        <div class="grid-small-photos">
          <!-- Top row -->
          <div class="grid-row">
            <div
              v-for="(photo, index) in groupedPhotos.topRow"
              :key="photo?.photo_id"
              class="grid-item-small"
              :class="{
                'grid-item-last':
                  index === 2 && hasMorePhotos && groupedPhotos.bottomRow.length === 0
              }"
              @click="openLightbox(index + 1, $event)"
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

                <!-- Show photo count on last visible image if no bottom row -->
                <div
                  v-if="index === 2 && hasMorePhotos && groupedPhotos.bottomRow.length === 0"
                  class="photo-count-overlay"
                >
                  <span class="photo-count">+{{ totalPhotosCount - 4 }}</span>
                </div>
              </v-img>
            </div>
          </div>

          <!-- Bottom row -->
          <div class="grid-row">
            <div
              v-for="(photo, index) in groupedPhotos.bottomRow"
              :key="photo?.photo_id"
              class="grid-item-small"
              :class="{ 'grid-item-last': index === 2 && hasMorePhotos }"
              @click="openLightbox(index + 4, $event)"
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

                <!-- Show photo count on last visible image -->
                <div v-if="index === 2 && hasMorePhotos" class="photo-count-overlay">
                  <span class="photo-count">+{{ totalPhotosCount - 7 }}</span>
                </div>
              </v-img>
            </div>
          </div>
        </div>

        <!-- Show placeholder if no photos available -->
        <div v-if="!loading && limitedPhotos.length === 0" class="no-photos">
          <span>No photos available</span>
        </div>
      </div>
    </div>

    <!-- Vue Easy Lightbox with Teleport -->
    <teleport to="body">
      <vue-easy-lightbox
        :visible="lightboxVisible"
        :imgs="lightboxImgs"
        :index="lightboxIndex"
        :options="lightboxOptions"
        @hide="handleHide"
      />
    </teleport>

    <!-- Loading state -->
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
/* Gallery styles (from original component) */
.horizontal-instagram-gallery {
  width: 100%;
  position: relative;
  background-color: white;
  padding: 8px 0;
}

/* Horizontal scrolling container */
.scroll-container {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch; /* For smooth scrolling on iOS */
  cursor: grab;
  scroll-behavior: smooth;

  /* Hide scrollbar for Chrome, Safari and Opera */
  &::-webkit-scrollbar {
    display: none;
  }

  /* Hide scrollbar for IE, Edge and Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}

/* Photo grid with horizontal layout */
.photo-grid {
  display: flex;
  padding: 0 16px 8px 16px;
  gap: 8px;
  min-width: min-content;
}

/* Large first photo */
.grid-item-large {
  flex: 0 0 auto;
  width: 240px;
  height: 240px;
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

/* Grid for smaller photos */
.grid-small-photos {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Rows within the grid */
.grid-row {
  display: flex;
  gap: 4px;
}

/* Smaller grid photos */
.grid-item-small {
  flex: 0 0 auto;
  width: 118px;
  height: 118px;
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

/* Make all photos maintain aspect ratio */
.grid-photo {
  width: 100%;
  height: 100%;
  border-radius: 4px;
}

/* Photo count overlay */
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

/* No photos message */
.no-photos {
  flex: 0 0 auto;
  width: 240px;
  height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
  color: #666;
  font-size: 14px;
  border-radius: 4px;
}

/* Skeleton loading */
.gallery-skeleton {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 3;
  background-color: white;
  padding: 8px 16px;
}

.skeleton-layout {
  display: flex;
  gap: 8px;
}

.skeleton-large {
  width: 240px;
  height: 240px;
  background-color: #f0f0f0;
  animation: skeleton-pulse 1.5s infinite;
  border-radius: 4px;
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
  width: 118px;
  height: 118px;
  background-color: #f0f0f0;
  animation: skeleton-pulse 1.5s infinite;
  border-radius: 4px;
}

/* Custom toolbar styles for vue-easy-lightbox */
.custom-toolbar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1002;

  button {
    background-color: rgba(0, 0, 0, 0.4);
    border: none;
    border-radius: 50%;
    color: white;
    font-size: 16px;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }
  }
}

/* Override any unwanted vue-easy-lightbox styles */
:deep(.vel-modal) {
  z-index: 9999 !important;
}

:deep(.vel-img-wrapper) {
  touch-action: none !important; /* Prevent pinch-zoom on mobile */
}

:deep(.vel-img) {
  max-width: 100vw !important;
  max-height: 100vh !important;
}

/* Custom index indicator */
.lightbox-counter {
  color: white;
  font-size: 14px;
  background-color: rgba(0, 0, 0, 0.4);
  padding: 6px 12px;
  border-radius: 20px;
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
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
</style>