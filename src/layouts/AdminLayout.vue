<script setup lang="ts">
import AdminNavigation from '@/components/common/AdminNavigation.vue'
import { useRoute } from 'vue-router'

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
