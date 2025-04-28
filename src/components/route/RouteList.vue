<script setup lang="ts">
import { computed } from 'vue'
import type { Route } from '@/types'
import RouteNode from './RouteNode.vue'

const props = defineProps<{
  places: any[]
}>()

</script>

<template>
  <div class="place-list">
    <div v-for="(route, idx) in places" :key="idx" class="route-item">
      <transition name="slide-fade" mode="out-in">
        <RouteNode :node="route" :first="idx === 0" :last="idx === places.length - 1" />
      </transition>
    </div>
  </div>
</template>

<style scoped>
.place-list {
  height: calc(100vh - 120px);
  padding-bottom: 50px;
  overflow: hidden;
  overflow-y: auto;
}
</style>
