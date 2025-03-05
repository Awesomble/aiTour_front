<script setup lang="ts">
import Header from '@/components/common/Header.vue'
import Bottom from '@/components/common/Bottom.vue'
import Navigation from '@/components/common/Navigation.vue'
import PlaceDetail from '@/components/dialogs/PlaceDetail.vue'
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()


onMounted(() => {
  if (route.query.place) {
    router.go(-1)
  }
})
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
  </v-main>
  <PlaceDetail />
  <Bottom />
</template>

<style scoped lang='scss'>
main {
  padding-top: 48px;
  background-color: #f8f8f8;
}
.slide-fade-enter-active, .slide-fade-leave-active {
  transition: transform 0.5s ease, opacity 0.5s ease;
}

.slide-fade-enter, .slide-fade-leave-to /* .slide-fade-leave-active in <2.1.8 */ {
  opacity: 0;
  transform: translateX(100%); /* 오른쪽으로 이동 */
}

.slide-fade-enter-to, .slide-fade-leave {
  opacity: 1;
  transform: translateX(0); /* 원래 위치로 */
}
</style>