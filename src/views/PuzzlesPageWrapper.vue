<template>
  <component :is="puzzlesComponent" />
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const puzzlesComponent = computed(() => {
  const role = authStore.user?.user_metadata?.role
  if (role === 'teacher')
    return defineAsyncComponent(() => import('@/views/TeacherPuzzlesPage.vue'))
  return defineAsyncComponent(() => import('@/views/StudentPuzzlesPage.vue'))
})
</script>
