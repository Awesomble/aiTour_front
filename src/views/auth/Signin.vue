<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { signInWithRedirect } from 'aws-amplify/auth'

const route = useRoute()
const router = useRouter()

const signInWithRedirectCall = async () => {
  try {
    localStorage.setItem('redirectPath', String(route.query?.redirect))
    await signInWithRedirect().catch(() => null)
  } catch (err) {
    console.error(err)
  }
}

// 로그인 후 돌아올 때 쿼리의 redirect 값이 있으면 해당 페이지로 이동
onMounted(() => {
  const redirect = (route.query.redirect as string) || '/'
  router.push(redirect)
})
</script>

<template>
  <v-container fluid>
    <!-- 인증 관련 버튼 추가 -->
    <div class="auth-buttons">
      <v-btn color="primary" @click="signInWithRedirectCall">Sign In</v-btn>
    </div>
  </v-container>
</template>