

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { putCategoriesAPI, getCategoriesDetailAPI } from '@/network/admin'
import { useToast } from 'vue-toastification'
import router from '@/router'

const route = useRoute()
const toast = useToast()
const formRef = ref<HTMLFormElement | null>(null)

const categoryName = ref('')
const categoryDescription = ref('')
const categoryIcon = ref('')
const categoryIconColor = ref('#')
const categoryDefaultUsageTime = ref<number | null>(null)

const rules = {
  required: (value: string) => !!value || 'Required.',
}

const getCategoryDetail = async () => {
  const res = await getCategoriesDetailAPI(String(route.params.id))
  if (res?.status === 200) {
    const data = res.data
    categoryName.value = data.name
    categoryDescription.value = data.description
    categoryIcon.value = data.icon
    categoryIconColor.value = data.icon_color || '#'
    categoryDefaultUsageTime.value = data.default_usage_time
  }
}

const updateCategory = async () => {
  const payload = {
    name: categoryName.value,
    description: categoryDescription.value,
    icon: categoryIcon.value,
    icon_color: categoryIconColor.value,
    default_usage_time: categoryDefaultUsageTime.value,
  }
  const res = await putCategoriesAPI(String(route.params.id), payload)
  if (res?.status === 200) {
    toast.success("Category updated successfully")
    await getCategoryDetail()
    router.go(-1)
  } else {
    toast.error("Error updating category")
  }
}

onMounted(() => {
  getCategoryDetail()
})
</script>
<template>
  <v-container fluid class="pa-0">
    <v-row no-gutters class="pb-8">
      <v-col cols="12" xs="12" sm="12" md="12" xl="12" xxl="12">
        <v-card title="Place Update" color="white">
          <v-form ref="formRef">
            <v-card-text>
              <v-row no-gutters class="ga-2">
                <p>Default info</p>
                <v-col cols="12">
                  <v-text-field
                    v-model="categoryName"
                    label="Name"
                    density="compact"
                    variant="outlined"
                    hide-details
                    clearable
                    :rules="[rules.required]"
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="categoryDescription"
                    label="Description"
                    density="compact"
                    variant="outlined"
                    hide-details
                    clearable
                    :rules="[rules.required]"
                  />
                </v-col>
                <v-col cols="12">
                  <v-textarea
                    v-model="categoryIcon"
                    label="Icon"
                    density="compact"
                    variant="outlined"
                    hide-details
                    clearable
                    row="3"
                    :rules="[rules.required]"
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="categoryIconColor"
                    label="Icon Color"
                    density="compact"
                    variant="outlined"
                    hide-details
                    clearable
                    :rules="[rules.required]"
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="categoryDefaultUsageTime"
                    label="Default Usage Time"
                    type="number"
                    density="compact"
                    variant="outlined"
                    hide-details
                    clearable
                    :rules="[rules.required]"
                  />
                </v-col>
              </v-row>
              <v-divider class="py-2" />
              <v-btn block color="primary" @click="updateCategory"><strong>Update</strong></v-btn>
            </v-card-text>
            </v-form>
          </v-card>
        </v-col>
    </v-row>
  </v-container>
</template>