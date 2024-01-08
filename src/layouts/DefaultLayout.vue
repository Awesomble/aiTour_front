<script setup lang="ts">
import Header from '@/components/common/Header.vue'
import Navigation from '@/components/common/Navigation.vue'
</script>

<template>
  <Header />
  <Navigation />
  <v-main>
    <router-view v-slot="{ Component, route }">
      <component :is="Component" :key="route.name" />
    </router-view>
  </v-main>
</template>

<style scoped lang='scss'>
main {
  padding-top: 48px;
}
</style>
