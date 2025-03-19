<script setup lang="ts">
import { useGlobalStore } from '@/store'
import { useRoute } from 'vue-router'
import { Home, MapPin, Sparkles, Briefcase } from 'lucide-vue-next'

const golbalStore = useGlobalStore()
const route = useRoute()
</script>

<template>
  <v-row dense class="custom-bottom-navigation ma-0 px-4">
    <v-col cols="12" class="d-flex justify-space-around">
      <v-btn
        :color="route.name === 'main-home' ? 'primary' : 'gray'"
        :to="{ name: 'main-home' }"
        variant="text"
      >
        <Home :size="24" :stroke-width="route.name === 'main-home' ? 2.5 : 1.8" />
      </v-btn>

      <v-btn
        :color="route.name === 'main-map' ? 'primary' : 'gray'"
        :to="{ name: 'main-map' }"
        variant="text"
      >
        <MapPin :size="24" :stroke-width="route.name === 'main-map' ? 2.5 : 1.8" />
      </v-btn>

      <v-btn
        :color="route.name === 'tour-planner' ? 'primary' : 'gray'"
        :to="{ name: 'tour-planner' }"
        variant="text"
      >
        <Sparkles :size="24" :stroke-width="route.name === 'tour-planner' ? 2.5 : 1.8" />
      </v-btn>

      <v-btn
        :color="route.name === 'my-bag' ? 'primary' : 'gray'"
        :to="{ name: 'my-bag' }"
        variant="text"
      >
        <Briefcase :size="24" :stroke-width="route.name === 'my-bag' ? 2.5 : 1.8" />
      </v-btn>
    </v-col>
  </v-row>
</template>

<style scoped lang="scss">
.custom-bottom-navigation {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 60px;
  background-color: #ffffff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
  border-radius: 20px 20px 0 0;
  z-index: 9;
}

.v-btn {
  height: 48px;
  width: 48px;
  border-radius: 50%;
  min-width: unset;
  padding: 0;

  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }
}
</style>