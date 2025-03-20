<script setup lang="ts">
import { onBeforeMount, onMounted, ref } from 'vue'
import DialogManager from '@/components/dialogs/DialogManager.vue'
import { useUserStore } from '@/store'

onBeforeMount(async () =>{
  // const userStore = useUserStore()
  // await userStore.getUserInfo()
})
</script>

<template>
  <v-app class="overflow-hidden">
    <router-view />
    <DialogManager />
  </v-app>
</template>
