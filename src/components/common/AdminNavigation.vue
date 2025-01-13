<script setup lang="ts">
import { ref } from 'vue'
import { useGlobalStore } from '@/store'

const golbalStore = useGlobalStore()
const drawer = ref(true)

</script>

<template>
  <v-navigation-drawer
    color="white"
    floating
    permanent
  >
    <v-list-item
      link
      title="ADMIN"
      value="admin"
    />
    <v-divider />
    <v-list density="compact" nav>
      <v-list-item
        title="Dashboard"
        value="dashboard"
        :to="{name: 'admin-dashboard'}"
        exact
      />
      <v-list-item
        title="Place"
        value="place"
        :to="{name: 'admin-place'}"
        exact
      />
      <v-list-item
        title="Hashtag"
        value="hashtag"
        :to="{name: 'admin-hashtag'}"
        exact
      />
      <a href="https://aitour-api.awesomble.com/places/download" target="_blank">
      <v-list-item
        title="Download"
        value="Download"
        exact
      />
      </a>
    </v-list>
    <v-spacer></v-spacer>
  </v-navigation-drawer>
</template>