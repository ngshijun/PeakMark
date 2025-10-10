<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset class="flex flex-col h-screen overflow-hidden">
      <header
        class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12"
      >
        <div class="flex items-center gap-2 px-4 flex-1">
          <SidebarTrigger class="-ml-1" />
          <Separator orientation="vertical" class="mr-2 h-4" />
          <Breadcrumb v-if="breadcrumbs">
            <BreadcrumbList>
              <template v-for="(crumb, index) in breadcrumbs" :key="index">
                <BreadcrumbItem>
                  <BreadcrumbLink
                    v-if="crumb.href || crumb.to || crumb.onClick"
                    :href="crumb.href || crumb.to || '#'"
                    @click="
                      (e: Event) => {
                        if (crumb.onClick) {
                          e.preventDefault()
                          crumb.onClick()
                        }
                      }
                    "
                    :class="crumb.onClick ? 'cursor-pointer' : ''"
                  >
                    {{ crumb.label }}
                  </BreadcrumbLink>
                  <BreadcrumbPage v-else>
                    {{ crumb.label }}
                  </BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator v-if="index < breadcrumbs.length - 1" />
              </template>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div class="px-4 flex items-center gap-3">
          <div v-if="currentClassroom" class="flex items-center gap-2">
            <div class="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-muted/50">
              <School class="h-4 w-4 text-muted-foreground" />
              <span class="text-sm font-medium">{{ currentClassroom.name }}</span>
            </div>
            <Button variant="ghost" size="sm" @click="switchClassroom" title="Switch classroom">
              <ArrowLeftRight class="h-4 w-4" />
            </Button>
          </div>
          <Separator orientation="vertical" class="h-4" />
          <ThemeToggle />
        </div>
      </header>
      <div class="flex flex-1 flex-col gap-4 p-4 pt-0 min-h-0">
        <slot />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>

<script setup lang="ts">
import AppSidebar from '@/components/AppSidebar.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { useNavigation } from '@/composables/useNavigation'
import { useClassroomStore } from '@/stores/classrooms'
import { ArrowLeftRight, School } from 'lucide-vue-next'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

interface Breadcrumb {
  label: string
  href?: string
  to?: string
  onClick?: () => void
}

interface Props {
  breadcrumbs?: Breadcrumb[]
}

defineProps<Props>()

const classroomStore = useClassroomStore()
const router = useRouter()
const { selectedClassroomId } = useNavigation()

const currentClassroom = computed(() => {
  const classroomId = selectedClassroomId.value
  if (!classroomId) return null
  return (
    classroomStore.teacherClassrooms.find((c) => c.id === classroomId) ||
    classroomStore.studentClassrooms.find((c) => c.id === classroomId)
  )
})

const switchClassroom = () => {
  router.push({ name: 'classrooms' })
}
</script>
