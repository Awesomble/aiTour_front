import { ref, type Ref } from 'vue'
import { defineStore } from 'pinia'

const useGlobalStore = defineStore('global', () => {
  const isNavigation: Ref<boolean> = ref(false)

  function setNavi(display: boolean): void {
    isNavigation.value = display
  }
  return { setNavi, isNavigation }
})

export default useGlobalStore