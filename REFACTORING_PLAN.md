# PeakMark Refactoring Plan

## Executive Summary

This document outlines a comprehensive refactoring plan to improve separation of concerns and architectural patterns in the PeakMark application. The refactoring will introduce proper abstraction layers, extract business logic from inappropriate locations, and establish clear boundaries between different parts of the application.

**Estimated Time:** 3-4 days for complete refactoring
**Risk Level:** Medium (requires careful migration and testing)
**Impact:** High (improved maintainability, testability, and scalability)

---

## Current Architecture Problems

### 1. Missing Service Layer
- **Problem:** Stores directly call Supabase API
- **Impact:** Tight coupling, difficult to test, hard to swap data sources
- **Files Affected:** All store files

### 2. Business Logic in Router
- **Problem:** Complex auth/permission logic in route guards
- **Impact:** Router file becomes bloated, logic not reusable
- **Files Affected:** `src/router/index.ts`

### 3. Mixed Responsibilities in Stores
- **Problem:** Stores handle state + API calls + navigation + permissions
- **Impact:** Violates Single Responsibility Principle
- **Files Affected:** `src/stores/classrooms.ts`, `src/stores/profile.ts`

### 4. Data Fetching in Layout Components
- **Problem:** Layout components fetch data on mount
- **Impact:** Layouts should be presentational only
- **Files Affected:** `src/layouts/MainLayout.vue`

### 5. Business Logic in Presentational Components
- **Problem:** Components compute navigation and business rules
- **Impact:** Hard to test, not reusable
- **Files Affected:** `src/components/AppSidebar.vue`

---

## Phase 1: Create Service Layer

### Step 1.1: Create Base API Service

**File:** `src/services/api/base.service.ts`

```typescript
/**
 * Base service class with common API methods
 * Provides error handling, type safety, and consistent patterns
 */
export class BaseService {
  protected async query<T>(...): Promise<T>
  protected async insert<T>(...): Promise<T>
  protected async update<T>(...): Promise<T>
  protected async delete(...): Promise<void>
  protected handleError(error: PostgrestError): never
}
```

**Purpose:**
- Centralize Supabase error handling
- Provide type-safe query methods
- Reduce code duplication

**Dependencies:**
- `@/lib/supabaseClient`
- `@/types/database.types`

---

### Step 1.2: Create Domain Services

#### **File:** `src/services/api/auth.service.ts`

```typescript
/**
 * Authentication service
 * Handles all auth-related API calls
 */
export class AuthService {
  async signUp(email, password, metadata): Promise<void>
  async signIn(email, password): Promise<void>
  async signOut(): Promise<void>
  async getSession(): Promise<Session | null>
  onAuthStateChange(callback): Subscription
}

export const authService = new AuthService()
```

**Migration Steps:**
1. Create service file
2. Move methods from `src/stores/auth.ts:44-94`
3. Update store to call service methods
4. Test authentication flow
5. Remove old Supabase calls from store

**Affected Files:**
- **Extract from:** `src/stores/auth.ts`
- **Benefits:** Auth logic becomes testable, can add retry logic, logging

---

#### **File:** `src/services/api/classroom.service.ts`

```typescript
/**
 * Classroom service
 * Handles all classroom-related API operations
 */
export class ClassroomService {
  async getTeacherClassrooms(teacherId: string): Promise<ClassroomWithMemberCount[]>
  async getStudentClassrooms(studentId: string): Promise<ClassroomWithMemberCount[]>
  async getClassroomById(id: string): Promise<Classroom | null>
  async createClassroom(data: ClassroomInsert): Promise<Classroom>
  async updateClassroom(id: string, updates: ClassroomUpdate): Promise<Classroom>
  async deleteClassroom(id: string): Promise<void>
  async getClassroomMembers(classroomId: string): Promise<ClassroomMember[]>
  async addMember(classroomId: string, studentId: string): Promise<ClassroomMember>
  async removeMember(classroomId: string, studentId: string): Promise<void>
  async checkMembership(classroomId: string, studentId: string): Promise<boolean>
}

export const classroomService = new ClassroomService()
```

