import { createRouter, createWebHistory } from 'vue-router'
import { authGuard, roleGuard, classroomAccessGuard, composeGuards } from './guards'

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
    // {
    //   path: '/classroom/:classroomId/practice',
    //   name: 'practice',
    //   component: () => import('@/views/PracticePage.vue'),
    //   meta: { requiresAuth: true, role: ['student'] },
    // },
    // {
    //   path: '/classroom/:classroomId/practice/questions',
    //   name: 'practice-questions',
    //   component: () => import('@/views/PracticeQuestionsPage.vue'),
    //   meta: { requiresAuth: true, role: ['student'] },
    // },
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
      path: '/classroom/:classroomId/settings',
      name: 'classroom-settings',
      component: () => import('@/views/ClassroomSettingsPage.vue'),
      meta: { requiresAuth: true, role: ['teacher'] },
    },
  ],
})

// Apply guards in order: auth -> role -> classroom access
router.beforeEach(composeGuards(authGuard, roleGuard, classroomAccessGuard))

export default router
