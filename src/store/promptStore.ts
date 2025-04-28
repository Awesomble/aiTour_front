import { ref, type Ref } from 'vue'
import { defineStore } from 'pinia'

type Prompt = {
  adults: number,
  children: number,
  infants: number,
  amount: number,
  startDate: string,
  endDate: string,
  prompt: string
}

const usePromptStore = defineStore('prompt', () => {
  const promptInfo: Ref<Prompt | null> = ref(null)

  function setPrompt(adults: number, children: number, infants: number, amount: number, startDate: string, endDate: string, prompt: string) {
    promptInfo.value = {
      adults,
      children,
      infants,
      amount,
      startDate,
      endDate,
      prompt
    }
  }

  function setPromptNull() {
    promptInfo.value = null
  }

  return {
    promptInfo,
    setPrompt,
    setPromptNull
  }
})
export default usePromptStore