**Migration Steps:**
1. Create service file with all CRUD operations
2. Move API calls from `src/stores/classrooms.ts:33-291`
3. Keep only state management in store
4. Update store actions to call service
5. Test all classroom operations

**Affected Store Methods:**
- `fetchTeacherClassrooms` (line 33)
- `fetchStudentClassrooms` (line 64)
- `createClassroom` (line 99)
- `updateClassroom` (line 124)
- `deleteClassroom` (line 153)
- `joinClassroom` (line 170)
- `leaveClassroom` (line 243)
- `fetchClassroomMembers` (line 264)

---

#### **File:** `src/services/api/question.service.ts`

```typescript
/**
 * Question service
 * Handles question CRUD operations
 */
export class QuestionService {
  async getQuestions(classroomId: string): Promise<Question[]>
  async getQuestionById(id: string): Promise<Question | null>
  async createQuestion(data: QuestionInsert): Promise<Question>
  async updateQuestion(id: string, updates: QuestionUpdate): Promise<Question>
  async deleteQuestion(id: string): Promise<void>
  async getQuestionsByDifficulty(classroomId: string, difficulty: number): Promise<Question[]>
  async recordAttempt(data: QuestionAttemptInsert): Promise<QuestionAttempt>
}

export const questionService = new QuestionService()
```

**Migration Steps:**
1. Create service file
2. Move all API calls from `src/stores/questions.ts`
3. Update store to use service
4. Add methods for question attempts (for future use)

**Affected Store Methods:**
- All methods in `src/stores/questions.ts:16-127`

---

#### **File:** `src/services/api/video.service.ts`

```typescript
/**
 * Video service
 * Handles video CRUD and retrieval operations
 */
export class VideoService {
  async getVideos(): Promise<Video[]>
  async getVideoById(id: string): Promise<Video | null>
  async getStudentVideos(studentId: string): Promise<Video[]>
  async getVideosBySubjectYear(subject: string, year: string): Promise<Video[]>
  async createVideo(data: VideoInsert): Promise<Video>
  async updateVideo(id: string, updates: VideoUpdate): Promise<Video>
  async deleteVideo(id: string): Promise<void>
}

export const videoService = new VideoService()
```

**Migration Steps:**
1. Create service file
2. Move API calls from `src/stores/videos.ts:16-191`
3. Update store to use service

---

#### **File:** `src/services/api/profile.service.ts`

```typescript
/**
 * User profile service
 * Handles user profile and statistics operations
 */
export class ProfileService {
  async getUserProfile(userId: string): Promise<UserRow>
  async updateUserProfile(userId: string, updates: Partial<UserRow>): Promise<UserRow>
  async getStudentStatistics(userId: string): Promise<StudentStats>
  async getStudentExp(studentId: string, classroomId: string): Promise<ExpRow | null>
  async updateStudentExp(studentId: string, classroomId: string, exp: number): Promise<ExpRow>
  async getQuestionAttempts(userId: string): Promise<QuestionAttempt[]>
}

export const profileService = new ProfileService()
```

**Migration Steps:**
1. Create service file
2. Move `fetchUserProfile` logic (line 42)
3. Move `fetchStudentStats` logic (line 62)
4. Extract stats calculation to separate utility
5. Update store to use service

**Special Note:**
- Stats calculation logic (lines 86-132) should move to `src/utils/stats.ts`

---

### Step 1.3: Create Experience/Level Service

#### **File:** `src/services/api/exp.service.ts`

```typescript
/**
 * Experience and leveling service
 * Handles student experience points and classroom-specific exp
 */
export class ExpService {
  async getStudentExp(studentId: string, classroomId: string): Promise<ExpRow | null>
  async createStudentExp(studentId: string, classroomId: string): Promise<ExpRow>
  async updateStudentExp(studentId: string, classroomId: string, exp: number): Promise<ExpRow>
  async addExpToStudent(studentId: string, classroomId: string, expToAdd: number): Promise<ExpRow>
}

export const expService = new ExpService()
```

