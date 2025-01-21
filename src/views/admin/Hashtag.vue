<script setup lang="ts">
import { ref } from 'vue'
import { addHashtagsAPI, delHashtagsAPI, getHashtagsAPI } from '@/network/admin'
import { onBeforeMount } from 'vue'

const formRef = ref<HTMLFormElement | null>(null)
const hashtags = ref<any[]>([]) // Adjust type if necessary
const iptHashtag = ref<string>('')
const iptSearch = ref<string>('')
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
  const { valid } = await formRef.value.validate()
  console.log(valid)
  if (!valid) return; // Prevent submission if form is invalid
  const res = await addHashtagsAPI({ name: iptHashtag.value })
  if (res?.data) {
    iptHashtag.value = ''
    getHashtags()
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
  <v-row>
    <v-col cols="12">
      <v-card title="Hashtag Add">
        <v-form ref="formRef">
          <v-card-text>
            <v-text-field
              v-model="iptHashtag"
              density="compact"
              :counter="10"
              :rules="[rules.required, rules.duplication]"
              label="Tag Name"
              clearable
            />
          </v-card-text>
          <v-card-actions class="justify-center">
            <v-btn variant="tonal"
                   color="white"
                   class="w-25"
                   @click.prevent="addHashtag"
            >ADD</v-btn>
          </v-card-actions>
      </v-form>
      </v-card>
    </v-col>
    <v-col v-if="hashtags?.length">
      <v-card title="Hashtag List">
        <v-card-text>
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
</template>
