import { createRouter, createWebHistory } from 'vue-router'
import {
  authGuard,
  roleGuard,
  classroomAccessGuard,
  classroomDataGuard,
  composeGuards,
} from './guards'

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
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('@/views/ForgotPasswordPage.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('@/views/ResetPasswordPage.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/classroom/:classroomId/dashboard',
      name: 'dashboard',
      component: () => import('@/views/wrappers/DashboardPageWrapper.vue'),
      meta: { requiresAuth: true, role: ['admin', 'teacher', 'student'] },
    },
    {
      path: '/classroom/:classroomId/questions',
      name: 'questions',
      component: () => import('@/views/TeacherQuestionsPage.vue'),
      meta: { requiresAuth: true, role: ['teacher'] },
    },
    {
      path: '/classroom/:classroomId/students',
      name: 'students',
      component: () => import('@/views/TeacherStudentsPage.vue'),
      meta: { requiresAuth: true, role: ['teacher'] },
    },
    {
      path: '/classroom/:classroomId/leaderboard',
      name: 'leaderboard',
      component: () => import('@/views/StudentLeaderboardPage.vue'),
      meta: { requiresAuth: true, role: ['student', 'teacher'] },
    },
    {
      path: '/classroom/:classroomId/practice',
      name: 'practice',
      component: () => import('@/views/StudentPracticePage.vue'),
      meta: { requiresAuth: true, role: ['student'] },
    },
    // {
    //   path: '/classroom/:classroomId/practice/questions',
    //   name: 'practice-questions',
    //   component: () => import('@/views/PracticeQuestionsPage.vue'),
    //   meta: { requiresAuth: true, role: ['student'] },
    // },
    {
      path: '/classroom/:classroomId/videos',
      name: 'videos',
      component: () => import('@/views/wrappers/VideosPageWrapper.vue'),
      meta: { requiresAuth: true, role: ['teacher', 'student'] },
    },
    {
      path: '/classroom/:classroomId/documents',
      name: 'documents',
      component: () => import('@/views/wrappers/DocumentsPageWrapper.vue'),
      meta: { requiresAuth: true, role: ['teacher', 'student'] },
    },
    {
      path: '/classroom/:classroomId/puzzles',
      name: 'puzzles',
      component: () => import('@/views/wrappers/PuzzlesPageWrapper.vue'),
      meta: { requiresAuth: true, role: ['teacher', 'student'] },
    },
    {
      path: '/classroom/:classroomId/puzzles/:puzzleId/solve',
      name: 'puzzle-solve',
      component: () => import('@/views/PuzzleSolvePage.vue'),
      meta: { requiresAuth: true, role: ['student'] },
    },
    {
      path: '/classroom/:classroomId/problem-sets',
      name: 'problem-sets',
      component: () => import('@/views/wrappers/ProblemSetsPageWrapper.vue'),
      meta: { requiresAuth: true, role: ['teacher', 'student'] },
    },
    {
      path: '/classroom/:classroomId/problem-sets/create',
      name: 'problem-sets-create',
      component: () => import('@/views/QuestionSetBuilderPage.vue'),
      meta: { requiresAuth: true, role: ['teacher'] },
    },
    {
      path: '/classroom/:classroomId/problem-sets/:setId/edit',
      name: 'problem-sets-edit',
      component: () => import('@/views/QuestionSetBuilderPage.vue'),
      meta: { requiresAuth: true, role: ['teacher'] },
    },
    {
      path: '/classroom/:classroomId/problem-sets/:setId/attempt/:attemptId',
      name: 'problem-set-attempt',
      component: () => import('@/views/QuestionSetAttemptPage.vue'),
      meta: { requiresAuth: true, role: ['student'] },
    },
    {
      path: '/classroom/:classroomId/problem-sets/results/:attemptId',
      name: 'problem-set-results',
      component: () => import('@/views/QuestionSetResultsPage.vue'),
      meta: { requiresAuth: true, role: ['student'] },
    },
    {
      path: '/classrooms',
      name: 'classrooms',
      component: () => import('@/views/wrappers/ClassroomsPageWrapper.vue'),
      meta: { requiresAuth: true, role: ['teacher', 'student'] },
    },
    {
      path: '/public-classrooms',
      name: 'public-classrooms',
      component: () => import('@/views/PublicClassroomsPage.vue'),
      meta: { requiresAuth: true, role: ['student'] },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/wrappers/SettingsPageWrapper.vue'),
      meta: { requiresAuth: true, role: ['teacher', 'student'] },
    },
    {
      path: '/classroom/:classroomId/settings',
      name: 'classroom-settings',
      component: () => import('@/views/wrappers/ClassroomSettingsPageWrapper.vue'),
      meta: { requiresAuth: true, role: ['teacher', 'student'] },
    },
  ],
})

// Apply guards in order: auth -> role -> classroom access -> classroom data
router.beforeEach(composeGuards(authGuard, roleGuard, classroomAccessGuard, classroomDataGuard))

export default router
