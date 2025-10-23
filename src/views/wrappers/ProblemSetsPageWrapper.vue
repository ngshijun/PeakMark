<template>
  <component :is="currentComponent" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import TeacherQuestionSetsPage from '@/views/TeacherQuestionSetsPage.vue'
import StudentQuestionSetsPage from '@/views/StudentQuestionSetsPage.vue'

const authStore = useAuthStore()

const currentComponent = computed(() => {
  const role = authStore.user?.user_metadata?.role
  return role === 'teacher' ? TeacherQuestionSetsPage : StudentQuestionSetsPage
})
</script>
