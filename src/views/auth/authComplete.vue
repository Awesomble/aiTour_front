<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()

const redirectPath = localStorage.getItem('redirectPath')
if (redirectPath) {
  router.push(redirectPath)
  localStorage.removeItem('redirectPath')
} else router.push({name: 'main-home'})
</script>
