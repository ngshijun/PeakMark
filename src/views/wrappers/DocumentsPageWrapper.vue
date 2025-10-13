<template>
  <TeacherDocumentsPage v-if="isTeacher" />
  <StudentDocumentsPage v-else />
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// Define components once, not in computed
const TeacherDocumentsPage = defineAsyncComponent(() => import('@/views/TeacherDocumentsPage.vue'))
const StudentDocumentsPage = defineAsyncComponent(() => import('@/views/StudentDocumentsPage.vue'))

// Only compute the role, not the component
const isTeacher = computed(() => authStore.user?.user_metadata?.role === 'teacher')
</script>
