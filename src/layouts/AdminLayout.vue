<script setup lang="ts">
import { ref } from 'vue'
import AdminNavigation from '@/components/common/AdminNavigation.vue'
import { useRoute } from 'vue-router'
import { useGlobalStore } from '@/store'

const golbalStore = useGlobalStore()

const route = useRoute()
</script>

<template>
  <AdminNavigation />
  <v-main>
    <v-app-bar
      :elevation="0"
      color="white"
      density="compact"
    >
      <v-app-bar-nav-icon variant="text" @click.stop="golbalStore.setNavi(!golbalStore.isNavigation)"></v-app-bar-nav-icon>
      <v-app-bar-title>{{ route.meta?.title }}</v-app-bar-title>
    </v-app-bar>
    <router-view v-slot="{ Component, route }">
      <v-layout class="pa-4">
        <component :is="Component" :key="route.name" />
      </v-layout>
    </router-view>
  </v-main>
</template>

<style scoped lang='scss'>
main {
  padding-top: 50px!important;
}
</style>
