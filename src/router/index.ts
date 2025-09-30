import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing-page',
      component: () => import('@/views/LandingPage.vue'),
    },
    {
      path: '/login',
      name: 'login-page',
      component: () => import('@/views/LoginPage.vue'),
    },
    {
      path: '/register',
      name: 'register-page',
      component: () => import('@/views/RegisterPage.vue'),
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
  ],
})

export default router
