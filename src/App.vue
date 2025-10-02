<script setup lang="ts">
import { RouterView } from 'vue-router'
import { Toaster } from '@/components/ui/sonner'
import 'vue-sonner/style.css'
import { useTheme } from '@/composables/useTheme'
import { SpeedInsights } from "@vercel/speed-insights/vue"

const { theme } = useTheme()
</script>

<template>
  <div class="relative min-h-screen">
    <SpeedInsights />
    <RouterView />
    <Toaster richColors position="top-center" :theme="theme" />
  </div>
</template>

<style scoped></style>
