# PeakMark Architecture Documentation

> Clean Architecture Implementation for Vue 3 + TypeScript + Supabase

**Last Updated:** October 16, 2025
**Version:** 2.1.0 (Post-Refactoring)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Principles](#architecture-principles)
3. [Layer Structure](#layer-structure)
4. [Data Flow](#data-flow)
5. [Directory Structure](#directory-structure)
6. [Component Patterns](#component-patterns)
7. [Testing Strategy](#testing-strategy)
8. [Best Practices](#best-practices)

---

## Overview

PeakMark follows a **clean architecture** pattern with clear separation of concerns. The application is organized into distinct layers, each with a single responsibility.

### Key Features

- ✅ Service layer for all API calls
- ✅ Composables for reusable logic
- ✅ Router guards for navigation control
- ✅ Centralized error handling
- ✅ Type-safe throughout
- ✅ Comprehensive test coverage

---

## Architecture Principles

### 1. Separation of Concerns

Each layer has a distinct responsibility:

- **Services**: Handle all API communication
- **Stores**: Manage application state
- **Composables**: Provide reusable reactive logic
- **Guards**: Control route access
- **Components**: Present UI and handle user interaction

### 2. Dependency Rule

Dependencies flow inward:

```
Components → Composables → Stores → Services → API
                ↓
            Utilities
```

**Key Rule:** Inner layers never depend on outer layers.

### 3. Single Responsibility

Each module, class, or function has one reason to change:

- Services only handle API calls
- Stores only manage state
- Components only handle presentation
- Guards only control access

### 4. DRY (Don't Repeat Yourself)

Common logic is extracted to:

- Utilities for pure functions
- Composables for reactive logic
- Base services for shared patterns

---

## Layer Structure

### 1. Service Layer (`src/services/`)

**Purpose:** Encapsulate all API communication

```
src/services/
├── api/
│   ├── base.service.ts          # Base class with common methods
│   ├── auth.service.ts           # Authentication API
│   ├── classroom.service.ts      # Classroom CRUD
│   ├── question.service.ts       # Question operations
│   ├── video.service.ts          # Video operations
│   ├── document.service.ts       # Document & folder management
│   ├── puzzle.service.ts         # Puzzle operations
│   ├── storage.service.ts        # File upload/download (Supabase Storage)
│   ├── profile.service.ts        # User profile
│   └── exp.service.ts            # Experience/leveling
└── permissions.service.ts        # Authorization logic
```

**Pattern:**

```typescript
export class BaseService {
  /**
   * Execute a query and return data with type safety
   * @throws AppError if the query fails
   */
  protected async query<T>(queryBuilder: Promise<PostgrestSingleResponse<T>>): Promise<T> {
    const { data, error } = await queryBuilder
    if (error) this.handleError(error)
    if (data === null) throw new AppError('No data returned from query', 'NO_DATA', 404)
    return data
  }

  /**
   * Execute an insert operation
   */
  protected async insert<T>(queryBuilder: Promise<PostgrestSingleResponse<T>>): Promise<T> {
    return this.query(queryBuilder)
  }

  /**
   * Execute an update operation
   */
  protected async update<T>(queryBuilder: Promise<PostgrestSingleResponse<T>>): Promise<T> {
    return this.query(queryBuilder)
  }

  /**
   * Execute a delete operation
   */
  protected async delete(queryBuilder: Promise<PostgrestSingleResponse<void>>): Promise<void> {
    const { error } = await queryBuilder
    if (error) this.handleError(error)
  }

  /**
   * Handle Supabase errors and convert to AppError
   */
  protected handleError(error: PostgrestError): never {
    return handleSupabaseError(error)
  }

  /**
   * Get the Supabase client instance
   */
  protected get client() {
    return supabase
  }
}

export class ClassroomService extends BaseService {
  async getClassroomById(id: string): Promise<Classroom> {
    const { data, error } = await this.client
      .from('classrooms')
      .select('*')
      .eq('id', id)
      .single()

    if (error) this.handleError(error)
    return data
  }
}

export const classroomService = new ClassroomService()
```

### 2. Store Layer (`src/stores/`)

**Purpose:** Manage application state using Pinia

```
src/stores/
├── auth.ts          # Authentication state
├── profile.ts       # User profile state
├── classrooms.ts    # Classroom state
├── questions.ts     # Question state
├── videos.ts        # Video state
├── documents.ts     # Document & folder state
└── puzzles.ts       # Puzzle state
```

**Pattern:**

```typescript
export const useClassroomStore = defineStore('classrooms', () => {
  // State
  const classrooms = ref<Classroom[]>([])
  const loading = ref(false)

  // Actions
  const fetchClassrooms = async (teacherId: string) => {
    loading.value = true
    try {
      const data = await classroomService.getTeacherClassrooms(teacherId)
      classrooms.value = data
    } finally {
      loading.value = false
    }
  }

  return { classrooms, loading, fetchClassrooms }
})
```

**Key Points:**
- Stores call services, never Supabase directly
- Stores manage state, not business logic
- No navigation logic in stores

### 3. Composable Layer (`src/composables/`)

**Purpose:** Reusable reactive logic

```
src/composables/
├── useNavigation.ts    # Navigation logic
├── usePermissions.ts   # Permission checks
├── useLevel.ts         # Level calculations
├── usePuzzle.ts        # Puzzle-related logic
└── useTheme.ts         # Theme management
```

**Pattern:**

```typescript
export function useNavigation() {
  const router = useRouter()
  const classroomStore = useClassroomStore()

  const goToClassroom = async (classroom: Classroom) => {
    await classroomStore.fetchStudentExp(userId, classroom.id)
    router.push({ name: 'dashboard', params: { classroomId: classroom.id } })
  }

  const navigationItems = computed(() => {
    // Compute navigation based on role and context
  })

  return { goToClassroom, navigationItems }
}
```

### 4. Router Guard Layer (`src/router/guards/`)

**Purpose:** Control route access and prefetch data

```
src/router/guards/
├── auth.guard.ts               # Authentication check
├── role.guard.ts               # Role-based access
├── classroom-access.guard.ts   # Classroom membership
├── classroom-data.guard.ts     # Data prefetching
└── index.ts                    # Guard composition
```

**Pattern:**

```typescript
export async function authGuard(to: RouteLocationNormalized) {
  const authStore = useAuthStore()

  if (authStore.loading) {
    await waitForAuthInit(authStore)
  }

  const requiresAuth = to.matched.some(r => r.meta.requiresAuth)

  if (requiresAuth && !authStore.user) {
    return { name: 'login-page' }
  }

  return true
}
```

**Composition:**

```typescript
// router/index.ts
router.beforeEach(composeGuards(
  authGuard,
  roleGuard,
  classroomAccessGuard,
))
```

### 5. Utility Layer (`src/utils/`)

**Purpose:** Pure functions and helpers

```
src/utils/
├── stats.ts                # Statistics calculations
├── errors.ts               # Error handling utilities
├── elo.ts                  # ELO rating calculations
└── crossword-generator.ts  # Crossword puzzle generation
```

**Pattern:**

```typescript
// Pure function - no side effects
export function calculateStudentStats(attempts: QuestionAttempt[]): StudentStats {
  const questionsAnswered = attempts.length
  const correctAnswers = attempts.filter(a => a.is_correct).length
  const accuracyRate = Math.round((correctAnswers / questionsAnswered) * 100)

  return { questionsAnswered, accuracyRate, studyStreak, setsCompleted }
}
```

### 6. Component Layer (`src/components/` & `src/views/`)

**Purpose:** Presentation and user interaction

**Component Types:**

1. **Presentational Components** - Pure UI, no logic
2. **Container Components** - Connect to stores/composables
3. **Layout Components** - Structure the page
4. **View Components** - Route-level components

**Pattern:**

```typescript
// Presentational
<script setup lang="ts">
const props = defineProps<{
  classroom: Classroom
}>()

const emit = defineEmits<{
  select: [classroom: Classroom]
}>()
</script>

// Container
<script setup lang="ts">
const { goToClassroom } = useNavigation()
const classroomStore = useClassroomStore()

const handleSelect = (classroom: Classroom) => {
  goToClassroom(classroom)
}
</script>
```

---

## Data Flow

### Request Flow (Read)

```
User Action → Component → Composable → Store → Service → API
                                                    ↓
User sees data ← Component ← Store updates ← Service returns
```

### State Update Flow (Write)

```
User submits → Component → Composable → Store action → Service
                                            ↓
                                    State updated
                                            ↓
                              UI automatically updates
```

### Error Flow

```
API Error → Service catches → handleSupabaseError() → AppError thrown
                                                            ↓
                                                Store catches → UI shows toast
```

---

## Directory Structure

```
src/
├── services/              # API communication layer
│   ├── api/               # Domain services
│   │   ├── __tests__/     # Service tests
│   │   ├── base.service.ts
│   │   ├── auth.service.ts
│   │   ├── classroom.service.ts
│   │   ├── question.service.ts
│   │   ├── video.service.ts
│   │   ├── document.service.ts
│   │   ├── puzzle.service.ts
│   │   ├── storage.service.ts
│   │   ├── profile.service.ts
│   │   └── exp.service.ts
│   └── permissions.service.ts
│
├── stores/                # State management (Pinia)
│   ├── auth.ts
│   ├── profile.ts
│   ├── classrooms.ts
│   ├── questions.ts
│   ├── videos.ts
│   ├── documents.ts
│   └── puzzles.ts
│
├── composables/           # Reusable reactive logic
│   ├── useNavigation.ts
│   ├── usePermissions.ts
│   ├── useLevel.ts
│   ├── usePuzzle.ts
│   └── useTheme.ts
│
├── router/                # Routing configuration
│   ├── guards/            # Route guards
│   │   ├── auth.guard.ts
│   │   ├── role.guard.ts
│   │   ├── classroom-access.guard.ts
│   │   ├── classroom-data.guard.ts
│   │   └── index.ts
│   └── index.ts
│
├── utils/                 # Pure utility functions
│   ├── __tests__/         # Utility tests
│   ├── stats.ts
│   ├── errors.ts
│   ├── elo.ts
│   └── crossword-generator.ts
│
├── components/            # Reusable components
│   ├── ui/                # Base UI components
│   ├── AppSidebar.vue
│   └── ThemeToggle.vue
│
├── views/                 # Route-level components
│   ├── wrappers/          # Wrapper components for role-based routing
│   │   ├── ClassroomsPageWrapper.vue
│   │   ├── DashboardPageWrapper.vue
│   │   ├── VideosPageWrapper.vue
│   │   ├── DocumentsPageWrapper.vue
│   │   ├── PuzzlesPageWrapper.vue
│   │   └── ClassroomSettingsPageWrapper.vue
│   ├── LoginPage.vue
│   ├── RegisterPage.vue
│   ├── LandingPage.vue
│   ├── TeacherClassroomsPage.vue
│   ├── StudentClassroomsPage.vue
│   ├── TeacherQuestionsPage.vue
│   ├── TeacherVideosPage.vue
│   ├── StudentVideosPage.vue
│   ├── TeacherDocumentsPage.vue
│   ├── StudentDocumentsPage.vue
│   ├── TeacherPuzzlesPage.vue
│   ├── PuzzleSolvePage.vue
│   └── AdminDashboardPage.vue
│
├── layouts/               # Layout components
│   ├── MainLayout.vue
│   └── ClassroomSelectionLayout.vue
│
├── types/                 # TypeScript types
│   └── database.types.ts
│
└── config/                # Configuration files
    └── navigation.ts
```

---

## Component Patterns

### 1. Composable Usage

```vue
<script setup lang="ts">
import { useNavigation } from '@/composables/useNavigation'
import { usePermissions } from '@/composables/usePermissions'

const { goToClassroom, navigationItems } = useNavigation()
const { isTeacher, canAccessClassroom } = usePermissions()
</script>
```

### 2. Store Usage

```vue
<script setup lang="ts">
import { useClassroomStore } from '@/stores/classrooms'

const classroomStore = useClassroomStore()

onMounted(async () => {
  await classroomStore.fetchClassrooms(userId)
})
</script>
```

### 3. Error Handling

```vue
<script setup lang="ts">
import { getErrorMessage } from '@/utils/errors'
import { toast } from 'vue-sonner'

const handleSubmit = async () => {
  try {
    await classroomStore.createClassroom(data)
    toast.success('Classroom created!')
  } catch (error) {
    toast.error(getErrorMessage(error))
  }
}
</script>
```

---

## Testing Strategy

### Test Coverage

- **Utilities:** 38 tests (100% coverage)
- **Services:** 20 tests (core CRUD operations)
- **Total:** 59 passing tests

### Test Structure

```
src/
├── utils/__tests__/
│   ├── stats.test.ts
│   └── errors.test.ts
├── services/api/__tests__/
│   ├── classroom.service.test.ts
│   └── profile.service.test.ts
└── __tests__/
    └── App.spec.ts
```

### Testing Patterns

**Utility Tests:**
```typescript
describe('calculateStudentStats', () => {
  it('should calculate accuracy rate correctly', () => {
    const attempts = [
      { is_correct: true, created_at: '2025-01-01' },
      { is_correct: false, created_at: '2025-01-01' },
    ]

    const result = calculateStudentStats(attempts)

    expect(result.accuracyRate).toBe(50)
  })
})
```

**Service Tests:**
```typescript
describe('ClassroomService', () => {
  it('should fetch classrooms for a teacher', async () => {
    const mockData = [{ id: '1', name: 'Math 101' }]
    vi.mocked(supabase.from).mockReturnValue(mockQueryBuilder)

    const result = await classroomService.getTeacherClassrooms('teacher-1')

    expect(result).toEqual(mockData)
  })
})
```

---

## Best Practices

### 1. Service Layer

✅ **DO:**
- Use singleton pattern (`export const service = new Service()`)
- Extend `BaseService` for common functionality
- Handle all errors with `handleError()`
- Return typed data

❌ **DON'T:**
- Call Supabase from outside services
- Mix business logic with API calls
- Ignore error handling

### 2. Stores

✅ **DO:**
- Use composition API (`defineStore` with setup function)
- Keep actions simple (call services, update state)
- Use computed for derived state
- Clear state on logout

❌ **DON'T:**
- Put navigation logic in stores
- Call Supabase directly
- Mix multiple concerns

### 3. Components

✅ **DO:**
- Use composables for reusable logic
- Keep components focused and small
- Use TypeScript for props and emits
- Handle loading and error states

❌ **DON'T:**
- Call services directly from components
- Put business logic in components
- Fetch data in layout components

### 4. Composables

✅ **DO:**
- Return reactive values with computed/ref
- Group related functionality
- Make them reusable
- Use TypeScript

❌ **DON'T:**
- Make composables too large
- Mix unrelated concerns
- Forget to return values

### 5. Error Handling

✅ **DO:**
- Use `AppError` for custom errors
- Provide user-friendly messages
- Log errors for debugging
- Show toast notifications

❌ **DON'T:**
- Expose technical errors to users
- Ignore errors silently
- Use generic error messages

---

## Migration Guide

### Adding a New Feature

1. **Create Service Method** (if needs API)
   ```typescript
   // src/services/api/feature.service.ts
   export class FeatureService extends BaseService {
     async getFeature(id: string): Promise<Feature> {
       // implementation
     }
   }
   ```

2. **Add Store Actions** (if needs state)
   ```typescript
   // src/stores/feature.ts
   export const useFeatureStore = defineStore('feature', () => {
     const features = ref<Feature[]>([])

     const fetchFeatures = async () => {
       const data = await featureService.getFeatures()
       features.value = data
     }

     return { features, fetchFeatures }
   })
   ```

3. **Create Composable** (if needs reusable logic)
   ```typescript
   // src/composables/useFeature.ts
   export function useFeature() {
     const featureStore = useFeatureStore()
     // Add reactive logic
     return { /* ... */ }
   }
   ```

4. **Add Tests**
   ```typescript
   // src/services/api/__tests__/feature.service.test.ts
   describe('FeatureService', () => {
     it('should fetch features', async () => {
       // test implementation
     })
   })
   ```

5. **Use in Component**
   ```vue
   <script setup lang="ts">
   import { useFeature } from '@/composables/useFeature'
   const { features, loading } = useFeature()
   </script>
   ```

---

## Service Layer Deep Dive

### Storage Service

The `StorageService` handles file uploads/downloads using Supabase Storage.

**Key Features:**
- Upload question images (max 5MB)
- Upload documents (max 10MB)
- Delete files from storage
- Get public URLs for files

**Example:**
```typescript
// Upload an image
const imageUrl = await storageService.uploadQuestionImage(file, classroomId, questionId)

// Delete an image
await storageService.deleteQuestionImage(imageUrl)

// Upload a document
const docUrl = await storageService.uploadDocument(file, classroomId, documentId)
```

### Document Service

The `DocumentService` manages documents and folders with hierarchical structure.

**Key Features:**
- Create/update/delete documents and folders
- Get documents by classroom and parent folder
- Get folder breadcrumb path
- Get all descendants of a folder

**Example:**
```typescript
// Get documents in a folder
const documents = await documentService.getDocumentsByClassroom(classroomId, parentId)

// Create a folder
const folder = await documentService.createFolder('My Folder', classroomId, userId, parentId)

// Get folder path (breadcrumbs)
const path = await documentService.getFolderPath(folderId)

// Get all descendants
const descendants = await documentService.getFolderDescendants(folderId)
```

### Puzzle Service

The `PuzzleService` handles crossword puzzle CRUD operations.

**Key Features:**
- Create/update/delete puzzles
- Get puzzles by classroom
- Get student-accessible puzzles

**Example:**
```typescript
// Get puzzles in a classroom
const puzzles = await puzzleService.getPuzzlesByClassroom(classroomId)

// Create a puzzle
const puzzle = await puzzleService.createPuzzle({
  classroom_id: classroomId,
  title: 'Math Puzzle',
  grid: crosswordGrid,
  clues: cluesData,
})

// Get student's available puzzles
const studentPuzzles = await puzzleService.getStudentPuzzles(studentId)
```

---

## Utility Deep Dive

### Crossword Generator

The `crossword-generator.ts` utility generates crossword puzzles from word lists.

**Features:**
- Generates crossword grids from word entries
- Automatic word placement algorithm
- Centers the puzzle in the grid
- Returns placed words with clues and positions

**Example:**
```typescript
import { generateCrossword, type WordEntry } from '@/utils/crossword-generator'

const words: WordEntry[] = [
  { id: '1', answer: 'PYTHON', clue: 'A programming language' },
  { id: '2', answer: 'CODE', clue: 'What developers write' },
  { id: '3', answer: 'DEBUG', clue: 'Fix errors' },
]

const result = generateCrossword(words, 15, 12345) // gridSize, seed

console.log(result.grid)          // string[][]
console.log(result.placedWords)   // PlacedWord[]
console.log(result.unusedWords)   // WordEntry[]
```

### ELO Rating System

The `elo.ts` utility implements ELO rating calculations for competitive features.

**Features:**
- Calculate rating changes based on match results
- Configurable K-factor
- Expected score calculation

---

## Conclusion

PeakMark's architecture follows industry best practices with clear separation of concerns, making it:

- ✅ **Maintainable**: Easy to understand and modify
- ✅ **Testable**: Each layer can be tested independently
- ✅ **Scalable**: Easy to add new features
- ✅ **Type-safe**: Full TypeScript support
- ✅ **Production-ready**: Tested and validated

For questions or contributions, please refer to the REFACTORING_PLAN.md for detailed implementation notes.

---

*Architecture v2.1.0 - Updated October 16, 2025*

## References

- Vue 3 Composition API: https://vuejs.org/guide/extras/composition-api-faq.html
- Pinia Best Practices: https://pinia.vuejs.org/core-concepts/
- Vue Router Guards: https://router.vuejs.org/guide/advanced/navigation-guards.html
- TypeScript Best Practices: https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html