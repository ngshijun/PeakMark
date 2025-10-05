import { useAuthStore } from '@/stores/auth'
import { useClassroomStore } from '@/stores/classrooms'
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
      path: '/classroom/:classroomId/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardWrapper.vue'),
      meta: { requiresAuth: true, role: ['admin', 'teacher', 'student'] },
    },
    {
      path: '/classroom/:classroomId/questions',
      name: 'questions',
      component: () => import('@/views/QuestionsPage.vue'),
      meta: { requiresAuth: true, role: ['teacher'] },
    },
    {
      path: '/classroom/:classroomId/practice',
      name: 'practice',
      component: () => import('@/views/PracticePage.vue'),
      meta: { requiresAuth: true, role: ['student'] },
    },
    {
      path: '/classroom/:classroomId/practice/questions',
      name: 'practice-questions',
      component: () => import('@/views/PracticeQuestionsPage.vue'),
      meta: { requiresAuth: true, role: ['student'] },
    },
    {
      path: '/classroom/:classroomId/videos',
      name: 'videos',
      component: () => import('@/views/VideosWrapper.vue'),
      meta: { requiresAuth: true, role: ['teacher', 'student'] },
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

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const classroomStore = useClassroomStore()
  const { user, loading } = authStore
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const requiredRoles = to.meta.role as string[] | undefined
  const classroomId = to.params.classroomId as string | undefined

  // Wait for auth to initialize - don't proceed if still loading
  if (loading) {
    // Wait for auth to finish initializing
    const unsubscribe = authStore.$subscribe((mutation, state) => {
      if (!state.loading) {
        unsubscribe()
        // Retry navigation after auth loads
        router.push(to.fullPath)
      }
    })
    return next(false) // Cancel this navigation
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
      // User doesn't have required role - redirect to classrooms
      next({ name: 'classrooms' })
      return
    }
  }

  // Check classroom access for routes with classroomId parameter
  if (classroomId && user.user_metadata.role) {
    console.log('🔒 Checking classroom access:', {
      userId: user.id,
      classroomId,
      role: user.user_metadata.role,
    })

    const hasAccess = await classroomStore.hasAccessToClassroom(
      user.id,
      classroomId,
      user.user_metadata.role,
    )

    console.log('🔒 Access result:', hasAccess)

    if (!hasAccess) {
      console.log('❌ Access denied - redirecting to classrooms')
      // User doesn't have access to this classroom - redirect to classrooms
      next({ name: 'classrooms' })
      return
    }

    console.log('✅ Access granted')
  }

  // All checks passed - allow access
  next()
})

export default router