**Migration Steps:**
1. Create service file
2. Extract from `src/stores/classrooms.ts:314-360`
3. Update classroom store to use service
4. Update `useLevel` composable to use service if needed

---

## Phase 2: Create Permission/Authorization Layer

### Step 2.1: Create Permissions Service

#### **File:** `src/services/permissions.service.ts`

```typescript
/**
 * Permission and authorization service
 * Centralizes all access control logic
 */
export class PermissionsService {
  // Classroom permissions
  async canAccessClassroom(userId: string, classroomId: string, role: UserRole): Promise<boolean>
  async canManageClassroom(userId: string, classroomId: string): Promise<boolean>
  async canManageQuestions(userId: string, classroomId: string): Promise<boolean>
  async canManageVideos(userId: string, classroomId: string): Promise<boolean>
  async canViewStudents(userId: string, classroomId: string): Promise<boolean>

  // Route permissions
  hasRouteAccess(route: RouteLocationNormalized, user: User | null): boolean
  hasRoleAccess(requiredRoles: string[], userRole: string): boolean

  // Resource permissions
  canEditResource(userId: string, resourceOwnerId: string): boolean
  canDeleteResource(userId: string, resourceOwnerId: string, userRole: string): boolean
}

export const permissionsService = new PermissionsService()
```

**Migration Steps:**
1. Create service file
2. Move `hasAccessToClassroom` from `src/stores/classrooms.ts:363-396`
3. Extract role checking logic from router
4. Add methods for future permissions needs
5. Update router guards to use this service
6. Remove permission logic from stores

**Benefits:**
- Single source of truth for permissions
- Easy to add new permission rules
- Testable in isolation
- Can add caching for performance

---

### Step 2.2: Create Permission Composable

#### **File:** `src/composables/usePermissions.ts`

```typescript
/**
 * Permissions composable
 * Provides reactive permission checks in components
 */
export function usePermissions() {
  const authStore = useAuthStore()

  const isTeacher = computed(() => authStore.user?.user_metadata?.role === 'teacher')
  const isStudent = computed(() => authStore.user?.user_metadata?.role === 'student')
  const isAdmin = computed(() => authStore.user?.user_metadata?.role === 'admin')

  const canAccessClassroom = async (classroomId: string): Promise<boolean> => {
    // Uses permissionsService
  }

  const hasRole = (roles: string[]): boolean => {
    // Check if user has one of the specified roles
  }

  return {
    isTeacher,
    isStudent,
    isAdmin,
    canAccessClassroom,
    hasRole,
  }
}
```

**Purpose:**
- Make permissions reactive in components
- Simplify permission checks in templates
- Centralize permission logic

---

## Phase 3: Extract Route Guards

### Step 3.1: Create Route Guard Utilities

#### **File:** `src/router/guards/auth.guard.ts`

```typescript
/**
 * Authentication guard
 * Ensures user is authenticated before accessing protected routes
 */
export async function authGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
): Promise<boolean | RouteLocationRaw> {
  const authStore = useAuthStore()

  // Wait for auth initialization
  if (authStore.loading) {
    await waitForAuthInit(authStore)
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  if (requiresAuth && !authStore.user) {
    return { name: 'login-page' }
  }

  return true
}
```

**Migration Steps:**
1. Create guard file
2. Extract auth logic from `src/router/index.ts:71-106`
3. Handle loading state properly
4. Add to router guards

---

#### **File:** `src/router/guards/role.guard.ts`

```typescript
/**
 * Role-based access control guard
 * Checks if user has required role for the route
 */
export async function roleGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
): Promise<boolean | RouteLocationRaw> {
  const authStore = useAuthStore()
  const requiredRoles = to.meta.role as string[] | undefined

  if (!requiredRoles || !requiredRoles.length) {
    return true
  }

  const userRole = authStore.user?.user_metadata?.role

  if (!userRole) {
    return { name: 'login-page' }
  }

  if (!requiredRoles.includes(userRole)) {
    return { name: 'classrooms' }
  }

  return true
}
```

