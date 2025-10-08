<template>
  <MainLayout :breadcrumbs="breadcrumbs">
    <div class="space-y-4">
      <!-- Header -->
      <div class="space-y-2">
        <h1 class="text-3xl font-bold tracking-tight">Welcome back, {{ userName }}!</h1>
        <p class="text-muted-foreground">Manage your questions and track student performance</p>
      </div>

      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <template v-if="loading">
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
          <!-- Questions Created Card -->
          <Card class="flex flex-col">
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle class="text-sm font-medium">Questions Created</CardTitle>
              <FileText class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent class="flex-1 flex flex-col justify-end">
              <div class="text-2xl font-bold">{{ stats.questionsCreated }}</div>
              <p class="text-xs text-muted-foreground">Total questions</p>
            </CardContent>
          </Card>

          <!-- Active Students Card -->
          <Card class="flex flex-col">
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle class="text-sm font-medium">Active Students</CardTitle>
              <Users class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent class="flex-1 flex flex-col justify-end">
              <div class="text-2xl font-bold">{{ stats.activeStudents }}</div>
              <p class="text-xs text-muted-foreground">Students this month</p>
            </CardContent>
          </Card>

          <!-- Question Sets Card -->
          <Card class="flex flex-col">
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle class="text-sm font-medium">Question Sets</CardTitle>
              <FolderOpen class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent class="flex-1 flex flex-col justify-end">
              <div class="text-2xl font-bold">{{ stats.questionSets }}</div>
              <p class="text-xs text-muted-foreground">Total sets</p>
            </CardContent>
          </Card>

          <!-- Average Score Card -->
          <Card class="flex flex-col">
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle class="text-sm font-medium">Average Score</CardTitle>
              <BarChart3 class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent class="flex-1 flex flex-col justify-end">
              <div class="text-2xl font-bold">{{ stats.averageScore }}%</div>
              <p class="text-xs text-muted-foreground">Across all students</p>
            </CardContent>
          </Card>
        </template>
      </div>

      <div class="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText, Users, FolderOpen, BarChart3 } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const breadcrumbs = [{ label: 'Teacher Dashboard' }]

const userName = computed(() => {
  return authStore.user?.user_metadata?.full_name?.split(' ')[0] || 'Teacher'
})

const loading = ref(false)
const stats = ref({
  questionsCreated: 0,
  activeStudents: 0,
  questionSets: 0,
  averageScore: 0,
})

// TODO: Fetch actual stats from your database
</script>
