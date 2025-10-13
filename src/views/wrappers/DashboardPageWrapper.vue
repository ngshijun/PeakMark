<template>
  <TeacherDashboardPage v-if="isTeacher" />
  <StudentDashboardPage v-else />
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// Define components once, not in computed
const TeacherDashboardPage = defineAsyncComponent(() => import('@/views/TeacherDashboardPage.vue'))
const StudentDashboardPage = defineAsyncComponent(() => import('@/views/StudentDashboardPage.vue'))

// Only compute the role, not the component
const isTeacher = computed(() => authStore.user?.user_metadata?.role === 'teacher')
</script>
