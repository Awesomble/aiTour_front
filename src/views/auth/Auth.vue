<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import useAuthStore from '@/store/authStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const user = ref<any>(null)

onMounted(async () => {
  // try {
  //   user.value = await userManager.signinCallback()
  //   console.log(user.value)
  //   if (user.value) {
  //     authStore.setTokens({
  //       accessToken: user.value.access_token,
  //       idToken: user.value.id_token,
  //       refreshToken: user.value.refresh_token
  //     })
  //   }
  //   // await router.push('home')
  // } catch (err) {
  //   console.error('Callback 처리 오류:', err)
  // }
})
</script>

<template>
  <div v-if="user">
    <p>Name: {{ user.profile?.name }}</p>
    <p>Email: {{ user.profile?.email }}</p>
    <p>Access Token: {{ user.access_token }}</p>
    <p>ID Token: {{ user.id_token }}</p>
    <p>Refresh Token: {{ user.refresh_token }}</p>

    <img :src="user.profile?.picture" alt="Profile Image" />
  </div>
</template>

<style scoped lang="scss"></style>
