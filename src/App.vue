<script setup lang="ts">
import { RouterView } from 'vue-router'
import { Toaster } from '@/components/ui/sonner'
import 'vue-sonner/style.css'
import { useTheme } from '@/composables/useTheme'

const { theme } = useTheme()
</script>

<template>
  <div class="relative min-h-screen">
    <RouterView />
    <Toaster richColors position="top-center" :theme="theme" />
  </div>
</template>

<style scoped></style>
