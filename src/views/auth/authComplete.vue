<script setup lang="ts">
import { useRouter } from 'vue-router'
import { nextTick, onMounted } from 'vue'
const router = useRouter()

onMounted(async () => {
  await nextTick()
  const redirectPath = localStorage.getItem('redirectPath')
  if (redirectPath) {
    router.push(redirectPath)
    console.log(redirectPath)
    localStorage.removeItem('redirectPath')
  } else router.push({name: 'main-home'})
})
</script>
