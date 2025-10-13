<template>
  <TeacherPuzzlesPage v-if="isTeacher" />
  <StudentPuzzlesPage v-else />
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// Define components once, not in computed
const TeacherPuzzlesPage = defineAsyncComponent(() => import('@/views/TeacherPuzzlesPage.vue'))
const StudentPuzzlesPage = defineAsyncComponent(() => import('@/views/StudentPuzzlesPage.vue'))

// Only compute the role, not the component
const isTeacher = computed(() => authStore.user?.user_metadata?.role === 'teacher')
</script>