**Migration Steps:**
1. Create guard file
2. Extract role logic from `src/router/index.ts:108-125`
3. Use `permissionsService.hasRoleAccess`
4. Add to router guards

---

#### **File:** `src/router/guards/classroom-access.guard.ts`

```typescript
/**
 * Classroom access guard
 * Verifies user has access to the classroom in the route
 */
export async function classroomAccessGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
): Promise<boolean | RouteLocationRaw> {
  const authStore = useAuthStore()
  const classroomId = to.params.classroomId as string | undefined

  if (!classroomId) {
    return true
  }

  const user = authStore.user
  if (!user || !user.user_metadata?.role) {
    return { name: 'login-page' }
  }

  const hasAccess = await permissionsService.canAccessClassroom(
    user.id,
    classroomId,
    user.user_metadata.role,
  )

  if (!hasAccess) {
    return { name: 'classrooms' }
  }

  return true
}
```

**Migration Steps:**
1. Create guard file
2. Extract classroom access logic from `src/router/index.ts:127-140`
3. Use `permissionsService.canAccessClassroom`
4. Add to router guards

---

#### **File:** `src/router/guards/index.ts`

```typescript
/**
 * Guard composition and utilities
 * Exports all guards and helper functions
 */
export { authGuard } from './auth.guard'
export { roleGuard } from './role.guard'
export { classroomAccessGuard } from './classroom-access.guard'

/**
 * Compose multiple guards into a single guard function
 */
export function composeGuards(
  ...guards: NavigationGuard[]
): NavigationGuard {
  return async (to, from) => {
    for (const guard of guards) {
      const result = await guard(to, from, () => {})
      if (result !== true) {
        return result
      }
    }
    return true
  }
}
```

---

### Step 3.2: Update Router Configuration

#### **File:** `src/router/index.ts` (Refactored)

```typescript
import { authGuard, roleGuard, classroomAccessGuard, composeGuards } from './guards'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [/* ... routes ... */]
})

// Apply guards in order: auth -> role -> classroom access
router.beforeEach(composeGuards(
  authGuard,
  roleGuard,
  classroomAccessGuard,
))

export default router
```

**Benefits:**
- Router file becomes clean and declarative
- Guards are testable in isolation
- Easy to add/remove/reorder guards
- Each guard has single responsibility

---

## Phase 4: Refactor Stores (State Management Only)

### Step 4.1: Update Auth Store

#### **File:** `src/stores/auth.ts` (Refactored)

**Changes:**
1. Remove direct Supabase calls
2. Call `authService` methods instead
3. Keep only state and state updates

**Before:**
```typescript
const signUp = async (email, password, metaData) => {
  loading.value = true
  const { error } = await supabase.auth.signUp(...)
  // ...
}
```

**After:**
```typescript
const signUp = async (email, password, metaData) => {
  loading.value = true
  try {
    await authService.signUp(email, password, metaData)
  } catch (error) {
    // handle error
  } finally {
    loading.value = false
  }
}
```

---

### Step 4.2: Update Classroom Store

#### **File:** `src/stores/classrooms.ts` (Refactored)

**Major Changes:**
1. Remove `router` import and usage (lines 18-19)
2. Remove `selectClassroom` and `clearSelection` methods (lines 404-415)
3. Remove `hasAccessToClassroom` method (lines 363-396)
4. Replace all Supabase calls with service calls
5. Move exp methods to separate concern

**Methods to Remove:**
- `selectClassroom` → Move to navigation composable
- `clearSelection` → Move to navigation composable
- `hasAccessToClassroom` → Moved to permissions service

