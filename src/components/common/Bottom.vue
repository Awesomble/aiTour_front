<script setup lang="ts">
import { useGlobalStore } from '@/store'
import { useRoute } from 'vue-router'
import { Home, MapPin, Sparkles, Briefcase, Radar } from 'lucide-vue-next'

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
        <Home :size="24" :stroke-width="route.name === 'main-home' ? 1.2 : 1" />
      </v-btn>

      <v-btn
        :color="route.name === 'tour-planner' ? 'primary' : 'gray'"
        :to="{ name: 'tour-planner' }"
        variant="text"
      >
        <Sparkles :size="24" :stroke-width="route.name === 'tour-planner' ? 1.2 : 1" />
      </v-btn>

      <v-btn
        :color="route.name === 'main-map' ? 'primary' : 'gray'"
        :to="{ name: 'main-map' }"
        variant="text"
      >
        <MapPin :size="24" :stroke-width="route.name === 'main-map' ? 1.2 : 1" />
      </v-btn>

      <v-btn
        :color="route.name === 'hotspots-radar' ? 'primary' : 'gray'"
        :to="{ name: 'hotspots-radar' }"
        variant="text"
      >
        <Radar :size="24" :stroke-width="route.name === 'hotspots-radar' ? 1.2 : 1" />
      </v-btn>

      <v-btn
        :color="route.name === 'my-bag' ? 'primary' : 'gray'"
        :to="{ name: 'my-bag' }"
        variant="text"
      >
        <Briefcase :size="24" :stroke-width="route.name === 'my-bag' ? 1.2 : 1" />
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
  background-color: rgba(255, 255, 255, 0.8); // Transparent white
  backdrop-filter: blur(2px); // Blur effect
  -webkit-backdrop-filter: blur(2px); // For Safari
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
  border-radius: 20px 20px 0 0;
  z-index: 9;
  border-top: 1px solid rgba(255, 255, 255, 0.8); // Light border for glass effect
  box-shadow: 0 -5px 15px rgba(0, 0, 0, 0.1); // Subtle shadow
}

.glass-btn {
  height: 48px;
  width: 48px;
  border-radius: 50%;
  min-width: unset;
  padding: 0;
  background-color: rgba(255, 255, 255, 0.4); // Slightly transparent buttons
  backdrop-filter: blur(5px); // Button-specific blur
  -webkit-backdrop-filter: blur(5px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08); // Subtle shadow for buttons

  &:hover {
    background-color: rgba(255, 255, 255, 0.7); // More opaque on hover
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12); // Enhanced shadow on hover
  }

  &:active {
    transform: scale(0.95); // Slight scale effect when pressed
  }
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