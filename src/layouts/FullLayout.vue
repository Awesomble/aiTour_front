<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()


onMounted(() => {
})
</script>

<template>
  <v-main>
    <router-view v-slot="{ Component }">
        <component :is="Component" />
    </router-view>
  </v-main>
</template>

<style scoped lang='scss'>
</style>