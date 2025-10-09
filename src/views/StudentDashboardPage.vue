<template>
  <MainLayout :breadcrumbs="breadcrumbs">
    <div class="space-y-4">
      <!-- Header -->
      <div class="space-y-2">
        <h1 class="text-3xl font-bold tracking-tight">Welcome back, {{ userName }}!</h1>
        <p class="text-muted-foreground">Track your progress and keep up the great work</p>
      </div>

      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <template v-if="profileStore.loading">
          <Card v-for="i in 4" :key="i" class="flex flex-col">
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton class="h-4 w-32" />
              <Skeleton class="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent class="flex-1 flex flex-col justify-end">
              <Skeleton class="h-8 w-20 mb-2" />
              <Skeleton class="h-3 w-24" />
            </CardContent>
          </Card>
        </template>
        <template v-else>
          <!-- Questions Answered Card -->
          <Card class="flex flex-col">
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle class="text-sm font-medium">Questions Answered</CardTitle>
              <CheckCircle class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent class="flex-1 flex flex-col justify-end">
              <div class="text-2xl font-bold">{{ stats.questionsAnswered }}</div>
              <p class="text-xs text-muted-foreground">Total answered</p>
            </CardContent>
          </Card>

          <!-- Accuracy Rate Card -->
          <Card class="flex flex-col">
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle class="text-sm font-medium">Accuracy Rate</CardTitle>
              <Target class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent class="flex-1 flex flex-col justify-end">
              <div class="text-2xl font-bold">{{ stats.accuracyRate }}%</div>
              <p class="text-xs text-muted-foreground">Overall accuracy</p>
            </CardContent>
          </Card>

          <!-- Study Streak Card -->
          <Card class="flex flex-col">
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle class="text-sm font-medium">Study Streak</CardTitle>
              <Flame class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent class="flex-1 flex flex-col justify-end">
              <div class="text-2xl font-bold">{{ stats.studyStreak }}</div>
              <p class="text-xs text-muted-foreground">Days in a row</p>
            </CardContent>
          </Card>

          <!-- Question Sets Completed Card -->
          <Card class="flex flex-col">
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle class="text-sm font-medium">Sets Completed</CardTitle>
              <Trophy class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent class="flex-1 flex flex-col justify-end">
              <div class="text-2xl font-bold">{{ stats.setsCompleted }}</div>
              <p class="text-xs text-muted-foreground">Question sets</p>
            </CardContent>
          </Card>
        </template>
      </div>

      <div class="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle, Target, Flame, Trophy } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'

const authStore = useAuthStore()
const profileStore = useProfileStore()
const breadcrumbs = [{ label: 'Student Dashboard' }]

const userName = computed(() => {
  return authStore.user?.user_metadata?.full_name?.split(' ')[0] || 'Student'
})

const stats = computed(() => profileStore.studentStats)

// Profile is already fetched in main.ts on app initialization
// No need to fetch again here
</script>
