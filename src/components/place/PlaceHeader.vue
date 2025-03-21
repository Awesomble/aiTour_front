<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  loading: {
    type: Boolean,
    default: true
  },
  detail: {
    type: Object,
    require: true
  }
})

// Simplified emit to match popup's handleContentStart
defineEmits(['mousedown', 'touchstart'])

// Format day name to Korean
const formatDay = (day: any) => {
  const dayMap = {
    'Monday': '월요일',
    'Tuesday': '화요일',
    'Wednesday': '수요일',
    'Thursday': '목요일',
    'Friday': '금요일',
    'Saturday': '토요일',
    'Sunday': '일요일'
  }
  return dayMap[day] || day
}

// Get current day
const getCurrentDay = () => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[new Date().getDay()]
}

// Check if operating hours are available
const hasOperatingHours = computed(() => {
  if (!props.detail?.operating_hours) return false
  return props.detail.operating_hours.some((hour: any) =>
    !hour.is_closed && hour.open_time && hour.close_time
  )
})

// Get operating status text
const operatingStatus = computed(() => {
  if (!props.detail || !hasOperatingHours.value) return '영업시간 정보 없음'

  const today = getCurrentDay()
  const todayHours = props.detail.operating_hours.find(h => h.day_of_week === today)

  if (!todayHours) return '영업시간 정보 없음'
  if (todayHours.is_closed) return '오늘 휴무'
  if (!todayHours.open_time || !todayHours.close_time) return '항상 영업 중' // Always open if no specific times

  return `오늘 ${todayHours.open_time || '00:00'} ~ ${todayHours.close_time || '24:00'}`
})
</script>

<template>
  <!-- Forward events directly without any additional logic -->
  <div
    v-if="!loading"
    class="place-header"
    @mousedown="$emit('mousedown', $event)"
    @touchstart="$emit('touchstart', $event)">
    <!-- Place name -->
    <h1 class="place-name">{{ detail?.name }}</h1>

    <!-- Category with icon -->
    <div class="category-container">
      <div
        class="category-icon"
        v-if="detail?.category?.icon"
        v-html="detail?.category.icon"
        :style="{ color: detail?.category?.icon_color || '#673AB7' }">
      </div>
      <span class="category">{{ detail?.category?.name || 'Landmark' }}</span>
    </div>

    <!-- Address -->
    <div v-if="false" class="address-container">
      <span class="address-icon">📍</span>
      <span class="address">{{ detail?.address }}</span>
    </div>

    <!-- Operating hours -->
    <div class="business-hours">
      <span class="hours-icon">🕒</span>
      <span class="hours-text">{{ operatingStatus }}</span>
    </div>
  </div>

  <!-- Skeleton loading state -->
  <div
    v-if="loading"
    class="place-header-skeleton"
    @mousedown="$emit('mousedown', $event)"
    @touchstart="$emit('touchstart', $event)">
    <div class="skeleton-title"></div>
    <div class="skeleton-category"></div>
    <div class="skeleton-address"></div>
    <div class="skeleton-hours"></div>
  </div>
</template>

<style scoped lang="scss">
/* Place header styling */
.place-header {
  padding: 2px 16px 12px;
  background-color: white;
}

.place-name {
  font-size: 18px;
  font-weight: 400;
  margin: 0 0 12px 0;
  color: #202124;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.rating-container {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
}

.visit-time {
  display: flex;
  align-items: center;
  color: #5f6368;

  .icon {
    margin-right: 4px;
  }
}

/* Category styling */
.category-container {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  color: #5f6368;
}

.category-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  width: 20px;
  height: 20px;

  svg {
    width: 18px;
    height: 18px;
  }
}

.category {
  font-weight: 500;
}

.category-description {
  color: #5f6368;
}

.dot-separator {
  margin: 0 8px;
  color: #dadce0;
}

/* Address styling */
.address-container {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
  font-size: 14px;
  color: #3c4043;
}

.address-icon {
  margin-right: 8px;
  font-size: 16px;
  line-height: 1.2;
}

.address {
  flex: 1;
  line-height: 1.4;
}

/* Business hours */
.business-hours {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #3c4043;
  margin-bottom: 4px;
}

.hours-icon {
  margin-right: 8px;
  font-size: 16px;
}

.hours-text {
  color: #188038; /* Google Maps green for open status */
  font-weight: 500;
}

/* Skeleton loading */
.place-header-skeleton {
  padding: 16px;
  background-color: white;
}

.skeleton-title, .skeleton-category, .skeleton-address, .skeleton-hours {
  height: 16px;
  background-color: #f0f0f0;
  border-radius: 4px;
  margin-bottom: 16px;
  animation: skeleton-pulse 1.5s infinite;
}

.skeleton-title {
  height: 24px;
  width: 80%;
}

.skeleton-category {
  width: 40%;
}

.skeleton-address {
  width: 70%;
}

.skeleton-hours {
  width: 50%;
}

@keyframes skeleton-pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}
</style>