**Methods to Update:**
```typescript
// Before
const fetchTeacherClassrooms = async (teacherId: string) => {
  loading.value = true
  const { data, error } = await supabase.from('classrooms')...
  teacherClassrooms.value = data
}

// After
const fetchTeacherClassrooms = async (teacherId: string) => {
  loading.value = true
  try {
    const data = await classroomService.getTeacherClassrooms(teacherId)
    teacherClassrooms.value = data
  } catch (error) {
    handleError(error)
  } finally {
    loading.value = false
  }
}
```

---

### Step 4.3: Update Question Store

**File:** `src/stores/questions.ts` (Refactored)

**Changes:**
- Replace all Supabase calls with `questionService` calls
- Keep pattern consistent with other stores

---

### Step 4.4: Update Video Store

**File:** `src/stores/videos.ts` (Refactored)

**Changes:**
- Replace all Supabase calls with `videoService` calls
- Keep pattern consistent with other stores

---

### Step 4.5: Update Profile Store

**File:** `src/stores/profile.ts` (Refactored)

**Major Changes:**
1. Move stats calculation to `src/utils/stats.ts`
2. Replace Supabase calls with `profileService` calls
3. Simplify `fetchStudentStats` method

**Extract to Utility:**
```typescript
// src/utils/stats.ts
export function calculateStudentStats(attempts: QuestionAttempt[]): StudentStats {
  // Move calculation logic from lines 86-132
}
```

---

## Phase 5: Create Navigation Composable

### Step 5.1: Create Navigation Composable

#### **File:** `src/composables/useNavigation.ts`

```typescript
/**
 * Navigation composable
 * Handles programmatic navigation and route logic
 */
export function useNavigation() {
  const router = useRouter()
  const classroomStore = useClassroomStore()
  const authStore = useAuthStore()

  // Navigate to classroom dashboard
  const goToClassroom = async (classroom: Classroom, userId?: string) => {
    if (userId) {
      await classroomStore.fetchStudentExp(userId, classroom.id)
    }
    router.push({
      name: 'dashboard',
      params: { classroomId: classroom.id },
    })
  }

  // Navigate to classroom selection
  const goToClassroomSelection = () => {
    router.push({ name: 'classrooms' })
  }

  // Navigate to login
  const goToLogin = () => {
    router.push({ name: 'login-page' })
  }

  // Logout and redirect
  const logout = async () => {
    await authStore.signOut()
    router.push({ name: 'login-page' })
  }

  // Computed navigation items based on role and classroom
  const navigationItems = computed(() => {
    const role = authStore.user?.user_metadata?.role as 'student' | 'teacher' | 'admin'
    const baseNav = roleNavigation[role] || roleNavigation.student
    const classroomId = classroomStore.selectedClassroomId

    if (!classroomId) {
      return baseNav.map(group => ({
        ...group,
        items: group.items.map(item => ({
          ...item,
          url: item.url === '/settings' ? item.url : '/classrooms',
        })),
      }))
    }

    return baseNav.map(group => ({
      ...group,
      items: group.items.map(item => ({
        ...item,
        url: item.url.replace(/^\//, `/classroom/${classroomId}/`),
      })),
    }))
  })

  return {
    goToClassroom,
    goToClassroomSelection,
    goToLogin,
    logout,
    navigationItems,
  }
}
```

**Purpose:**
- Remove navigation from stores
- Centralize routing logic
- Make navigation reusable across components

**Migration:**
- Move `selectClassroom` from `src/stores/classrooms.ts:404-410`
- Move `clearSelection` from `src/stores/classrooms.ts:413-415`
- Move navigation computation from `src/components/AppSidebar.vue:170-194`

---

## Phase 6: Refactor Components

### Step 6.1: Update AppSidebar Component

#### **File:** `src/components/AppSidebar.vue` (Refactored)

**Changes:**
1. Remove navigation computation (lines 170-194)
2. Use `useNavigation` composable
3. Use `usePermissions` for role checks

**Before:**
```typescript
const navigation = computed(() => {
  const role = userRole.value
  const baseNav = roleNavigation[role]
  // ... complex logic
})

const handleSignOut = async () => {
  await authStore.signOut()
  router.push('/login')
}
```

