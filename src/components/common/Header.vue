<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Menu, Bell, Search, ArrowLeft } from 'lucide-vue-next'
import { useGlobalStore } from '@/store'

const route = useRoute()
const router = useRouter()
const globalStore = useGlobalStore()
const hasNotifications = ref(true)

const toggleNavigation = () => {
  globalStore.isNavigation = !globalStore.isNavigation
}
</script>

<template>
  <v-app-bar flat density="compact" class="custom-header px-4">
    <div class="d-flex align-center justify-space-between w-100">
      <button v-if="route.meta.historyBack" class="back-btn" @click="router.go(-1)">
        <ArrowLeft :size="24" :stroke-width="1.5" />
      </button>

      <v-spacer />

      <!-- Action Icons -->
      <div class="action-icons">
        <button class="icon-btn notification-btn" @click="router.push('/notifications')">
          <div class="icon-wrapper">
            <Bell :size="22" :stroke-width="1.5" class="icon-with-shadow" />
            <span v-if="hasNotifications" class="notification-indicator"></span>
          </div>
        </button>

        <button class="icon-btn" @click="toggleNavigation">
          <div class="icon-wrapper">
            <Menu :size="24" :stroke-width="1.5" class="icon-with-shadow" />
          </div>
        </button>
      </div>
    </div>
  </v-app-bar>
</template>

<style scoped>
.custom-header {
  background-color: transparent;
}

.action-icons {
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon-btn {
  position: relative;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  width: 40px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-btn:active {
  transform: scale(0.95);
}

.icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  color: rgba(0,0,0,0.8);
}

.icon-with-shadow {
  filter: drop-shadow(0px 1px 2px rgba(0,0,0,0.2));
}

.icon-btn:hover .icon-wrapper {
  background-color: rgba(0,0,0,0.05);
  border-radius: 50%;
}

.notification-indicator {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  background-color: #f44336;
  border-radius: 50%;
  box-shadow: 0 0 0 1.5px white, 0 1px 2px rgba(0,0,0,0.3);
}
</style>