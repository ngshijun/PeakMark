import { useAuthStore } from '@/stores/auth'
import { useClassroomSelectionStore } from '@/stores/classroomSelection'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing-page',
      component: () => import('@/views/LandingPage.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/login',
      name: 'login-page',
      component: () => import('@/views/LoginPage.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/register',
      name: 'register-page',
      component: () => import('@/views/RegisterPage.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardWrapper.vue'),
      meta: { requiresAuth: true, role: ['admin', 'teacher', 'student'], requiresClassroom: true },
    },
    {
      path: '/questions',
      name: 'questions',
      component: () => import('@/views/QuestionsPage.vue'),
      meta: { requiresAuth: true, role: ['teacher'], requiresClassroom: true },
    },
    {
      path: '/practice',
      name: 'practice',
      component: () => import('@/views/PracticePage.vue'),
      meta: { requiresAuth: true, role: ['student'], requiresClassroom: true },
    },
    {
      path: '/practice/questions',
      name: 'practice-questions',
      component: () => import('@/views/PracticeQuestionsPage.vue'),
      meta: { requiresAuth: true, role: ['student'], requiresClassroom: true },
    },
    {
      path: '/videos',
      name: 'videos',
      component: () => import('@/views/VideosWrapper.vue'),
      meta: { requiresAuth: true, role: ['teacher', 'student'], requiresClassroom: true },
    },
    {
      path: '/teacher/videos',
      redirect: '/videos',
    },
    {
      path: '/student/videos',
      redirect: '/videos',
    },
    {
      path: '/classrooms',
      name: 'classrooms',
      component: () => import('@/views/ClassroomsWrapper.vue'),
      meta: { requiresAuth: true, role: ['teacher', 'student'] },
    },
    {
      path: '/teacher/classrooms',
      redirect: '/classrooms',
    },
    {
      path: '/student/classrooms',
      redirect: '/classrooms',
    },
  ],
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const classroomSelectionStore = useClassroomSelectionStore()
  const { user, loading } = authStore
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const requiredRoles = to.meta.role as string[] | undefined
  const requiresClassroom = to.meta.requiresClassroom as boolean | undefined

  // Wait for auth to initialize
  if (loading) {
    next()
    return
  }

  // Public routes - allow access
  if (!requiresAuth) {
    next()
    return
  }

  // Protected routes - check authentication
  if (!user) {
    if (to.name !== 'login-page') {
      next({ name: 'login-page' })
    } else {
      next()
    }
    return
  }

  // Check role-based access
  if (requiredRoles && Array.isArray(requiredRoles)) {
    if (!user.user_metadata.role) {
      // User has no role - redirect to login
      if (to.name !== 'login-page') {
        next({ name: 'login-page' })
      } else {
        next()
      }
      return
    }

    if (!requiredRoles.includes(user.user_metadata.role)) {
      // User doesn't have required role - redirect to classrooms or dashboard
      const role = user.user_metadata.role
      if (role === 'student' || role === 'teacher') {
        next({ name: 'classrooms' })
      } else {
        next({ name: 'dashboard' })
      }
      return
    }
  }

  // Check classroom selection for routes that require it
  if (requiresClassroom && !classroomSelectionStore.selectedClassroom) {
    // Redirect to classroom selection page
    next({ name: 'classrooms' })
    return
  }

  // All checks passed - allow access
  next()
})

export default router
