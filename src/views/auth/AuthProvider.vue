<script setup>
import { UserManager } from 'oidc-client'
import { provide, reactive } from 'vue'

const config = {
  authority: 'https://cognition-idp.ap-northeast-2.amazonaws.com/ap-northeast-2_GoxCYCYrq',
  client_id: '6pufes9kh6a6cvmsfm1ccb9fmv',
  redirect_URI: 'http://localhost:3333/auth',
  response_type: 'code',
  scope: 'email openid phone'
}

const userManager = new UserManager(config)
const authState = reactive({ user: null, loading: true })

userManager.getUser().then((user) => {
  authState.user = user
  authState.loading = false
})

provide('auth', authState)
</script>

<template>
  <slot />
</template>
