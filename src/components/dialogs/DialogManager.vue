<script setup lang="ts">
import { useDialogStore } from '@/store/dialogStore'
const dialogStore = useDialogStore()

const ok = () => {
  dialogStore.confirmResult(true)
}

const cancel = () => {
  dialogStore.confirmResult(false)
}
</script>
<template>
  <v-dialog v-model="dialogStore.isOpen" persistent max-width="400">
    <v-card>
      <v-card-title class="headline">
        {{ dialogStore.type === 'confirm' ? 'Confirm' : 'Alert' }}
      </v-card-title>
      <v-card-text>{{ dialogStore.message }}</v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn v-if="dialogStore.type === 'confirm'" variant="text" @click="cancel">Cancel</v-btn>
        <v-btn variant="text" @click="ok">OK</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>