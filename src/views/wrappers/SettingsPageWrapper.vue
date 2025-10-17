<template>
  <component :is="currentComponent" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import StudentSettingsPage from '@/views/StudentSettingsPage.vue'
import TeacherSettingsPage from '@/views/TeacherSettingsPage.vue'

const authStore = useAuthStore()

const currentComponent = computed(() => {
  const role = authStore.user?.user_metadata?.role

  switch (role) {
    case 'teacher':
      return TeacherSettingsPage
    case 'student':
      return StudentSettingsPage
    default:
      return StudentSettingsPage
  }
})
</script>
