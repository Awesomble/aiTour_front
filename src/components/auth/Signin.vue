<script setup lang="ts">
import { Auth } from 'aws-amplify'

const signInWithGoogle = async () => {
  try {
    const user = await Auth.federatedSignIn({ provider: 'google' })
    console.log('로그인 성공:', user)
    // 로그인 후 ID 토큰 가져오기
    const session = await Auth.currentSession()
    const idToken = session.getIdToken().getJwtToken()
    // ID 토큰을 백엔드로 전송 (예: API 호출)
  } catch (error) {
    console.error('로그인 실패:', error)
  }
}
</script>

<template>
  div
</template>

<style scoped lang="scss"></style>
