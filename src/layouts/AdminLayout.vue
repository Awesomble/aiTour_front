<script setup lang="ts">
</script>

<template>
  <v-main>
    <router-view v-slot="{ Component, route }">
      <component :is="Component" :key="route.name" />
    </router-view>
  </v-main>햣
</template>

<style scoped lang='scss'>
main {
  padding-top: 48px;
}
</style>
