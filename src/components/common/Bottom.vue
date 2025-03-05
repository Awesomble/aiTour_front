<script setup lang="ts">
import { useGlobalStore } from '@/store'
import { useRoute } from 'vue-router'

const golbalStore = useGlobalStore()
const route = useRoute()
</script>

<template>
  <v-row dense class="custom-bottom-navigation ma-0 px-4">
    <!-- 좌측 아이콘 -->
    <v-col cols="12" class="d-flex justify-space-around">
      <v-btn
        :color="route.name === 'home' ? 'primary' : 'gray'"
        :to="{ name: 'home' }"
        icon="mdi-home"
        variant="text"
      />
      <v-btn
        :color="route.name === 'map' ? 'primary' : 'gray'"
        icon="mdi-map"
        :to="{ name: 'map' }"
        variant="text"
      />
      <v-btn
        :color="route.name === 'tour-planner' ? 'primary' : 'gray'"
        :to="{ name: 'tour-planner' }"
        icon="mdi-airplane"
        variant="text"
      />
      <v-btn
        :color="route.name === 'my-bag' ? 'primary' : 'gray'"
        :to="{ name: 'my-bag' }"
        icon="mdi-bag-personal"
        variant="text"
      />
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
  border-radius: 20px 20px 0 0; /* 상단 모서리 둥글게 */
  //box-shadow: 0px -4px 15px rgba(0, 0, 0, 0.1); /* 그림자 */
  overflow: visible; /* 플로팅 버튼이 바깥으로 나올 수 있게 */
  z-index: 9;
}
</style>
