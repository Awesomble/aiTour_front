<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { userManager, signOutRedirect } from '@/plugins/auth' // auth.ts 경로에 맞게 조정

// 기존 코드...
// 예를 들어, 기존 변수들과 함수들은 그대로 유지

const user = ref<any>(null)
const route = useRoute()

onMounted(async () => {
  // 만약 현재 URL이 callback 경로라면, 로그인 후 받은 code를 사용해 사용자 객체를 획득합니다.
})
</script>

<template>
  <v-container fluid>
    <!-- 기존 PlaceDetail 관련 템플릿 -->

    <!-- 인증 관련 버튼 추가 -->
    <div class="auth-buttons" style="margin-bottom: 20px">
      <v-btn color="primary" @click="userManager.signinRedirect()"> Sign In </v-btn>
      <v-btn color="error" @click="signOutRedirect()"> Sign Out </v-btn>
    </div>

    <!-- 콜백 후 사용자 정보 표시 (원하는 경우) -->
    <div v-if="user">
      <p>Email: {{ user.profile?.email }}</p>
      <p>Access Token: {{ user.access_token }}</p>
      <p>ID Token: {{ user.id_token }}</p>
      <p>Refresh Token: {{ user.refresh_token }}</p>
    </div>

    <!-- 기존 템플릿 내용 계속 -->
  </v-container>
</template>

<style scoped lang="scss"></style>
