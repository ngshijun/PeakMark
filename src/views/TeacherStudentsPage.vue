<template>
  <MainLayout :breadcrumbs="breadcrumbs">
    <div class="flex flex-col h-full space-y-4">
      <!-- Header -->
      <div class="space-y-2">
        <h1 class="text-3xl font-bold tracking-tight">Students</h1>
        <p class="text-muted-foreground">
          View and manage students enrolled in {{ classroom?.name || 'this classroom' }}
        </p>
      </div>

      <!-- Search Bar -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="relative flex-1 sm:max-w-md">
          <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            type="search"
            placeholder="Search students by name..."
            class="pl-8"
          />
        </div>

        <!-- Student Count Badge -->
        <div class="flex items-center gap-2">
          <span class="text-sm text-muted-foreground">Total Students:</span>
          <span class="text-sm font-medium">{{ filteredStudents.length }}</span>
        </div>
      </div>

      <!-- Students Data Table -->
      <div class="flex-1 min-h-0 rounded-xl border bg-card overflow-hidden">
        <div class="h-full overflow-auto">
          <Table
            class="[&_thead_th:first-child]:pl-6 [&_tbody_td:first-child]:pl-6 [&_thead_th:last-child]:pr-6 [&_tbody_td:last-child]:pr-6"
          >
            <TableHeader class="sticky top-0 z-10 bg-card shadow-sm">
              <TableRow>
                <TableHead class="min-w-[15rem]">Student Name</TableHead>
                <TableHead class="w-[10rem]">Experience (XP)</TableHead>
                <TableHead class="w-[12rem]">Joined Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <!-- Loading State -->
              <template v-if="loading">
                <TableRow v-for="i in 8" :key="i">
                  <TableCell><Skeleton class="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton class="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton class="h-5 w-24" /></TableCell>
                </TableRow>
              </template>

              <!-- Empty State -->
              <TableRow v-else-if="filteredStudents.length === 0">
                <TableCell colspan="3" class="h-24 text-center">
                  <p class="text-sm text-muted-foreground">
                    No students found. Students will appear here once they join your classroom.
                  </p>
                </TableCell>
              </TableRow>

              <!-- Students Data -->
              <TableRow v-else v-for="student in paginatedStudents" :key="student.id">
                <TableCell>
                  <div class="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback class="bg-primary/10 text-primary font-medium">
                        {{ getInitials(student.full_name) }}
                      </AvatarFallback>
                    </Avatar>
                    <span class="font-medium">{{ student.full_name }}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium">{{ student.exp.toLocaleString() }}</span>
                    <span class="text-xs text-muted-foreground">XP</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span class="text-xs text-muted-foreground">
                    {{ formatDate(student.joined_at) }}
                  </span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="filteredStudents.length > 0" class="grid grid-cols-3 items-center gap-3">
        <div class="flex items-center gap-2">
          <span class="text-sm text-muted-foreground whitespace-nowrap">Rows per page:</span>
          <Select v-model="itemsPerPageString">
            <SelectTrigger class="w-[5rem] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="flex justify-center">
          <Pagination
            v-if="totalPages > 1"
            v-slot="{ page }"
            :items-per-page="itemsPerPage"
            :total="filteredStudents.length"
            :sibling-count="1"
            :show-edges="true"
            v-model:page="currentPage"
          >
            <PaginationContent v-slot="{ items }">
              <PaginationPrevious />

              <template v-for="(item, index) in items" :key="index">
                <PaginationEllipsis v-if="item.type === 'ellipsis'" :index="index" />
                <PaginationItem v-else :value="item.value" :is-active="item.value === page">
                  {{ item.value }}
                </PaginationItem>
              </template>

              <PaginationNext />
            </PaginationContent>
          </Pagination>
        </div>

        <p class="flex items-center justify-end text-sm text-muted-foreground whitespace-nowrap">
          Showing {{ (currentPage - 1) * itemsPerPage + 1 }}-{{
            Math.min(currentPage * itemsPerPage, filteredStudents.length)
          }}
          of {{ filteredStudents.length }}
        </p>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { Search } from 'lucide-vue-next'
import MainLayout from '@/layouts/MainLayout.vue'
import { useClassroomStore } from '@/stores/classrooms'
import { useAuthStore } from '@/stores/auth'
import { useNavigation } from '@/composables/useNavigation'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { classroomService, type StudentWithStats } from '@/services/api/classroom.service'
import type { ClassroomWithMemberCount } from '@/services/api/classroom.service'

const route = useRoute()
const classroomStore = useClassroomStore()
const authStore = useAuthStore()
const { selectedClassroomId } = useNavigation()

// Breadcrumbs
const breadcrumbs = [{ label: 'Students' }]

// State
const students = ref<StudentWithStats[]>([])
const classroom = ref<ClassroomWithMemberCount | null>(null)
const loading = ref(false)
const searchQuery = ref('')

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(25)
const itemsPerPageString = ref('25')

// Watch itemsPerPageString and convert to number
watch(itemsPerPageString, (newValue) => {
  itemsPerPage.value = parseInt(newValue)
  currentPage.value = 1
})

// Computed
const classroomId = computed(() => route.params.classroomId as string)

const filteredStudents = computed(() => {
  if (!searchQuery.value.trim()) {
    return students.value
  }

  const query = searchQuery.value.toLowerCase()
  return students.value.filter((student) => student.full_name.toLowerCase().includes(query))
})

const totalPages = computed(() => Math.ceil(filteredStudents.value.length / itemsPerPage.value))

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredStudents.value.slice(start, end)
})

// Methods
const fetchStudents = async () => {
  loading.value = true
  try {
    const data = await classroomService.getStudentsWithStats(classroomId.value)
    students.value = data
  } catch (error) {
    toast.error('Failed to fetch students')
    console.error('Failed to fetch students:', error)
  } finally {
    loading.value = false
  }
}

const fetchClassroom = async () => {
  try {
    const data = await classroomService.getClassroomById(classroomId.value)
    classroom.value = data
  } catch (error) {
    console.error('Failed to fetch classroom:', error)
  }
}

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Lifecycle
onMounted(async () => {
  await Promise.all([fetchStudents(), fetchClassroom()])
})
</script>
