<script setup lang="ts">
import { ref } from 'vue'
import { useGlobalStore } from '@/store'

const golbalStore = useGlobalStore()
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
  >
    <!-- 왼쪽 콘텐츠 추가 -->
    <div class="d-flex align-center">
      <div>
        <span class="text-h7 font-weight-bold">Hello Sarah!</span>
        <v-icon color="yellow" size="small" class="ml-2">mdi-hand-wave</v-icon>
        <div class="text-subtitle-2">Let's go on an adventure!</div>
      </div>
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
            color="primary"
          >
            <span class="text-h5">{{ user.initials }}</span>
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
            <p class="text-caption mt-1">
              {{ user.email }}
            </p>
            <v-divider class="my-3"></v-divider>
            <v-btn
              variant="text"
              rounded
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
</style>