<template>
  <component :is="videosComponent" />
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const videosComponent = computed(() => {
  const role = authStore.user?.user_metadata?.role
  if (role === 'teacher') return defineAsyncComponent(() => import('@/views/TeacherVideosPage.vue'))
  return defineAsyncComponent(() => import('@/views/StudentVideosPage.vue'))
})
</script>
