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
                <Avatar class="size-8">
                  <AvatarImage v-if="currentAvatarUrl" :src="currentAvatarUrl" />
                  <AvatarFallback class="bg-primary/10 text-primary">
                    {{ getInitials(userName) }}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-56">
              <div class="flex items-center gap-2 p-2">
                <Avatar class="size-8">
                  <AvatarImage v-if="currentAvatarUrl" :src="currentAvatarUrl" />
                  <AvatarFallback class="bg-primary/10 text-primary">
                    {{ getInitials(userName) }}
                  </AvatarFallback>
                </Avatar>
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Settings, LogOut } from 'lucide-vue-next'

const authStore = useAuthStore()
const profileStore = useProfileStore()
const { logout } = useNavigation()

const userName = computed(() => {
  return profileStore.fullName || 'User'
})

const userEmail = computed(() => {
  return authStore.user?.email || ''
})

const getInitials = (name: string): string => {
  if (!name) return '?'
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const currentAvatarUrl = computed(() => profileStore.userProfile?.avatar_url || null)

const handleSignOut = logout
</script>
