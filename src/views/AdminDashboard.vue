<template>
  <MainLayout :breadcrumbs="breadcrumbs">
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <!-- Total Revenue Card -->
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">${{ stats.totalRevenue.toLocaleString() }}</div>
          <p class="text-xs text-muted-foreground">All time revenue</p>
        </CardContent>
      </Card>

      <!-- Total Students Card -->
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Total Students</CardTitle>
          <Users class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.totalStudents }}</div>
          <p class="text-xs text-muted-foreground">Registered students</p>
        </CardContent>
      </Card>

      <!-- Total Questions Created Card -->
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Questions Created</CardTitle>
          <FileQuestion class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.totalQuestionsCreated }}</div>
          <p class="text-xs text-muted-foreground">Total questions</p>
        </CardContent>
      </Card>

      <!-- Active Now Card -->
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Active Now</CardTitle>
          <Activity class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.activeNow }}</div>
          <p class="text-xs text-muted-foreground">Users online</p>
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
import { DollarSign, Users, FileQuestion, Activity } from 'lucide-vue-next'

const breadcrumbs = [{ label: 'Admin Dashboard' }]

const stats = ref({
  totalRevenue: 0,
  totalStudents: 0,
  totalQuestionsCreated: 0,
  activeNow: 0,
})

// TODO: Fetch actual stats from your database
</script>
