<script setup lang="ts">
import { useGlobalStore } from '@/store'
import { useRoute } from 'vue-router'

const golbalStore = useGlobalStore()
const route = useRoute()
</script>

<template>
  <v-row dense class="custom-bottom-navigation ma-0 px-8">
    <!-- 좌측 아이콘 -->
    <v-col cols="4" class="d-flex justify-space-between">
      <v-btn
        :color="route.name === 'home' ? 'primary' : 'gray'"
        :to="{ name: 'home' }"
        icon="mdi-home"
        variant="text"
      />
    </v-col>
    <v-col cols="2">
      <!-- 중앙 플로팅 버튼 -->
      <div class="floating-btn">
        <v-btn
          :color="route.name === 'map' ? 'primary' : 'gray'"
          class="floating-btn-inner"
          icon="mdi-map"
          :to="{ name: 'map' }"
        />
      </div>
    </v-col>
    <!-- 우측 아이콘 -->
    <v-col cols="4" class="d-flex justify-space-between">
      <v-btn
        :color="route.name === 'tour-planner' ? 'primary' : 'gray'"
        :to="{ name: 'tour-planner' }"
        icon="mdi-airplane"
        variant="text"
      />
      <v-btn
        :color="route.name === 'my-home' ? 'primary' : 'gray'"
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
}

/* 플로팅 버튼 컨테이너 */
.floating-btn {
  position: absolute;
  top: -35px; /* 버튼이 바깥으로 돌출 */
  left: 50%;
  transform: translateX(-50%);
  width: 70px;
  height: 70px;
  background-color: #f8f8f8;
  border-radius: 50%;
  //box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1); /* 그림자 효과 */
  z-index: 1; /* 버튼이 탐색 바 위로 나오도록 */
}

/* 플로팅 버튼 내부 스타일 */
.floating-btn-inner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: #4caf50; /* 플로팅 버튼 배경색 */
  color: white;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0px 6px 12px rgba(0, 0, 0, 0.2); /* 플로팅 버튼 그림자 */
  transition:
    transform 0.2s ease,
    background-color 0.2s ease;
}
</style>
