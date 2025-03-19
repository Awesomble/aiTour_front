<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPlacesDetailAPI } from '@/network/app'

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
const loading = ref(false)
const containerRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)

// Height states
const MIN_HEIGHT = 150
const MID_HEIGHT = 300
const MAX_HEIGHT = window.innerHeight - 50
const currentHeight = ref(MIN_HEIGHT)

// Dragging state
const isDragging = ref(false)
const startY = ref(0)
const startHeight = ref(0)

// Scroll state
const isAtTopScroll = ref(true)

// Computed current height state: 'min', 'mid', 'max'
const heightState = computed(() => {
  if (currentHeight.value <= (MIN_HEIGHT + MID_HEIGHT) / 2) return 'min'
  if (currentHeight.value <= (MID_HEIGHT + MAX_HEIGHT) / 2) return 'mid'
  return 'max'
})

// Business hours status
const isBusinessOpen = computed(() => {
  if (!detail.value) return false
  const today = getCurrentDay()
  const currentHour = new Date().getHours()
  const currentMinutes = new Date().getMinutes()

  const todayHours = detail.value.operating_hours.find(h => h.day_of_week === today)
  if (!todayHours || todayHours.is_closed) return false

  const openTimeParts = todayHours.open_time.split(':').map(Number)
  const closeTimeParts = todayHours.close_time.split(':').map(Number)

  const openTimeMinutes = openTimeParts[0] * 60 + openTimeParts[1]
  const closeTimeMinutes = closeTimeParts[0] * 60 + closeTimeParts[1]
  const currentTimeMinutes = currentHour * 60 + currentMinutes

  return currentTimeMinutes >= openTimeMinutes && currentTimeMinutes < closeTimeMinutes
})

const isAboutToOpen = computed(() => {
  if (!detail.value) return false
  const today = getCurrentDay()
  const currentHour = new Date().getHours()
  const currentMinutes = new Date().getMinutes()

  const todayHours = detail.value.operating_hours.find(h => h.day_of_week === today)
  if (!todayHours || todayHours.is_closed) return false

  const openTimeParts = todayHours.open_time.split(':').map(Number)
  const openTimeMinutes = openTimeParts[0] * 60 + openTimeParts[1]
  const currentTimeMinutes = currentHour * 60 + currentMinutes

  return currentTimeMinutes >= openTimeMinutes - 15 && currentTimeMinutes < openTimeMinutes
})

const isAboutToClose = computed(() => {
  if (!detail.value) return false
  const today = getCurrentDay()
  const currentHour = new Date().getHours()
  const currentMinutes = new Date().getMinutes()

  const todayHours = detail.value.operating_hours.find(h => h.day_of_week === today)
  if (!todayHours || todayHours.is_closed) return false

  const closeTimeParts = todayHours.close_time.split(':').map(Number)
  const closeTimeMinutes = closeTimeParts[0] * 60 + closeTimeParts[1]
  const currentTimeMinutes = currentHour * 60 + currentMinutes

  return currentTimeMinutes >= closeTimeMinutes - 15 && currentTimeMinutes < closeTimeMinutes
})

// Check if content area is scrollable
const isScrollable = computed(() => {
  if (!contentRef.value) return false
  return contentRef.value.scrollHeight > contentRef.value.clientHeight
})

// Get current day function
const getCurrentDay = () => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[new Date().getDay()]
}

// Format business hours
const formatBusinessHours = () => {
  if (!detail.value) return ''
  const today = getCurrentDay()
  const todayHours = detail.value.operating_hours.find(h => h.day_of_week === today)

  if (!todayHours || todayHours.is_closed) return '오늘 휴무'
  return `오늘 ${todayHours.open_time} ~ ${todayHours.close_time}`
}

// Open dialog when route query has 'place'
watch(() => route.query, (newQuery) => {
  if (newQuery.place) {
    getPlaceDetail()
    dialog.value = true
    currentHeight.value = MIN_HEIGHT
  } else {
    dialog.value = false
  }
}, { immediate: true })

