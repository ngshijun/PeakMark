<template>
  <component :is="classroomsComponent" />
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const classroomsComponent = computed(() => {
  const role = authStore.user?.user_metadata?.role
  if (role === 'teacher')
    return defineAsyncComponent(() => import('@/views/TeacherClassroomsPage.vue'))
  return defineAsyncComponent(() => import('@/views/StudentClassroomsPage.vue'))
})
</script>