**After:**
```typescript
const { navigationItems, logout } = useNavigation()

const navigation = navigationItems
const handleSignOut = logout
```

**Benefits:**
- Component becomes purely presentational
- Logic is reusable
- Easier to test

---

### Step 6.2: Update MainLayout Component

#### **File:** `src/layouts/MainLayout.vue` (Refactored)

**Changes:**
1. Remove data fetching from `onMounted` (lines 98-119)
2. Move data fetching to route-level components or guards
3. Keep only presentational logic

**Option A: Move to Route Guard**
Create a new guard that prefetches classroom data:

```typescript
// src/router/guards/classroom-data.guard.ts
export async function classroomDataGuard(to, from) {
  const authStore = useAuthStore()
  const classroomStore = useClassroomStore()
  const classroomId = to.params.classroomId

  if (!classroomId || !authStore.user) return true

  const role = authStore.user.user_metadata?.role

  if (role === 'student') {
    if (classroomStore.studentClassrooms.length === 0) {
      await classroomStore.fetchStudentClassrooms(authStore.user.id)
    }
    await classroomStore.fetchStudentExp(authStore.user.id, classroomId)
  } else if (role === 'teacher') {
    if (classroomStore.teacherClassrooms.length === 0) {
      await classroomStore.fetchTeacherClassrooms(authStore.user.id)
    }
  }

  return true
}
```

**Option B: Move to Route Component**
Each route component (`QuestionsPage`, `VideosPage`, etc.) fetches its own data.

**Recommendation:** Use Option A for classroom data that's needed across all routes.

---

### Step 6.3: Update View Components

**Files to Update:**
- `src/views/TeacherClassroomsPage.vue`
- `src/views/StudentClassroomsPage.vue`
- `src/views/QuestionsPage.vue`
- And other views...

**Changes:**
1. Use `useNavigation` composable instead of direct router/store manipulation
2. Use `usePermissions` for permission checks
3. Keep data fetching in views (this is appropriate)

**Example:**
```typescript
// Before
const selectClassroom = (classroom) => {
  classroomStore.selectClassroom(classroom)
}

// After
const { goToClassroom } = useNavigation()
const selectClassroom = (classroom) => {
  goToClassroom(classroom, authStore.user?.id)
}
```

---

## Phase 7: Create Utility Modules

### Step 7.1: Stats Calculation Utility

#### **File:** `src/utils/stats.ts`

```typescript
/**
 * Student statistics calculation utilities
 */

export interface QuestionAttempt {
  is_correct: boolean
  created_at: string
}

export interface StudentStats {
  questionsAnswered: number
  accuracyRate: number
  studyStreak: number
  setsCompleted: number
}

/**
 * Calculate student statistics from question attempts
 */
export function calculateStudentStats(attempts: QuestionAttempt[]): StudentStats {
  if (!attempts || attempts.length === 0) {
    return {
      questionsAnswered: 0,
      accuracyRate: 0,
      studyStreak: 0,
      setsCompleted: 0,
    }
  }

  const questionsAnswered = attempts.length
  const correctAnswers = attempts.filter(a => a.is_correct).length
  const accuracyRate = Math.round((correctAnswers / questionsAnswered) * 100)
  const studyStreak = calculateStudyStreak(attempts)

  return {
    questionsAnswered,
    accuracyRate,
    studyStreak,
    setsCompleted: 0, // TODO: Implement when practice sets are added
  }
}

/**
 * Calculate consecutive study streak in days
 */
function calculateStudyStreak(attempts: QuestionAttempt[]): number {
  const uniqueDates = [
    ...new Set(attempts.map(a => new Date(a.created_at).toDateString()))
  ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  if (uniqueDates.length === 0) return 0

  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()

  // Only count streak if activity is today or yesterday
  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
    return 0
  }

  let streak = 1
  for (let i = 1; i < uniqueDates.length; i++) {
    const currentDate = new Date(uniqueDates[i - 1])
    const prevDate = new Date(uniqueDates[i])
    const diffTime = currentDate.getTime() - prevDate.getTime()
    const diffDays = Math.round(diffTime / 86400000)

    if (diffDays === 1) {
      streak++
    } else {
      break
    }
  }

  return streak
}
```