// Watch for model value changes
watch(() => props.modelValue, (newVal) => {
  dialog.value = newVal
})
// Emit model update when dialog changes
watch(dialog, (newVal) => {
  emit('update:modelValue', newVal)
})

// Get place details (mock API call)
const getPlaceDetail = async () => {
  if (!route.query.place) return
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    detail.value = {
      name: "퐁년닭도리탕 본점",
      category: { name: "닭요리전문점", icon: "🍗", icon_color: "#FF9800" },
      price_range: "₩10,000~20,000",
      photos: [{ url: "https://example.com/image.jpg" }],
      operating_hours: [
        { day_of_week: "Monday", open_time: "14:00", close_time: "16:00", is_closed: false },
        { day_of_week: "Tuesday", open_time: "11:00", close_time: "21:00", is_closed: false },
        { day_of_week: "Wednesday", open_time: "11:00", close_time: "21:00", is_closed: false },
        { day_of_week: "Thursday", open_time: "11:00", close_time: "21:00", is_closed: false },
        { day_of_week: "Friday", open_time: "11:00", close_time: "22:00", is_closed: false },
        { day_of_week: "Saturday", open_time: "11:00", close_time: "22:00", is_closed: false },
        { day_of_week: "Sunday", is_closed: true }
      ]
    }
  } catch (error) {
    console.error("Error fetching place details:", error)
  } finally {
    loading.value = false
  }
}

// Check scroll position of content area
const checkScrollPosition = () => {
  if (!contentRef.value) return
  isAtTopScroll.value = contentRef.value.scrollTop === 0
}

// Handle content start:
// - If not maximized, anywhere touched will start drag.
// - If maximized, only start drag when scroll is at the top.
const handleContentStart = (e) => {
  if (heightState.value !== 'max') {
    startDrag(e)
    return
  }
  if (heightState.value === 'max' && contentRef.value) {
    const scrollTop = contentRef.value.scrollTop
    // Only trigger drag if scroll is exactly at the top (0)
    if (scrollTop !== 0) {
      return;
    }
  }
  const y = e.type.includes('touch') ? e.touches[0].clientY : e.clientY
  startY.value = y
  document.addEventListener('mousemove', onInitialDragAtTop)
  document.addEventListener('touchmove', onInitialDragAtTop, { passive: false })
  document.addEventListener('mouseup', cancelInitialDrag)
  document.addEventListener('touchend', cancelInitialDrag)
}

// Start drag (for non-maximized states)
const startDrag = (e) => {
  if (heightState.value !== 'max') {
    e.preventDefault()
  }
  startActualDrag(e)
}

// Initial drag detection when at top and maximized
const onInitialDragAtTop = (e) => {
  const y = e.type.includes('touch') ? e.touches[0].clientY : e.clientY
  const deltaY = y - startY.value
  if (deltaY > 5) {
    e.preventDefault()
    document.removeEventListener('mousemove', onInitialDragAtTop)
    document.removeEventListener('touchmove', onInitialDragAtTop)
    document.removeEventListener('mouseup', cancelInitialDrag)
    document.removeEventListener('touchend', cancelInitialDrag)
    const newEvent = {
      type: e.type,
      clientY: y,
      preventDefault: () => e.preventDefault(),
      touches: e.touches
    }
    startActualDrag(newEvent)
  } else {
    cancelInitialDrag()
  }
}

// Cancel initial drag detection
const cancelInitialDrag = () => {
  document.removeEventListener('mousemove', onInitialDragAtTop)
  document.removeEventListener('touchmove', onInitialDragAtTop)
  document.removeEventListener('mouseup', cancelInitialDrag)
  document.removeEventListener('touchend', cancelInitialDrag)
}

