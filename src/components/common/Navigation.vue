<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGlobalStore, useUserStore } from '@/store'
import { getInitials } from '@/plugins/utils'
import { Home, MapPin, Sparkles, Briefcase, LogOut } from 'lucide-vue-next'
import { useRoute } from 'vue-router'

const route = useRoute()
const golbalStore = useGlobalStore()
const userStore = useUserStore()
const locationSharing = ref(true)
const travelHistorySharing = ref(false)
const chatAcceptance = ref(true)

const isActive = (routeName: string) => {
  return computed(() => route.name === routeName)
}
</script>

<template>
  <v-navigation-drawer
    color="white"
    location="right"
    v-model="golbalStore.isNavigation"
    class="nav-drawer"
  >
    <!-- 프로필 -->
    <div class="profile-section">
      <v-avatar size="48" color="primary" class="elevation-1">
        <v-img v-if="userStore?.userInfo?.thumbnail_url" :src="userStore.userInfo.thumbnail_url" />
        <span v-else class="text-body-1 text-white">{{ getInitials(userStore.userInfo?.user_name) }}</span>
      </v-avatar>
      <div class="user-info">
        <div class="username">{{ userStore.userInfo?.user_name || 'Guest' }}</div>
        <v-btn
          class="profile-edit-btn"
          variant="text"
          size="x-small"
          color="primary"
          :to="{ name: 'my-page' }"
        >
          <v-icon size="small" start>mdi-pencil</v-icon>
          Edit Profile
        </v-btn>
      </div>
    </div>

    <!-- 메인 메뉴 -->
    <div class="menu-section">
      <router-link :to="{ name: 'main-home' }" class="menu-item" :class="{ 'active': isActive('home').value }">
        <Home :size="20" :stroke-width="isActive('main-home').value ? 2.5 : 1.8" />
        <span>Home</span>
      </router-link>

      <router-link :to="{ name: 'main-map' }" class="menu-item" :class="{ 'active': isActive('map').value }">
        <MapPin :size="20" :stroke-width="isActive('main-map').value ? 2.5 : 1.8" />
        <span>Map</span>
      </router-link>

      <router-link :to="{ name: 'tour-planner' }" class="menu-item" :class="{ 'active': isActive('tour-planner').value }">
        <Sparkles :size="20" :stroke-width="isActive('tour-planner').value ? 2.5 : 1.8" />
        <span>AI Planner</span>
      </router-link>

      <router-link :to="{ name: 'my-bag' }" class="menu-item" :class="{ 'active': isActive('my-bag').value }">
        <Briefcase :size="20" :stroke-width="isActive('my-bag').value ? 2.5 : 1.8" />
        <span>Bag</span>
      </router-link>
    </div>

    <!-- 공유 설정 -->
    <div class="settings-section">
      <div class="section-title">Sharing Settings</div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-name">Real-time Location</div>
          <div class="setting-desc">Share your location with friends</div>
        </div>
        <v-switch v-model="locationSharing" color="primary" density="compact" hide-details></v-switch>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-name">Travel History</div>
          <div class="setting-desc">Let others see places you've visited</div>
        </div>
        <v-switch v-model="travelHistorySharing" color="primary" density="compact" hide-details></v-switch>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-name">Chat Acceptance</div>
          <div class="setting-desc">Allow messages from travelers</div>
        </div>
        <v-switch v-model="chatAcceptance" color="primary" density="compact" hide-details></v-switch>
      </div>
    </div>
  </v-navigation-drawer>
</template>

<style scoped>
.nav-drawer {
  display: flex;
  flex-direction: column;
  height: 100vh!important;
  padding: 50px 12px 16px;
  top: 0!important;
}

.profile-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 8px 16px;
  border-bottom: 1px solid rgba(0,0,0,0.08);
  margin-bottom: 16px;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: 500;
  font-size: 0.95rem;
  margin-bottom: 4px;
}

.profile-edit-btn {
  align-self: flex-start;
  height: 24px;
  font-size: 0.75rem;
  text-transform: none;
  letter-spacing: 0;
}

.menu-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(0,0,0,0.08);
  padding-bottom: 16px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  text-decoration: none;
  color: rgba(0,0,0,0.8);
  font-weight: 400;
  font-size: 0.9rem;
  transition: all 0.15s ease;
}

.menu-item:hover {
  background: rgba(0,0,0,0.04);
}

.menu-item.active {
  background: rgba(25,118,210,0.1);
  color: #1976d2;
  font-weight: 500;
}

.settings-section {
  flex: 1;
}

.section-title {
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(0,0,0,0.6);
  margin-bottom: 8px;
  padding: 0 8px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 8px;
  border-bottom: 1px solid rgba(0,0,0,0.04);
}

.setting-name {
  font-size: 12px;
  font-weight: 400;
  margin-bottom: 1px;
}

.setting-desc {
  font-size: 10px;
  color: rgba(0,0,0,0.6);
}

.logout-btn {
  margin-top: 16px;
}
</style>