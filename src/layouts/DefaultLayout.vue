<script setup lang="ts">
import Header from '@/components/common/Header.vue'
import Bottom from '@/components/common/Bottom.vue'
import Navigation from '@/components/common/Navigation.vue'
import PlaceDetail from '@/components/dialogs/PlaceDetail.vue'
import Inventory from '@/components/dialogs/Inventory.vue'
import { onMounted, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// keep-alive 관련 설정 (필요 시 사용)
provide('keepAliveKey', true)

onMounted(() => {
  // 'place' 쿼리 파라미터가 있는 경우 이전 페이지로 돌아갑니다.
  // (예: 상세 페이지에서 뒤로 가기를 위해 사용)
  if (route.query.place) {
    router.go(-1)
  }
})
</script>

<template>
  <Header />
  <Navigation />
  <v-main class="pt-0">
    <router-view v-slot="{ Component }">
      <transition name="slide-fade" mode="out-in">
        <keep-alive :include="['main-home', 'main-map', 'tour-planner', 'my-bag']">
          <component :is="Component" :key="$route.name" />
        </keep-alive>
      </transition>
    </router-view>
  </v-main>
  <PlaceDetail />
  <Inventory />
  <Bottom />
</template>

<style scoped lang="scss">
.slide-fade-enter-active {
  transition: all 0.3s ease;
}
.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
</style>