**Migration:**
- Extract from `src/stores/profile.ts:86-132`
- Update `profileService` to use this utility

---

### Step 7.2: Error Handling Utility

#### **File:** `src/utils/errors.ts`

```typescript
/**
 * Error handling utilities
 * Provides consistent error handling and user-friendly messages
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

/**
 * Convert API errors to user-friendly messages
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return (error as Error).message
  }

  return 'An unexpected error occurred. Please try again.'
}

/**
 * Handle Supabase errors
 */
export function handleSupabaseError(error: PostgrestError): never {
  throw new AppError(
    error.message,
    error.code,
    parseInt(error.code) || 500,
  )
}
```

**Purpose:**
- Consistent error handling across services
- User-friendly error messages
- Easier debugging

---

## Phase 8: Testing Strategy

### Step 8.1: Service Layer Tests

Create unit tests for each service:

```typescript
// Example: src/services/api/__tests__/classroom.service.test.ts
describe('ClassroomService', () => {
  describe('getTeacherClassrooms', () => {
    it('should fetch classrooms for a teacher')
    it('should handle errors gracefully')
    it('should include member counts')
  })

  describe('createClassroom', () => {
    it('should create a new classroom')
    it('should validate required fields')
  })
})
```

**Tools:**
- Vitest (already in package.json)
- Mock Supabase client
- Test data fixtures

---

### Step 8.2: Guard Tests

Test each guard in isolation:

```typescript
// Example: src/router/guards/__tests__/auth.guard.test.ts
describe('authGuard', () => {
  it('should allow access to public routes')
  it('should redirect to login for protected routes when not authenticated')
  it('should allow access to protected routes when authenticated')
  it('should wait for auth initialization')
})
```

---

### Step 8.3: Store Tests

Test stores with mocked services:

```typescript
// Example: src/stores/__tests__/auth.test.ts
describe('Auth Store', () => {
  it('should initialize with null user')
  it('should update user state after sign in')
  it('should clear user state after sign out')
  it('should handle errors')
})
```

---

## Phase 9: Migration Checklist

### Pre-Migration
- [ ] Create feature branch: `refactor/separation-of-concerns`
- [ ] Backup current working code
- [ ] Document any pending features/bugs
- [ ] Inform team of upcoming changes

### Phase 1: Services (Day 1)
- [ ] Create `src/services/api/` directory
- [ ] Implement `base.service.ts`
- [ ] Implement `auth.service.ts`
- [ ] Implement `classroom.service.ts`
- [ ] Implement `question.service.ts`
- [ ] Implement `video.service.ts`
- [ ] Implement `profile.service.ts`
- [ ] Implement `exp.service.ts`
- [ ] Write service unit tests
- [ ] Test services independently

### Phase 2: Permissions (Day 1-2)
- [ ] Create `src/services/permissions.service.ts`
- [ ] Implement all permission methods
- [ ] Create `src/composables/usePermissions.ts`
- [ ] Write permission tests
- [ ] Test permission logic

### Phase 3: Guards (Day 2)
- [ ] Create `src/router/guards/` directory
- [ ] Implement `auth.guard.ts`
- [ ] Implement `role.guard.ts`
- [ ] Implement `classroom-access.guard.ts`
- [ ] Implement `classroom-data.guard.ts` (optional)
- [ ] Create guard composition utility
- [ ] Write guard unit tests
- [ ] Update router configuration
- [ ] Test all route transitions

### Phase 4: Stores (Day 2-3)
- [ ] Update `auth.ts` to use auth service
- [ ] Update `classrooms.ts` to use classroom service
- [ ] Update `questions.ts` to use question service
- [ ] Update `videos.ts` to use video service
- [ ] Update `profile.ts` to use profile service
- [ ] Remove navigation methods from stores
- [ ] Remove permission methods from stores
- [ ] Write store tests
- [ ] Test all store actions