// Start the actual dragging process
const startActualDrag = (e) => {
  isDragging.value = true
  startY.value = e.type.includes('touch') ? e.touches[0].clientY : e.clientY
  startHeight.value = currentHeight.value
  if (containerRef.value) {
    containerRef.value.style.transition = 'none'
  }
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('touchmove', onDrag, { passive: false })
  document.addEventListener('mouseup', endDrag)
  document.addEventListener('touchend', endDrag)
}

// Handle dragging movement
const onDrag = (e) => {
  if (!isDragging.value) return
  e.preventDefault()
  const y = e.type.includes('touch') ? e.touches[0].clientY : e.clientY
  const deltaY = y - startY.value
  const newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, startHeight.value - deltaY))
  if (containerRef.value) {
    containerRef.value.style.height = `${newHeight}px`
  }
  currentHeight.value = newHeight
}

// End dragging process
const endDrag = () => {
  if (!isDragging.value) return
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('mouseup', endDrag)
  document.removeEventListener('touchend', endDrag)
  if (containerRef.value) {
    containerRef.value.style.transition = 'height 0.2s ease-out'
  }
  if (heightState.value === 'min') {
    currentHeight.value = MIN_HEIGHT
  } else if (heightState.value === 'mid') {
    currentHeight.value = MID_HEIGHT
  } else {
    currentHeight.value = MAX_HEIGHT
  }
  isDragging.value = false
}

// Close popup dialog
const closePopup = () => {
  router.go(-1)
}

onMounted(() => {
  currentHeight.value = MIN_HEIGHT
  if (contentRef.value) {
    contentRef.value.addEventListener('scroll', checkScrollPosition)
  }
})
</script>

<template>
  <div v-if="dialog" class="popup-overlay">
    <div ref="containerRef" class="popup-container" :style="{ height: `${currentHeight}px` }">
      <!-- Drag handle -->
      <div class="drag-handle" @mousedown="startDrag" @touchstart="startDrag">
        <div class="drag-indicator"></div>
      </div>

      <!-- Close button (moved higher) -->
      <button class="close-button" @click="closePopup">
        <span class="icon">✕</span>
      </button>

      <!-- Place details header section (fixed, non-scrollable, draggable) -->
      <div v-if="!loading" class="place-header" @mousedown="startDrag" @touchstart="startDrag">
        <h1 class="place-title">{{ detail?.name }}</h1>
        <div class="place-meta">
          <span class="category-price">
            <span v-if="detail?.category?.name">{{ detail?.category.name }}</span>
            <span v-if="detail?.price_range"> · {{ detail?.price_range }}</span>
          </span>
        </div>
        <div class="business-hours">
          <span v-if="isBusinessOpen" class="status open">영업중</span>
          <span v-else-if="isAboutToOpen" class="status about-to-open">곧 영업 시작</span>
          <span v-else-if="isAboutToClose" class="status about-to-close">곧 영업 종료</span>
          <span v-else class="status closed">영업 종료</span>
          <span class="hours">{{ formatBusinessHours() }}</span>
        </div>
      </div>

      <!-- Skeleton loading for header -->
      <div v-if="loading" class="place-header-skeleton">
        <div class="skeleton-title"></div>
        <div class="skeleton-category"></div>
        <div class="skeleton-hours"></div>
      </div>

      <!-- Content area (scrollable) -->
      <div ref="contentRef" class="popup-content"
           :class="{
             'is-draggable': heightState !== 'max',
             'allow-scroll': heightState === 'max'
           }"
           @mousedown="handleContentStart"
           @touchstart="handleContentStart">
        <!-- Skeleton loading for image -->
        <div v-if="loading" class="v-skeleton-loader__image"></div>

        <!-- Place image -->
        <div v-else class="place-image">
          <img v-if="detail?.photos?.length" :src="detail?.photos[0].url" alt="Place image">
          <div v-else class="no-image">No image available</div>
        </div>

        <!-- Place details -->
        <div v-if="detail" class="place-details">
          <!-- Operating hours -->
          <div class="divider"></div>
          <div class="operating-hours">
            <div v-for="(hours, index) in detail?.operating_hours" :key="index" class="hour-chip" :class="{ 'is-today': hours.day_of_week === getCurrentDay() }">
              {{ hours.day_of_week }}:
              <span v-if="hours.is_closed">Closed</span>
              <span v-else>{{ hours.open_time }} ~ {{ hours.close_time }}</span>
            </div>
          </div>

          <!-- Dummy content for scroll demonstration -->
          <div v-if="heightState === 'max'" class="dummy-content">
            <div v-for="i in 10" :key="i" class="dummy-item">
              Additional content {{ i }}
            </div>
          </div>
        </div>
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
  pointer-events: none; /* Makes overlay transparent to clicks */
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
  pointer-events: auto; /* Re-enable pointer events for the popup itself */
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.drag-handle {
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  user-select: none;
  touch-action: none;
}

