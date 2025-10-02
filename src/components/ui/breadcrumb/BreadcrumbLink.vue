<script lang="ts" setup>
import type { HTMLAttributes } from 'vue'
import { RouterLink } from 'vue-router'
import { cn } from '@/lib/utils'

interface Props {
  href?: string
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
</script>

<template>
  <RouterLink
    v-if="href"
    :to="href"
    :class="cn('hover:text-foreground transition-colors', props.class)"
  >
    <slot />
  </RouterLink>
  <span v-else :class="cn('hover:text-foreground transition-colors', props.class)">
    <slot />
  </span>
</template>
