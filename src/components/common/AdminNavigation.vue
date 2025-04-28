<script setup lang="ts">
import { ref } from 'vue'
import { useGlobalStore } from '@/store'

const golbalStore = useGlobalStore()

const getJson = async () => {
  // 기본 URL 설정
  const excludeCategories: number[] = [77, 82]
  let url = 'http://localhost:8000/places/detailed/file'

  // 카테고리 필터링이 있으면 쿼리 파라미터 추가
  if (excludeCategories.length > 0) {
    url += '?' + excludeCategories.map((id) => `category=${id}`).join('&')
  }

  // 링크 생성 및 다운로드 트리거
  const link = document.createElement('a')
  link.href = url
  link.download = 'places.json'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<template>
  <v-navigation-drawer v-model="golbalStore.isNavigation" color="#444" temporary>
    <v-list-item link title="AIT Managing System" value="admin" />
    <v-divider />
    <v-list density="compact" nav>
      <v-list-item title="Dashboard" value="dashboard" :to="{ name: 'admin-dashboard' }" exact />
      <v-list-item title="Place" value="place" :to="{ name: 'admin-place' }" exact />
      <v-list-item title="Categories" value="categories" :to="{ name: 'admin-categories' }" exact />
      <v-list-item title="Hashtags" value="hashtags" :to="{ name: 'admin-hashtags' }" exact />
      <v-list-item title="Download" value="Download" exact @click="getJson" />
    </v-list>
    <v-spacer></v-spacer>
  </v-navigation-drawer>
</template>
