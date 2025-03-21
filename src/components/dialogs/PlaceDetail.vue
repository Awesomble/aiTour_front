<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDraggable } from '@vueuse/core'
import { getPlacesDetailAPI } from '@/network/app'
import PlaceHeader from '@/components/place/PlaceHeader.vue'
import PlacePhotos from '@/components/place/PlacePhotos.vue'
import InfoPanel from '@/components/place/InfoPanel.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits(['update:modelValue'])

const route = useRoute()
const router = useRouter()
const dialog = ref(false)
const detail = ref<any>(null)
const loading = ref(true)
const containerRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)
const dragHandleRef = ref<HTMLElement | null>(null)

// Height states
const MIN_HEIGHT = 150
const MID_HEIGHT = 300
const MAX_HEIGHT = window.innerHeight - 50
const currentHeight = ref(MIN_HEIGHT)

// Chat related states
const chatMessages = ref([
  { id: 1, user: '방문자', message: '이 가게는 주차장이 있나요?', time: '14:23' },
  { id: 2, user: '매니저', message: '네, 건물 뒤편에 주차공간이 마련되어 있습니다.', time: '14:25' }
])
const newMessage = ref('')

// Computed current height state: 'min', 'mid', 'max'
const heightState = computed(() => {
  if (currentHeight.value <= (MIN_HEIGHT + MID_HEIGHT) / 2) return 'min'
  if (currentHeight.value <= (MID_HEIGHT + MAX_HEIGHT) / 2) return 'mid'
  return 'max'
})

// Check if popup is at max height (for photo clicks)
const isMaxHeight = computed(() => {
  return heightState.value === 'max'
})

// Content is scrollable only when at max height
const isScrollable = computed(() => {
  return heightState.value === 'max'
})

// Check if content is scrolled to the top
const isAtTopScroll = () => {
  if (!contentRef.value) return true
  return contentRef.value.scrollTop <= 1
}

// Check if content has scrollable content
const hasScrollableContent = () => {
  if (!contentRef.value) return false
  return contentRef.value.scrollHeight > contentRef.value.clientHeight
}

// Setup drag handle
const handleDrag = useDraggable(dragHandleRef, {
  axis: 'y',
  initialValue: { x: 0, y: 0 },
  preventDefault: true,
  onStart: () => false // Prevent default behavior and use custom handlers
})

// Watch for route changes to show/hide dialog
watch(
  () => route.query,
  (newQuery) => {
    if (newQuery.place) {
      loading.value = true
      getPlaceDetail()
      dialog.value = true
      currentHeight.value = MIN_HEIGHT
    } else {
      dialog.value = false
    }
  },
  { immediate: true }
)

// Watch for model value changes
watch(
  () => props.modelValue,
  (newVal) => {
    dialog.value = newVal
  }
)

// Emit model update when dialog changes
watch(dialog, (newVal) => {
  emit('update:modelValue', newVal)
})

// Get place details from API
const getPlaceDetail = async () => {
  const placeId: string = route.query.place as string
  if (!placeId) return

  try {
    loading.value = true
    const res = await getPlacesDetailAPI(placeId)
    if (res.status === 200) {
      detail.value = res.data
    }
  } catch (error) {
    console.error('Error fetching place details:', error)
  } finally {
    loading.value = false
  }
}

// Drag state
const isDragging = ref(false)
const startY = ref(0)
const startHeight = ref(0)
const dragThreshold = 5 // Minimum pixels to move before considering it a drag

// Track if the user intends to scroll content vs drag the panel
const isScrollingContent = ref(false)
const touchStartY = ref(0)
let touchMoveCount = 0

// Handle touch start on content for distinguishing between scrolling and dragging
const handleContentTouchStart = (e) => {
  // Reset tracking variables
  isScrollingContent.value = false
  touchStartY.value = e.touches[0].clientY
  touchMoveCount = 0

  // If we're at max height and not at the top of the scroll,
  // we'll let browser handle the touch for natural scrolling
  if (isMaxHeight.value && !isAtTopScroll() && hasScrollableContent()) {
    return
  }

  // Otherwise, prepare for potential drag
  startManualDrag(e)
}

// Handle mouse down on content
const handleContentMouseDown = (e) => {
  // If we're at max height and not at the top, treat as content scroll
  if (isMaxHeight.value && !isAtTopScroll() && hasScrollableContent()) {
    return
  }

  startManualDrag(e)
}

// Handle manual drag start on drag handle
const handleDragStart = (e) => {
  e.stopPropagation()
  startManualDrag(e)
}

// Start drag handling
const startManualDrag = (e) => {
  // Don't preventDefault on touch events to allow scrolling
  if (!e.type.includes('touch')) {
    e.preventDefault()
  }

  // Get initial position
  const clientY = e.type.includes('touch')
    ? (e.touches?.[0]?.clientY || 0)
    : e.clientY

  isDragging.value = true
  startY.value = clientY
  startHeight.value = currentHeight.value

  if (containerRef.value) {
    containerRef.value.style.transition = 'none'
  }

  // Add document-level event listeners
  document.addEventListener('mousemove', onManualDrag)
  document.addEventListener('touchmove', onManualDrag, { passive: false })
  document.addEventListener('mouseup', endManualDrag)
  document.addEventListener('touchend', endManualDrag)
}

