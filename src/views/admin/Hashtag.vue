<script setup lang="ts">
import { ref } from 'vue'
import { addHashtagsAPI, delHashtagsAPI, getHashtagsAPI } from '@/network/admin'
import { onBeforeMount } from 'vue'

const formRef = ref<HTMLFormElement | null>(null)
const hashtags = ref<any[]>([]) // Adjust type if necessary
const iptHashtag = ref<string>('')
const iptSearch = ref<string>('')
const isShowDialog = ref<boolean>(false)
const headers = ref<object[]>([
  {
    key: 'hashtag_id',
    sortable: false,
    title: 'ID'
  },
  { key: 'name', align: 'start', title: 'Name' },
  { key: 'action', align: 'end', title: 'Action' }
])

const rules = ref({
  required: (value: string) => !!value || 'Required.',
  duplication: (value: string) => {
    if (!value) return 'Required.'
    if (!hashtags.value?.length) {
      return true // No hashtags to compare with
    }
    return hashtags.value.some((hashtag: any) => hashtag.name === value)
      ? 'Duplication: This value already exists.'
      : true
  }
})

const addHashtag = async () => {
  const { valid } = await formRef.value?.validate()
  console.log(valid)
  if (!valid) return; // Prevent submission if form is invalid
  const res = await addHashtagsAPI({ name: iptHashtag.value })
  if (res?.data) {
    iptHashtag.value = ''
    getHashtags()
    isShowDialog.value = false
  }
}

const getHashtags = async () => {
  const res = (await getHashtagsAPI()) as any // Replace with the correct type if known
  if (res?.data) {
    hashtags.value = res.data
  } else {
    hashtags.value = [] // Fallback to an empty array
  }
}

const delHashtag = async (id: any) => {
  const res = await delHashtagsAPI(id)
  if (res.status === 200) {
    getHashtags()
  }
}

onBeforeMount(() => {
  getHashtags()
})
</script>

<template>
  <v-container fluid class="pa-0">
    <v-row no-gutters>
      <v-col>
        <v-card title="Hashtag List">
          <template #append>
            <v-btn density="compact" icon @click="isShowDialog = true">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </template>
          <v-card-text v-if="hashtags?.length">
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
              :items="hashtags"
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

    <v-dialog
      v-model="isShowDialog"
      width="auto"
    >
      <v-card
        prepend-icon="mdi-account"
        title="Add Category"
      >
        <v-form ref="formRef">
          <v-card-text>
            <v-row dense>
              <v-col
                cols="12"
              >
                <v-text-field
                  v-model="iptHashtag"
                  density="compact"
                  variant="outlined"
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
            <v-btn
              color="primary"
              text="Save"
              variant="tonal"
              @click="addHashtag"
            ></v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>
  </v-container>
</template>
