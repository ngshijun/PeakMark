<script setup lang="ts">
import { RouterView } from 'vue-router'
import { Toaster } from '@/components/ui/sonner'
</script>

<template>
  <Toaster />
  <div class="relative min-h-screen">
    <RouterView />
  </div>
</template>

<style scoped></style>
