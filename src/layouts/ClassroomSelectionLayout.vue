<template>
  <div class="flex flex-col h-screen overflow-hidden bg-background">
    <!-- Header -->
    <header class="flex h-16 shrink-0 items-center gap-2 border-b">
      <div class="flex items-center justify-between px-4 w-full">
        <div class="flex items-center gap-2">
          <h1 class="text-xl font-bold">PeakMark</h1>
        </div>
        <div class="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="icon" class="h-9 w-9 rounded-full">
                <div
                  class="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted"
                >
                  <component :is="roleIcon" class="size-4" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-56">
              <div class="flex items-center gap-2 p-2">
                <div
                  class="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted"
                >
                  <component :is="roleIcon" class="size-4" />
                </div>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-semibold">{{ userName }}</span>
                  <span class="truncate text-xs text-muted-foreground">{{ userEmail }}</span>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <RouterLink to="/settings">
                  <Settings class="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </RouterLink>
              </DropdownMenuItem>
              <DropdownMenuItem @click="handleSignOut">
                <LogOut class="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ThemeToggle />
        </div>
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
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'
import { useNavigation } from '@/composables/useNavigation'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { GraduationCap, School, Settings, LogOut, UserCog } from 'lucide-vue-next'

const authStore = useAuthStore()
const profileStore = useProfileStore()
const { logout } = useNavigation()

const userRole = computed(() => {
  return profileStore.role || 'student'
})

const userName = computed(() => {
  return profileStore.fullName || 'User'
})

const userEmail = computed(() => {
  return authStore.user?.email || ''
})

const roleIcon = computed(() => {
  switch (userRole.value) {
    case 'teacher':
      return School
    case 'admin':
      return UserCog
    default:
      return GraduationCap
  }
})

const handleSignOut = logout
</script>
