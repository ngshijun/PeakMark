import { roleNavigation } from '@/config/navigation'
import type { NavGroup } from '@/config/navigation'
import { useAuthStore } from '@/stores/auth'
import type { Tables } from '@/types/database.types'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

type Classroom = Tables<'classrooms'>

/**
 * Navigation composable
 * Handles programmatic navigation and route logic
 */
export function useNavigation() {
  const router = useRouter()
  const route = useRoute()
  const authStore = useAuthStore()

  // Get classroom ID from URL
  const selectedClassroomId = computed(() => route.params.classroomId as string | undefined)

  // Navigate to classroom dashboard
  // Note: fetchStudentExp is handled by classroom-data.guard
  const goToClassroom = (classroom: Classroom) => {
    router.push({
      name: 'dashboard',
      params: { classroomId: classroom.id },
    })
  }

  // Navigate to classroom selection
  const goToClassroomSelection = () => {
    router.push({ name: 'classrooms' })
  }

  // Navigate to login
  const goToLogin = () => {
    router.push({ name: 'login-page' })
  }

  // Logout and redirect
  const logout = async () => {
    await authStore.signOut()
    router.push({ name: 'login-page' })
  }

  // Computed navigation items based on role and classroom
  const navigationItems = computed<NavGroup[]>(() => {
    const role = authStore.user?.user_metadata?.role as 'student' | 'teacher' | 'admin'
    const baseNav = roleNavigation[role] || roleNavigation.student
    const classroomId = selectedClassroomId.value

    // If no classroom is selected, return navigation that points to /classrooms
    if (!classroomId) {
      return baseNav.map((group) => ({
        ...group,
        items: group.items.map((item) => ({
          ...item,
          url: item.url === '/settings' ? item.url : '/classrooms',
        })),
      }))
    }

    // Replace URLs with classroom-scoped versions
    return baseNav.map((group) => ({
      ...group,
      items: group.items.map((item) => ({
        ...item,
        url: item.url.replace(/^\//, `/classroom/${classroomId}/`),
      })),
    }))
  })

  // Dashboard URL based on classroom selection
  const dashboardUrl = computed(() => {
    const classroomId = selectedClassroomId.value
    return classroomId ? `/classroom/${classroomId}/dashboard` : '/classrooms'
  })

  // Check if a URL is active
  const isActive = (url: string) => {
    return route.path === url
  }

  return {
    // State
    selectedClassroomId,

    // Navigation methods
    goToClassroom,
    goToClassroomSelection,
    goToLogin,
    logout,

    // Computed
    navigationItems,
    dashboardUrl,
    isActive,
  }
}
