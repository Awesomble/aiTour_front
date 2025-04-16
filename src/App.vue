<script setup lang="ts">
import { onBeforeMount } from 'vue'
import DialogManager from '@/components/dialogs/DialogManager.vue'
import { isGPSAvailable } from '@/composables/useGPS'
import { useUserStore } from '@/store'

onBeforeMount(async () =>{
  const userStore = useUserStore()
  await userStore.getUserInfo()
  isGPSAvailable()
})

</script>

<template>
  <v-app class="overflow-hidden">
    <router-view />
    <DialogManager />
  </v-app>
</template>
