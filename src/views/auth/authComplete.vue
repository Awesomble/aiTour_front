<script setup lang="ts">
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'
const router = useRouter()

onMounted(async () => {
  const redirectPath = localStorage.getItem('redirectPath') || '/mainHome'
  localStorage.removeItem('redirectPath')
  await router.push(redirectPath)
})

</script>
