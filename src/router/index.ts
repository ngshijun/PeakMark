import { useAuthStore } from '@/stores/auth'
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
      meta: { requiresAuth: true, role: ['admin', 'teacher', 'student'] },
    },
    {
      path: '/questions',
      name: 'questions',
      component: () => import('@/views/QuestionsPage.vue'),
      meta: { requiresAuth: true, role: ['teacher'] },
    },
    {
      path: '/practice',
      name: 'practice',
      component: () => import('@/views/PracticePage.vue'),
      meta: { requiresAuth: true, role: ['student'] },
    },
    {
      path: '/practice/questions',
      name: 'practice-questions',
      component: () => import('@/views/PracticeQuestionsPage.vue'),
      meta: { requiresAuth: true, role: ['student'] },
    },
    {
      path: '/teacher/videos',
      name: 'teacher-videos',
      component: () => import('@/views/TeacherVideosPage.vue'),
      meta: { requiresAuth: true, role: ['teacher'] },
    },
    {
      path: '/student/videos',
      name: 'student-videos',
      component: () => import('@/views/StudentVideosPage.vue'),
      meta: { requiresAuth: true, role: ['student'] },
    },
  ],
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const { user, loading } = authStore
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const requiredRoles = to.meta.role as string[] | undefined

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

    if (requiredRoles.includes(user.user_metadata.role)) {
      // User has required role - allow access
      next()
    } else {
      // User doesn't have required role - redirect based on their role
      if (to.name === 'dashboard') {
        // Already on dashboard, allow access
        next()
      } else {
        // Redirect to dashboard
        next({ name: 'dashboard' })
      }
    }
  } else {
    // No specific role required - just needs to be authenticated
    next()
  }
})

export default router