.drag-indicator {
  width: 36px;
  height: 4px;
  background-color: #e0e0e0;
  border-radius: 2px;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 16px;
  background: #fff;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
}

.popup-content {
  flex: 1;
  position: relative;
  overflow-y: hidden;
}

.popup-content.allow-scroll {
  overflow-y: auto !important;
  -webkit-overflow-scrolling: touch;
}

.popup-content.is-draggable {
  cursor: grab;
  user-select: none;
}

/* Skeleton loading */
.place-header-skeleton {
  padding: 0px 16px 10px;
  background-color: white;
  height: 82px; /* Same fixed height as actual header */
}

.skeleton-title {
  height: 20px;
  width: 60%;
  border-radius: 4px;
  background-color: #f0f0f0;
  margin-bottom: 8px;
  animation: skeleton-pulse 1.5s infinite;
}

.skeleton-category {
  height: 12px;
  width: 40%;
  border-radius: 4px;
  background-color: #f0f0f0;
  margin-bottom: 8px;
  animation: skeleton-pulse 1.5s infinite;
}

.skeleton-hours {
  height: 18px;
  width: 100px;
  border-radius: 12px;
  background-color: #f0f0f0;
  animation: skeleton-pulse 1.5s infinite;
}

.v-skeleton-loader__image {
  height: 200px;
  background-color: #f0f0f0;
  animation: skeleton-pulse 1.5s infinite;
}

@keyframes skeleton-pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

/* New place header styling */
.place-header {
  padding: 0px 16px 10px;
  background-color: white;
  position: sticky;
  top: 0;
  z-index: 5;
  cursor: grab;
  user-select: none;
  touch-action: none;
  height: 82px; /* Fixed height to match skeleton */
}

.place-title {
  font-size: 20px;
  margin: 0 0 8px 0;
  color: #333;
}

.place-meta {
  margin-bottom: 8px;
}

.category-price {
  font-size: 14px;
  color: #666;
}

.business-hours {
  display: flex;
  align-items: center;
  margin-top: 4px;
}

.status {
  font-size: 14px;
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 4px;
  margin-right: 8px;
}

.status.open {
  background-color: #4CAF50;
  color: white;
}

.status.about-to-open {
  background-color: #FFC107;
  color: #333;
}

.status.about-to-close {
  background-color: #FF9800;
  color: white;
}

.status.closed {
  background-color: #F44336;
  color: white;
}

.hours {
  font-size: 14px;
  color: #666;
}

.place-image {
  width: 100%;
  height: 200px;
  background-color: #f5f5f5;
  overflow: hidden;
}

.place-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}

.place-details {
  padding: 16px;
}

.divider {
  height: 1px;
  background-color: #eee;
  margin: 16px 0;
}

.operating-hours {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hour-chip {
  background-color: #f5f5f5;
  border-radius: 16px;
  padding: 4px 12px;
  font-size: 12px;
}

.hour-chip.is-today {
  background-color: #6200ea;
  color: white;
}

.dummy-content {
  margin-top: 20px;
}

.dummy-item {
  padding: 10px;
  margin-bottom: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
}
</style>