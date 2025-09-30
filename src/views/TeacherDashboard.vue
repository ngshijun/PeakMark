<template>
  <MainLayout :breadcrumbs="breadcrumbs">
    <div class="grid auto-rows-min gap-4 md:grid-cols-3">
      <div class="aspect-video rounded-xl bg-muted/50" />
      <div class="aspect-video rounded-xl bg-muted/50" />
      <div class="aspect-video rounded-xl bg-muted/50" />
    </div>
    <div class="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
  </MainLayout>
</template>

<script setup lang="ts">
import MainLayout from '@/layouts/MainLayout.vue'

const breadcrumbs = [{ label: 'Teacher Dashboard' }]
</script>
