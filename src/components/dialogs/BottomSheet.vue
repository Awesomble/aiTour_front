<template>
  <div class="bottom-sheet-container" v-if="dialog">
    <!-- Map Background -->
    <div class="map-background">
      <slot name="map"></slot>
    </div>

    <!-- Bottom Sheet -->
    <div
      ref="sheetRef"
      class="bottom-sheet"
      :class="[`position-${currentPosition}`]"
      :style="{ height: `${sheetHeight}px`, transform: `translateY(${translateY}px)` }"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
      @mousedown="onMouseDown"
    >
      <!-- Pill Indicator -->
      <div class="pill-indicator">
        <div class="pill"></div>
      </div>

      <!-- Content -->
      <div class="sheet-content">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps({
  dialog: {
    type: Boolean,
    default: false
  },
  initialPosition: {
    type: String,
    default: 'medium' // 'min', 'medium', 'max'
  }
})

const emit = defineEmits(['update:dialog', 'position-changed'])

// DOM references
const sheetRef = ref<HTMLElement | null>(null)

// State
const isDragging = ref(false)
const startY = ref(0)
const startTranslateY = ref(0)
const translateY = ref(0)
const currentPosition = ref(props.initialPosition)
const screenHeight = ref(window.innerHeight)
const sheetHeight = ref(0)

// Position heights (percentage of screen)
const positions = {
  min: 0.25,    // 25% of screen height
  medium: 0.6,  // 60% of screen height
  max: 0.92     // 92% of screen height (leaves room for status bar)
}

// Router
const router = useRouter()

// Set sheet height based on position
const setSheetHeight = (position = currentPosition.value) => {
  sheetHeight.value = Math.round(screenHeight.value * positions[position])
}

// Initialize sheet position
const initPosition = () => {
  if (!sheetRef.value) return

  // Set initial height based on position
  setSheetHeight()

  // Reset transform
  translateY.value = 0
}

// Determine new position based on current drag
const getTargetPosition = () => {
  if (!sheetRef.value) return currentPosition.value

  const currentPercent = (sheetHeight.value - translateY.value) / screenHeight.value

  // Thresholds for changing positions
  const minThreshold = (positions.min + positions.medium) / 2
  const maxThreshold = (positions.medium + positions.max) / 2

  if (currentPercent < minThreshold) {
    return 'min'
  } else if (currentPercent > maxThreshold) {
    return 'max'
  } else {
    return 'medium'
  }
}

// Apply position change with animation
const snapToPosition = (position) => {
  // Don't change if already at this position and not dragging
  if (position === currentPosition.value && !isDragging.value) return

  currentPosition.value = position

  // Set new height
  setSheetHeight(position)

  // Reset translation
  translateY.value = 0

  // Emit event
  emit('position-changed', position)
}

// Touch events
const onTouchStart = (e) => {
  // Don't capture touches on images
  if (e.target.tagName === 'IMG') return

  startDrag(e.touches[0].clientY)
}

const onTouchMove = (e) => {
  if (!isDragging.value) return
  updateDragPosition(e.touches[0].clientY)
}

const onTouchEnd = () => {
  endDrag()
}

// Mouse events
const onMouseDown = (e) => {
  // Don't capture clicks on images
  if (e.target.tagName === 'IMG') return

  startDrag(e.clientY)

  // Add global mouse event listeners
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

const onMouseMove = (e) => {
  if (!isDragging.value) return
  updateDragPosition(e.clientY)
}

const onMouseUp = () => {
  endDrag()

  // Remove global mouse event listeners
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
}

// Drag helpers
const startDrag = (clientY) => {
  isDragging.value = true
  startY.value = clientY
  startTranslateY.value = translateY.value
}

const updateDragPosition = (clientY) => {
  const deltaY = clientY - startY.value
  let newTranslateY = startTranslateY.value + deltaY

  // Add resistance when pulling down too much
  const maxTranslateY = sheetHeight.value * 0.6
  if (newTranslateY > maxTranslateY) {
    newTranslateY = maxTranslateY + (newTranslateY - maxTranslateY) * 0.2
  }

  // Add resistance when pushing up too much
  if (newTranslateY < 0) {
    newTranslateY = newTranslateY * 0.2
  }

  translateY.value = newTranslateY
}

const endDrag = () => {
  if (!isDragging.value) return
  isDragging.value = false

  // Determine which position to snap to
  const targetPosition = getTargetPosition()
  snapToPosition(targetPosition)
}

// Window resize handler
const handleResize = () => {
  screenHeight.value = window.innerHeight
  setSheetHeight()
}

// Watch for dialog changes
watch(() => props.dialog, (newValue) => {
  if (newValue) {
    nextTick(() => {
      initPosition()
    })
  }
})

// Watch for initialPosition changes
watch(() => props.initialPosition, (newValue) => {
  if (props.dialog) {
    snapToPosition(newValue)
  }
})

// Lifecycle hooks
onMounted(() => {
  window.addEventListener('resize', handleResize)

  if (props.dialog) {
    nextTick(() => {
      initPosition()
    })
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
.bottom-sheet-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;

  .map-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
  }

  .bottom-sheet {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    background-color: white;
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s cubic-bezier(0.33, 1, 0.68, 1), height 0.3s cubic-bezier(0.33, 1, 0.68, 1);
    will-change: transform, height;
    z-index: 2;
    overflow: hidden;

    &.position-min {
      min-height: 120px;
    }

    &.position-medium {
      min-height: 50%;
    }

    &.position-max {
      min-height: 85%;
    }

    .pill-indicator {
      width: 100%;
      height: 24px;
      display: flex;
      justify-content: center;
      align-items: center;

      .pill {
        width: 36px;
        height: 4px;
        background-color: #ddd;
        border-radius: 2px;
      }
    }

    .sheet-content {
      width: 100%;
      height: calc(100% - 24px);
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }
  }
}
</style>