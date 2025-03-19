<script setup lang="ts">
import { onBeforeMount, ref, computed } from 'vue'
import { useRouter } from 'vue-router'

defineOptions({
  name: 'main-home'
})

const router = useRouter()
</script>

<template>
  <v-container class="pa-2">
    개발중
  </v-container>
</template>

<style lang="scss">
</style>
