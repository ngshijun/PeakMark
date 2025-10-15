<template>
  <TeacherClassroomSettingsPage v-if="isTeacher" />
  <StudentClassroomSettingsPage v-else />
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// Define components once, not in computed
const TeacherClassroomSettingsPage = defineAsyncComponent(
  () => import('@/views/TeacherClassroomSettingsPage.vue'),
)
const StudentClassroomSettingsPage = defineAsyncComponent(
  () => import('@/views/StudentClassroomSettingsPage.vue'),
)

// Only compute the role, not the component
const isTeacher = computed(() => authStore.user?.user_metadata?.role === 'teacher')
</script>
