import { defineStore } from 'pinia'
import { ref, type Ref } from 'vue'

type DialogType = 'alert' | 'confirm'

export const useDialogStore = defineStore('dialog', () => {
  const isOpen: Ref<boolean> = ref(false)
  const message: Ref<string> = ref('')
  const type: Ref<DialogType> = ref('alert')
  let resolver: ((result: boolean) => void) | null = null

  function alert(msg: string): Promise<void> {
    message.value = msg
    type.value = 'alert'
    isOpen.value = true
    return new Promise<void>((resolve) => {
      resolver = () => resolve()
    })
  }

  function confirm(msg: string): Promise<boolean> {
    message.value = msg
    type.value = 'confirm'
    isOpen.value = true
    return new Promise<boolean>((resolve) => {
      resolver = resolve
    })
  }

  function close(): void {
    isOpen.value = false
    if (resolver) {
      // alert는 항상 true, confirm은 false 처리
      resolver(type.value === 'alert' ? true : false)
      resolver = null
    }
  }

  function confirmResult(result: boolean): void {
    isOpen.value = false
    if (resolver) {
      resolver(result)
      resolver = null
    }
  }

  return { isOpen, message, type, alert, confirm, close, confirmResult }
})
