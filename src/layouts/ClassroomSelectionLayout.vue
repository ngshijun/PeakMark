<template>
  <div class="flex flex-col h-screen overflow-hidden bg-background">
    <!-- Header -->
    <header class="flex h-16 shrink-0 items-center border-b">
      <div class="flex items-center justify-between px-6 w-full">
        <div class="flex items-center gap-2">
          <h1 class="text-xl font-bold">PeakMark</h1>
        </div>
        <ThemeToggle />
      </div>
    </header>

    <!-- Main Content -->
    <div class="flex-1 overflow-auto">
      <div class="container mx-auto p-6 max-w-7xl">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ThemeToggle from '@/components/ThemeToggle.vue'
</script>
