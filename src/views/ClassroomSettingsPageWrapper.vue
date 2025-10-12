<template>
  <component :is="classroomSettingsComponent" />
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const classroomSettingsComponent = computed(() => {
  const role = authStore.user?.user_metadata?.role || 'student'
  if (role === 'admin') return defineAsyncComponent(() => import('@/views/AdminDashboardPage.vue'))
  if (role === 'teacher')
    return defineAsyncComponent(() => import('@/views/TeacherClassroomSettingsPage.vue'))
  return defineAsyncComponent(() => import('@/views/StudentClassroomSettingsPage.vue'))
})
</script>
