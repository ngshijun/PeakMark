<template>
  <MainLayout :breadcrumbs="breadcrumbs">
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <!-- Questions Answered Card -->
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Questions Answered</CardTitle>
          <CheckCircle class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.questionsAnswered }}</div>
          <p class="text-xs text-muted-foreground">Total answered</p>
        </CardContent>
      </Card>

      <!-- Accuracy Rate Card -->
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Accuracy Rate</CardTitle>
          <Target class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.accuracyRate }}%</div>
          <p class="text-xs text-muted-foreground">Overall accuracy</p>
        </CardContent>
      </Card>

      <!-- Study Streak Card -->
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Study Streak</CardTitle>
          <Flame class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.studyStreak }}</div>
          <p class="text-xs text-muted-foreground">Days in a row</p>
        </CardContent>
      </Card>

      <!-- Question Sets Completed Card -->
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Sets Completed</CardTitle>
          <Trophy class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.setsCompleted }}</div>
          <p class="text-xs text-muted-foreground">Question sets</p>
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
import { CheckCircle, Target, Flame, Trophy } from 'lucide-vue-next'

const breadcrumbs = [{ label: 'Student Dashboard' }]

const stats = ref({
  questionsAnswered: 0,
  accuracyRate: 0,
  studyStreak: 0,
  setsCompleted: 0,
})

// TODO: Fetch actual stats from your database
</script>