### Phase 5: Navigation (Day 3)
- [ ] Create `src/composables/useNavigation.ts`
- [ ] Implement navigation methods
- [ ] Implement navigation items computation
- [ ] Write composable tests
- [ ] Test navigation flows

### Phase 6: Components (Day 3)
- [ ] Update `AppSidebar.vue`
- [ ] Update `MainLayout.vue`
- [ ] Update all view components
- [ ] Test component rendering
- [ ] Test component interactions

### Phase 7: Utilities (Day 3)
- [ ] Create `src/utils/stats.ts`
- [ ] Extract stats calculation
- [ ] Create `src/utils/errors.ts`
- [ ] Implement error handling
- [ ] Write utility tests

### Phase 8: Testing (Day 4)
- [ ] Write comprehensive integration tests
- [ ] Test all user flows (login, classroom access, CRUD operations)
- [ ] Test error scenarios
- [ ] Test permission scenarios
- [ ] Performance testing

### Phase 9: Documentation (Day 4)
- [ ] Update README with new architecture
- [ ] Document service layer patterns
- [ ] Document guard system
- [ ] Document composable usage
- [ ] Create architecture diagram

### Post-Migration
- [ ] Code review
- [ ] QA testing
- [ ] Performance benchmarks
- [ ] Deploy to staging
- [ ] Monitor for issues
- [ ] Merge to main

---

## Expected Benefits

### Immediate Benefits
1. **Testability**: Each layer can be tested in isolation
2. **Maintainability**: Clear boundaries and single responsibility
3. **Reusability**: Services and composables can be reused
4. **Type Safety**: Better TypeScript support with explicit types

### Long-term Benefits
1. **Scalability**: Easy to add new features without affecting existing code
2. **Debugging**: Easier to trace bugs to specific layers
3. **Team Collaboration**: Clear patterns for new developers
4. **Code Quality**: Enforces best practices

---

## Risk Mitigation

### Potential Risks
1. **Breaking Changes**: Refactoring could introduce bugs
   - **Mitigation**: Comprehensive testing at each phase

2. **Performance Impact**: Additional abstraction layers
   - **Mitigation**: Benchmark before/after, optimize if needed

3. **Learning Curve**: Team needs to understand new patterns
   - **Mitigation**: Documentation and code reviews

4. **Time Constraints**: Refactoring takes time away from features
   - **Mitigation**: Incremental approach, can pause between phases

---

## Success Metrics

- [ ] All tests passing (100% of existing functionality)
- [ ] Test coverage increased to >80%
- [ ] No direct Supabase calls in stores
- [ ] No navigation logic in stores
- [ ] No business logic in router
- [ ] No data fetching in layout components
- [ ] All permission checks centralized
- [ ] Build passes without errors
- [ ] No regressions in user flows

---

## Rollback Plan

If critical issues arise:

1. **Immediate Rollback**: Git revert to previous stable commit
2. **Partial Rollback**: Keep completed phases, revert problematic phase
3. **Feature Flag**: Add flag to toggle between old/new architecture

---

## Next Steps

1. **Review this plan** with the team
2. **Get approval** for timeline and approach
3. **Create branch** and start Phase 1
4. **Daily standups** to track progress
5. **Code reviews** after each phase

---

## Notes

- This is a **living document** - update as needed during refactoring
- **Don't rush** - quality over speed
- **Test frequently** - catch issues early
- **Communicate** - keep team informed of progress
- **Document** - explain why changes were made

---

## References

- Vue 3 Composition API: https://vuejs.org/guide/extras/composition-api-faq.html
- Pinia Best Practices: https://pinia.vuejs.org/core-concepts/
- Vue Router Guards: https://router.vuejs.org/guide/advanced/navigation-guards.html
- TypeScript Best Practices: https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html
