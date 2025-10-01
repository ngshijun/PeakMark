<template>
  <MainLayout :breadcrumbs="breadcrumbs">
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <!-- Questions Created Card -->
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Questions Created</CardTitle>
          <FileText class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.questionsCreated }}</div>
          <p class="text-xs text-muted-foreground">Total questions</p>
        </CardContent>
      </Card>

      <!-- Active Students Card -->
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Active Students</CardTitle>
          <Users class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.activeStudents }}</div>
          <p class="text-xs text-muted-foreground">Students this month</p>
        </CardContent>
      </Card>

      <!-- Question Sets Card -->
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Question Sets</CardTitle>
          <FolderOpen class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.questionSets }}</div>
          <p class="text-xs text-muted-foreground">Total sets</p>
        </CardContent>
      </Card>

      <!-- Average Score Card -->
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Average Score</CardTitle>
          <BarChart3 class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.averageScore }}%</div>
          <p class="text-xs text-muted-foreground">Across all students</p>
        </CardContent>
      </Card>
    </div>

    <div class="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min mt-4" />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Users, FolderOpen, BarChart3 } from 'lucide-vue-next'

const breadcrumbs = [{ label: 'Teacher Dashboard' }]

const stats = ref({
  questionsCreated: 0,
  activeStudents: 0,
  questionSets: 0,
  averageScore: 0,
})

// TODO: Fetch actual stats from your database
</script>