const onManualDrag = (e) => {
  if (!isDragging.value) return

  const clientY = e.type.includes('touch')
    ? (e.touches?.[0]?.clientY || 0)
    : e.clientY

  // For touch events, we need to determine scroll vs drag intent
  if (e.type.includes('touch')) {
    touchMoveCount++

    // If we're at max height and content is scrollable
    if (isMaxHeight.value && hasScrollableContent()) {
      const deltaY = clientY - touchStartY.value

      // If scrolled down while at top, or clear drag down motion
      if ((isAtTopScroll() && deltaY > 0) || Math.abs(deltaY) > dragThreshold) {
        if (touchMoveCount <= 3) { // Only interfere early in the gesture
          e.preventDefault() // Prevent browser scroll
        }
      } else {
        // User is trying to scroll content
        isScrollingContent.value = true
        isDragging.value = false
        return
      }
    }
  }

  // If user is trying to scroll content, don't handle as a drag
  if (isScrollingContent.value) return

  // Normal drag handling
  if (!e.type.includes('touch')) {
    e.preventDefault()
  }

  const deltaY = clientY - startY.value
  const newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, startHeight.value - deltaY))

  if (containerRef.value) {
    containerRef.value.style.height = `${newHeight}px`
  }
  currentHeight.value = newHeight
}

const endManualDrag = () => {
  if (!isDragging.value && !isScrollingContent.value) return

  document.removeEventListener('mousemove', onManualDrag)
  document.removeEventListener('touchmove', onManualDrag)
  document.removeEventListener('mouseup', endManualDrag)
  document.removeEventListener('touchend', endManualDrag)

  if (containerRef.value) {
    containerRef.value.style.transition = 'height 0.2s ease-out'
  }

  // If it was a real drag (not just a tap or scroll attempt), snap to closest height
  if (isDragging.value) {
    if (heightState.value === 'min') {
      currentHeight.value = MIN_HEIGHT
    } else if (heightState.value === 'mid') {
      currentHeight.value = MID_HEIGHT
    } else {
      currentHeight.value = MAX_HEIGHT
    }
  }

  isDragging.value = false
  isScrollingContent.value = false
}

// Close popup dialog
const closePopup = () => {
  const query = { ...route.query }
  delete query.place
  router.replace({
    path: route.path,
    query: query
  })
}

onMounted(() => {
  currentHeight.value = MIN_HEIGHT
})

onBeforeUnmount(() => {
  // Clean up event listeners
  document.removeEventListener('mousemove', onManualDrag)
  document.removeEventListener('touchmove', onManualDrag)
  document.removeEventListener('mouseup', endManualDrag)
  document.removeEventListener('touchend', endManualDrag)
})
</script>

<template>
  <div v-if="dialog" class="popup-overlay">
    <div ref="containerRef" class="popup-container" :style="{ height: `${currentHeight}px` }">
      <!-- Drag handle - always draggable -->
      <div
        ref="dragHandleRef"
        class="drag-handle"
        @mousedown.stop="handleDragStart"
        @touchstart.stop="handleDragStart"
      >
        <div class="drag-indicator"></div>
      </div>

      <!-- Close button -->
      <button class="close-button" @click="closePopup">
        <span class="icon">✕</span>
      </button>

      <!-- Place details content -->
      <PlaceHeader
        :loading="loading"
        :detail="detail"
        @mousedown="handleContentMouseDown"
        @touchstart="handleContentTouchStart"
      />

      <!-- Content area (scrollable) with photos -->
      <div
        ref="contentRef"
        class="popup-content"
        :class="{
          'is-draggable': !isScrollable,
          'allow-scroll': isScrollable
        }"
        @mousedown="handleContentMouseDown"
        @touchstart="handleContentTouchStart"
      >
        <!-- Image Gallery - only clickable when at max height -->
        <PlacePhotos
          v-if="detail?.photos?.length"
          :loading="loading"
          :photos="detail?.photos"
          :isMaxHeight="isMaxHeight"
          class="place-photos"
        />

        <!-- Tab Navigation -->
        <div class="tab-navigation">
          <div class="tab active">
            <span class="tab-text">개요</span>
          </div>
          <div class="tab">
            <span class="tab-text">메뉴</span>
          </div>
          <div class="tab">
            <span class="tab-text">리뷰</span>
          </div>
          <div class="tab">
            <span class="tab-text">사진</span>
          </div>
          <div class="tab">
            <span class="tab-text">업데이트</span>
          </div>
          <div class="tab">
            <span class="tab-text">정보</span>
          </div>
        </div>

        <InfoPanel :loading="loading" :detail="detail" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  pointer-events: none;
}

.popup-container {
  position: relative;
  background-color: white;
  border-radius: 12px 12px 0 0;
  overflow: hidden;
  transition: height 0.2s ease-out;
  display: flex;
  flex-direction: column;
  width: 100%;
  will-change: transform, height;
  transform: translateY(100%);
  animation: slideUp 0.3s forwards;
  pointer-events: auto;
  border-top: 1px solid #eee;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.drag-handle {
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  user-select: none;
  touch-action: none;
  z-index: 100;
}

.drag-indicator {
  width: 36px;
  height: 4px;
  background-color: #e0e0e0;
  border-radius: 2px;
}

.close-button {
  position: absolute;
  top: 16px;
  right: 16px;
  background: #f2f2f2;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  font-size: 16px;
}

.popup-content {
  flex: 1;
  position: relative;
  overflow-y: hidden;
}

.popup-content.allow-scroll {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.popup-content.is-draggable {
  cursor: grab;
  user-select: none;
}

/* Place Photos component styles */
.place-photos img {
  cursor: pointer !important;
}

.tab-navigation {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  width: 100%;
  overflow-x: auto;
  background-color: white;
  border-bottom: 1px solid #f0f0f0;
  white-space: nowrap;
}

.tab {
  flex: 1;
  min-width: 60px;
  padding: 12px 8px;
  text-align: center;
  font-size: 14px;
  color: #666;
}

.tab.active {
  color: #009688;
  border-bottom: 2px solid #009688;
}
</style>