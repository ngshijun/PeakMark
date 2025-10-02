<template>
  <MainLayout :breadcrumbs="breadcrumbs"> </MainLayout>
</template>

<script setup lang="ts">
import MainLayout from '@/layouts/MainLayout.vue'

const breadcrumbs = [{ label: 'Student Dashboard' }]
</script>
