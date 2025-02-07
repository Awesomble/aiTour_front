<script setup lang="ts">
import { ref } from 'vue'
import {
  addCategoriesAPI,
  delCategoriesAPI,
  getCategoriesAPI,
} from '@/network/admin'
import { onBeforeMount } from 'vue'

const formRef = ref<HTMLFormElement | null>(null)
const categories = ref<any[]>([]) // Adjust type if necessary
const iptCategory = ref<string>('')
const iptDescription = ref<string>('Essential Facilities-')
const iptSearch = ref<string>('')
const isShowDialog = ref<boolean>(false)
const headers = ref<object[]>([
  {
    key: 'category_id',
    sortable: false,
    title: 'ID'
  },
  { key: 'name', align: 'start', title: 'Name' },
  { key: 'description', align: 'start', title: 'Description' },
  { key: 'action', align: 'end', title: 'Action' }
])

const rules = ref({
  required: (value: string) => !!value || 'Required.',
  duplication: (value: string) => {
    if (!value) return 'Required.'
    if (!categories.value?.length) {
      return true
    }
    return categories.value.some((category: any) => category.name === value)
      ? 'Duplication: This value already exists.'
      : true
  }
})

const addCategory = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  const res = await addCategoriesAPI({ name: iptCategory.value, description: iptDescription.value })
  if (res?.data) {
    iptCategory.value = ''
    iptDescription.value = 'Essential Facilities-'
    isShowDialog.value = false
    getCategories()
  }
}

const getCategories = async () => {
  const res = (await getCategoriesAPI()) as any
  if (res?.data) {
    categories.value = res.data
  } else {
    categories.value = []
  }
}

const delCategories = async (id: any) => {
  const res = await delCategoriesAPI(id)
  if (res.status === 200) {
    getCategories()
  }
}

onBeforeMount(() => {
  getCategories()
})
</script>

<template>
  <v-container fluid class="pa-0">
    <v-row no-gutters>
      <v-col>
        <v-card title="Catetory List">
          <template #append>
            <v-btn density="compact" icon @click="isShowDialog = true">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </template>
          <v-card-text v-if="categories?.length">
            <template v-slot:text>
              <v-text-field
                v-model="iptSearch"
                density="compact"
                label="Search"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                hide-details
                clearable
              ></v-text-field>
              <v-spacer />
            </template>
            <v-data-table-virtual
              dense
              outlined
              :headers="headers"
              :items="categories"
              :search="iptSearch"
            >
              <template v-slot:item.action="{ item }">
                <v-btn density="compact" color="red" @click="delHashtag(item.hashtag_id)">삭제</v-btn>
              </template>
            </v-data-table-virtual>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-dialog v-model="isShowDialog" width="auto">
      <v-card prepend-icon="mdi-account" title="Add Category" width="350">
        <v-form ref="formRef">
          <v-card-text>
            <v-row dense>
              <v-col cols="12">
                <v-text-field
                  v-model="iptCategory"
                  density="compact"
                  variant="outlined"
                  label="Name"
                  :rules="[rules.required, rules.duplication]"
                  required
                  clearable
                  focused
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="iptDescription"
                  density="compact"
                  variant="outlined"
                  label="Description"
                  :rules="[rules.required, rules.duplication]"
                  required
                  clearable
                  focused
                />
              </v-col>
            </v-row>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" text="Save" variant="tonal" @click="addCategory"></v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>
  </v-container>
</template>
