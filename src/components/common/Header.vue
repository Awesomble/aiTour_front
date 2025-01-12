<script setup lang="ts">
import { useGlobalStore } from '@/store'

const golbalStore = useGlobalStore()
</script>

<template>
  <v-app-bar color="white"
             :elevation="1"
             density="compact"
  >
    <template v-slot:prepend>
      <v-app-bar-nav-icon @click="golbalStore.setNavi(!golbalStore.isNavigation)"></v-app-bar-nav-icon>
    </template>

    <v-app-bar-title>AITour</v-app-bar-title>

    <v-spacer></v-spacer>

    <v-btn icon>
      <v-icon>mdi-magnify</v-icon>
    </v-btn>

    <v-btn icon>
      <v-icon>mdi-heart</v-icon>
    </v-btn>

    <v-btn icon>
      <v-icon>mdi-dots-vertical</v-icon>
    </v-btn>
  </v-app-bar>
</template>

<style scoped lang='scss'>

</style>