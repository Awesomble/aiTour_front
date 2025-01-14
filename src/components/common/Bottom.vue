<script setup lang="ts">
import { useGlobalStore } from '@/store'
import { useRoute } from 'vue-router'

const golbalStore = useGlobalStore()
const route = useRoute()
</script>

<template>
  <v-bottom-navigation :elevation="1"
                       bg-color="white"
                       grow
  >
    <v-btn color="white"
           variant="text"
           :to="{name: 'home'}"
    >
      <v-icon size="x-large"
              :color="route.name === 'home' ? 'primary' : 'gray'">
        mdi-map
      </v-icon>
    </v-btn>

    <v-btn color="white"
           variant="text"
           :to="{name: 'tour-planner'}"
    >
      <v-icon size="x-large"
              :color="route.name === 'tour-planner' ? 'primary' : 'gray'">
        mdi-airplane
      </v-icon>
    </v-btn>

    <v-btn color="white"
           variant="text"
           :to="{name: 'my-home'}"
    >
      <v-icon size="x-large"
              :color="route.name === 'my-home' ? 'primary' : 'gray'">
      mdi-bag-personal-outline
      </v-icon>
    </v-btn>
  </v-bottom-navigation>
</template>

<style scoped lang='scss'>

</style>