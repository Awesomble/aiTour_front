<script setup lang="ts">
import Header from '@/components/common/Header.vue'
import Bottom from '@/components/common/Bottom.vue'
import Navigation from '@/components/common/Navigation.vue'
</script>

<template>
  <Header />
  <Navigation />
  <v-main>
    <router-view v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>
<!--    <router-view v-slot="{ Component, route }">-->
<!--      <component v-if="!route.meta.keepAlive" :is="Component" />-->
<!--    </router-view>-->
  </v-main>
  <Bottom />
</template>

<style scoped lang='scss'>
main {
  padding-top: 48px;
  background-color: #f8f8f8;
}
</style>
