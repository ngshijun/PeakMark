<template>
  <TeacherVideosPage v-if="isTeacher" />
  <StudentVideosPage v-else />
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// Define components once, not in computed
const TeacherVideosPage = defineAsyncComponent(() => import('@/views/TeacherVideosPage.vue'))
const StudentVideosPage = defineAsyncComponent(() => import('@/views/StudentVideosPage.vue'))

// Only compute the role, not the component
const isTeacher = computed(() => authStore.user?.user_metadata?.role === 'teacher')
</script>
