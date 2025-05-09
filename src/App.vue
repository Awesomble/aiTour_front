<script setup lang="ts">
import { onBeforeMount } from 'vue'
import DialogManager from '@/components/dialogs/DialogManager.vue'
import { isGPSAvailable } from '@/composables/useGPS'
import { useUserStore } from '@/store'
import { useGPS } from '@/views/map/composables/useGPS'

const { initGPS, cleanupGPS } = useGPS()

onBeforeMount(async () =>{
  const userStore = useUserStore()
  await userStore.getUserInfo()
  isGPSAvailable()
  initGPS()
})

</script>

<template>
  <v-app class="overflow-hidden">
    <router-view />
    <DialogManager />
  </v-app>
</template>
