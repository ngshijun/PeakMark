<template>
  <TeacherClassroomsPage v-if="isTeacher" />
  <StudentClassroomsPage v-else />
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// Define components once, not in computed
const TeacherClassroomsPage = defineAsyncComponent(() => import('@/views/TeacherClassroomsPage.vue'))
const StudentClassroomsPage = defineAsyncComponent(() => import('@/views/StudentClassroomsPage.vue'))

// Only compute the role, not the component
const isTeacher = computed(() => authStore.user?.user_metadata?.role === 'teacher')
</script>
