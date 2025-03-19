<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, User, MapPin, Heart, MessageCircle, Share2, Map, Compass, AlertCircle, Plane } from 'lucide-vue-next'

const router = useRouter()
const notifications = ref([
  {
    id: 1,
    type: 'trip_invite',
    username: 'Sarah Kim',
    avatar: null,
    content: 'invited you to a trip to Jeju Island',
    time: '2 hours ago',
    read: false
  },
  {
    id: 2,
    type: 'location_share',
    username: 'Mike Johnson',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    content: 'shared their location in Tokyo',
    time: '5 hours ago',
    read: false
  },
  {
    id: 3,
    type: 'travel_alert',
    username: 'Travel Alert',
    avatar: null,
    content: 'Weather warning for your upcoming Osaka trip',
    time: 'Yesterday',
    read: true
  },
  {
    id: 4,
    type: 'itinerary_update',
    username: 'David Park',
    avatar: null,
    content: 'modified your shared Tokyo itinerary',
    time: 'Yesterday',
    read: true
  },
  {
    id: 5,
    type: 'recommendation',
    username: 'TravelApp',
    avatar: null,
    content: '5 new recommendations for your Kyoto trip',
    time: '2 days ago',
    read: true
  }
])

const getIconForType = (type) => {
  switch (type) {
    case 'trip_invite':
      return Plane
    case 'location_share':
      return MapPin
    case 'travel_alert':
      return AlertCircle
    case 'itinerary_update':
      return Map
    case 'recommendation':
      return Compass
    default:
      return MessageCircle
  }
}

const getIconColorForType = (type) => {
  switch (type) {
    case 'trip_invite':
      return '#3F51B5'
    case 'location_share':
      return '#4CAF50'
    case 'travel_alert':
      return '#F44336'
    case 'itinerary_update':
      return '#FF9800'
    case 'recommendation':
      return '#009688'
    default:
      return '#2196F3'
  }
}

const markAllAsRead = () => {
  notifications.value = notifications.value.map(notification => ({
    ...notification,
    read: true
  }))
}

const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}
</script>

<template>
  <div class="notifications-page">
    <!-- Floating Header -->
    <div class="floating-header mt-12" v-if="false">
      <div class="d-flex align-center justify-space-between px-4 py-2">
        <v-spacer />
        <v-btn
          variant="text"
          color="primary"
          density="compact"
          @click="markAllAsRead"
          class="mark-read-btn"
        >
          Clear all
        </v-btn>
      </div>
    </div>

    <!-- Notification List -->
    <div class="notification-list mt-12">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="notification-item"
        :class="{ 'unread': !notification.read }"
      >
        <div class="notification-avatar">
          <v-avatar v-if="notification.avatar" size="44" class="elevation-1">
            <v-img :src="notification.avatar"></v-img>
          </v-avatar>
          <v-avatar v-else size="44" :color="getIconColorForType(notification.type)" class="white--text elevation-1">
            <span class="text-subtitle-1 text-white">{{ getInitials(notification.username) }}</span>
          </v-avatar>
        </div>

        <div class="notification-content">
          <div class="notification-text">
            <span class="username">{{ notification.username }}</span>
            <span class="action">{{ notification.content }}</span>
          </div>
          <div class="notification-time">{{ notification.time }}</div>
        </div>

        <div class="notification-icon" :style="{ color: getIconColorForType(notification.type), backgroundColor: `${getIconColorForType(notification.type)}15` }">
          <component :is="getIconForType(notification.type)" :size="20" :stroke-width="2" />
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="notifications.length === 0" class="empty-state">
        <div class="empty-icon">✈️</div>
        <p class="empty-title">No travel notifications</p>
        <p class="text-body-2 text-medium-emphasis">Your trip updates will appear here</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notifications-page {
  background-color: #f7f9fc;
  min-height: 100vh;
}

.floating-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  z-index: 5;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  padding: 4px 0;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
}

.back-btn:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.notification-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
}

.mark-read-btn {
  font-size: 0.8rem;
  letter-spacing: 0;
  text-transform: none;
}

.notification-list {
  padding: 0;
}

.notification-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: white;
  margin-bottom: 2px;
  transition: all 0.2s ease;
  position: relative;
  border-radius: 2px;
}

.notification-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.05);
}

.notification-item.unread {
  background-color: rgba(25, 118, 210, 0.04);
}

.notification-item.unread::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 4px;
  background-color: #1976d2;
  border-radius: 2px 0 0 2px;
}

.notification-avatar {
  margin-right: 16px;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-text {
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.username {
  font-weight: 600;
  margin-right: 4px;
  color: #1a1a1a;
}

.action {
  color: rgba(0, 0, 0, 0.7);
  font-weight: 400;
}

.notification-time {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.5);
  font-weight: 500;
}

.notification-icon {
  margin-left: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.notification-item:hover .notification-icon {
  transform: scale(1.05);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 16px;
  text-align: center;
  color: rgba(0, 0, 0, 0.7);
}

.empty-icon {
  font-size: 56px;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: #1a1a1a;
}
</style>