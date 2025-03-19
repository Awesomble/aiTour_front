<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
// import { userManager, signOutRedirect } from '@/plugins/auth' // auth.ts 경로에 맞게 조정
import { signInWithRedirect, getCurrentUser, signOut, fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth'
const route = useRoute()


const signInWithRedirectCall = async (redirectPath = '/') => {
  try {
    localStorage.setItem('redirectPath', String(route.query?.redirect))
    await signInWithRedirect().catch(() => null)
  } catch (err) {
    console.error(err)
  }
}
</script>

<template>
  <v-container fluid>
    <!-- 기존 PlaceDetail 관련 템플릿 -->

    <!-- 인증 관련 버튼 추가 -->
    <div class="auth-buttons">
      <v-btn color="primary" @click="signInWithRedirectCall"> Sign In </v-btn>
<!--      <v-btn color="error" @click="signOutRedirect()"> Sign Out </v-btn>-->
    </div>
    <!-- 기존 템플릿 내용 계속 -->
  </v-container>
</template>

<style scoped lang="scss"></style>
