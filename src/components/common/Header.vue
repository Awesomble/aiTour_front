<script setup lang="ts">
import { ref } from 'vue'
import { useGlobalStore } from '@/store'
import { useRouter } from 'vue-router'

const golbalStore = useGlobalStore()
const router = useRouter()
const user = ref<object>(
  {
    initials: 'JD',
    fullName: 'John Doe',
    email: 'john.doe@doe.com',
  }
)
</script>

<template>
  <v-app-bar color="white"
             :elevation="0"
             density="compact"
             style="border-bottom: 1px solid #eee;"
             class="pl-4"
  >
    <!-- 왼쪽 콘텐츠 추가 -->
    <div class="d-flex align-center font-weight-black">
      <h1 color="primary" class="text-button" style="font-size: 18px!important;">TRIPIECE</h1>
    </div>
    <v-spacer />
    <v-menu
      min-width="200px"
      rounded
    >
      <template v-slot:activator="{ props }">
        <v-btn
          icon
          v-bind="props"
        >
          <v-avatar
            size="small"
            color="primary"
          >
            <span class="text-h6">{{ user.initials }}</span>
          </v-avatar>
        </v-btn>
      </template>
      <v-card color="white">
        <v-card-text>
          <div class="mx-auto text-center">
            <v-avatar
              color="brown"
            >
              <span class="text-h5">{{ user.initials }}</span>
            </v-avatar>
            <h3>{{ user.fullName }}</h3>
            <p class="text-caption mt-1" @click="router.push({name: 'auth'})">
              {{ user.email }}
            </p>
            <v-divider class="my-3"></v-divider>
            <v-btn
              variant="text"
              rounded
              :to="{name: 'admin-dashboard'}"
            >
              Edit Account
            </v-btn>
            <v-divider class="my-3"></v-divider>
            <v-btn
              variant="text"
              rounded
            >
              Disconnect
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-menu>
<!--    {{ golbalStore.lat }}-->
<!--    {{ golbalStore.long }}-->
<!--    <template v-slot:prepend>-->
<!--      <v-app-bar-nav-icon @click="golbalStore.setNavi(!golbalStore.isNavigation)"></v-app-bar-nav-icon>-->
<!--    </template>-->

<!--    <v-app-bar-title>AITour</v-app-bar-title>-->

<!--    <v-spacer></v-spacer>-->

<!--    <v-btn icon>-->
<!--      <v-icon>mdi-magnify</v-icon>-->
<!--    </v-btn>-->

<!--    <v-btn icon>-->
<!--      <v-icon>mdi-heart</v-icon>-->
<!--    </v-btn>-->

<!--    <v-btn icon>-->
<!--      <v-icon>mdi-dots-vertical</v-icon>-->
<!--    </v-btn>-->
  </v-app-bar>
</template>

<style scoped lang='scss'>
.text-gray-500 {
  color: #9e9e9e; /* 회색 텍스트 색상 */
}
.blur {
  backdrop-filter: blur(25px) !important;
  background: #f5f6f79f !important;
  border-bottom: none;
}
</style>