<template>
  <Sidebar collapsible="icon">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" as-child>
            <router-link :to="dashboardUrl">
              <div
                class="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
              >
                <GraduationCap class="size-4" />
              </div>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-semibold">PeakMark</span>
                <span class="truncate text-xs capitalize">{{ userRole }}</span>
              </div>
            </router-link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem v-if="userRole === 'student'">
          <div
            class="px-2 pb-2 space-y-1 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:pb-0 group-data-[collapsible=icon]:space-y-0.5"
          >
            <div
              class="flex items-center justify-between text-xs group-data-[collapsible=icon]:hidden"
            >
              <span class="font-semibold">Level {{ currentLevel }}</span>
              <span class="text-muted-foreground"
                >{{ expInCurrentLevel }} / {{ expToNextLevel }} XP</span
              >
            </div>
            <div
              class="hidden group-data-[collapsible=icon]:flex justify-center text-xs font-semibold pt-2"
            >
              {{ currentLevel }}
            </div>
            <div
              class="h-2 w-full bg-muted rounded-full overflow-hidden group-data-[collapsible=icon]:h-1"
            >
              <div
                class="h-full bg-primary transition-all duration-300"
                :style="{ width: `${expProgress}%` }"
              ></div>
            </div>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup v-for="(group, index) in navigation" :key="index">
        <SidebarGroupLabel v-if="group.title">{{ group.title }}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in group.items" :key="item.title">
              <SidebarMenuButton as-child :tooltip="item.title" :is-active="isActive(item.url)">
                <router-link :to="item.url" class="flex items-center gap-2">
                  <component :is="item.icon" class="size-4" />
                  <span>{{ item.title }}</span>
                  <SidebarMenuBadge v-if="item.badge">{{ item.badge }}</SidebarMenuBadge>
                </router-link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <SidebarMenuButton size="lg">
                <Avatar class="size-8">
                  <AvatarImage v-if="currentAvatarUrl" :src="currentAvatarUrl" />
                  <AvatarFallback class="bg-primary/10 text-primary">
                    {{ getInitials(userName) }}
                  </AvatarFallback>
                </Avatar>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-semibold">{{ userName }}</span>
                  <span class="truncate text-xs">{{ userEmail }}</span>
                </div>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-56">
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
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>

    <SidebarRail />
  </Sidebar>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'
import { useLevel } from '@/composables/useLevel'
import { useNavigation } from '@/composables/useNavigation'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { GraduationCap, School, Settings, LogOut, UserCog } from 'lucide-vue-next'

const authStore = useAuthStore()
const profileStore = useProfileStore()
const { currentLevel, expToNextLevel, expProgress, expInCurrentLevel } = useLevel()
const { navigationItems, dashboardUrl, isActive, logout } = useNavigation()

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

const navigation = navigationItems

const handleSignOut = logout
</script>
