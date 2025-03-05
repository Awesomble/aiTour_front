<script setup lang="ts">
import { ref } from 'vue'
import { useGlobalStore } from '@/store'

const golbalStore = useGlobalStore()

const getJson = async () => {
  const link = document.createElement('a')
  link.href = 'http://localhost:8000/places/detailed/file'
  link.download = 'places.json'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<template>
  <v-navigation-drawer
    v-model="golbalStore.isNavigation"
    color="#444"
    temporary
  >
    <v-list-item
      link
      title="AIT Managing System"
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
        title="Categories"
        value="categories"
        :to="{name: 'admin-categories'}"
        exact
      />
      <v-list-item
        title="Hashtags"
        value="hashtags"
        :to="{name: 'admin-hashtags'}"
        exact
      />
      <v-list-item
        title="Download"
        value="Download"
        exact
        @click="getJson"
      />
    </v-list>
    <v-spacer></v-spacer>
  </v-navigation-drawer>
</template>