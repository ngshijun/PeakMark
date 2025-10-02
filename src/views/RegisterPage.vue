<template>
  <div class="flex min-h-screen items-center justify-center p-4">
    <div class="fixed top-4 right-4 z-50">
      <ThemeToggle />
    </div>
    <div class="w-full max-w-sm">
      <!-- Email Confirmation Message -->
      <div v-if="isRegistered" class="flex flex-col gap-6">
        <div class="flex flex-col items-center gap-4">
          <div class="rounded-full bg-primary/10 p-3">
            <Mail class="h-8 w-8 text-primary" />
          </div>
          <h1 class="text-xl font-bold text-center">Check your email</h1>
          <p class="text-center text-sm text-muted-foreground">
            A confirmation email has been sent to
            <span class="font-medium text-foreground">{{ registeredEmail }}</span>
          </p>
        </div>

        <div class="flex flex-col gap-3">
          <div class="rounded-lg border border-border bg-muted/50 p-4">
            <div class="flex items-start gap-3">
              <Info class="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <p class="text-sm">
                Please check your inbox and click the confirmation link to activate your account.
              </p>
            </div>
          </div>
          <p class="text-sm text-center text-muted-foreground">
            Can't find it? Check your spam or junk folder.
          </p>
        </div>

        <router-link to="/login">
          <Button class="w-full">Go to Login</Button>
        </router-link>
      </div>

      <!-- Registration Form -->
      <form v-else @submit="onSubmit">
        <div class="flex flex-col gap-6">
          <div class="flex flex-col items-center gap-2">
            <h1 class="text-xl font-bold">Create an account</h1>
            <div class="text-center text-sm">
              Already have an account?
              <router-link to="/login" class="underline underline-offset-4"> Login </router-link>
            </div>
          </div>
          <div class="flex flex-col gap-6">
            <FormField v-slot="{ componentField, value }" name="role">
              <FormItem>
                <FormLabel>I am a...</FormLabel>
                <Select v-bind="componentField" :disabled="isSubmitting">
                  <FormControl>
                    <SelectTrigger class="w-full">
                      <SelectValue placeholder="Select a role">
                        <div v-if="value" class="flex items-center gap-2">
                          <GraduationCap v-if="value === 'student'" class="h-4 w-4" />
                          <School v-if="value === 'teacher'" class="h-4 w-4" />
                          <span>{{ value === 'student' ? 'Student' : 'Teacher' }}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="student">
                      <div class="flex items-center gap-2">
                        <GraduationCap class="h-4 w-4" />
                        <span>Student</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="teacher">
                      <div class="flex items-center gap-2">
                        <School class="h-4 w-4" />
                        <span>Teacher</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="name" :validateOnBlur="false">
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="John Doe"
                    v-bind="componentField"
                    :disabled="isSubmitting"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField name="dateOfBirth">
              <FormItem class="flex flex-col">
                <FormLabel>Date of Birth</FormLabel>
                <Popover>
                  <PopoverTrigger as-child>
                    <FormControl>
                      <Button
                        variant="outline"
                        :class="
                          cn(
                            'w-full ps-3 text-start font-normal',
                            !dobValue && 'text-muted-foreground',
                          )
                        "
                        :disabled="isSubmitting"
                        tabindex="0"
                      >
                        <span>{{ dobValue ? df.format(toDate(dobValue)) : 'Pick a date' }}</span>
                        <CalendarIcon class="ms-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent class="w-auto p-0">
                    <Calendar
                      v-model:placeholder="dobPlaceholder"
                      :model-value="dobValue"
                      calendar-label="Date of birth"
                      initial-focus
                      :min-value="new CalendarDate(1900, 1, 1)"
                      :max-value="today(getLocalTimeZone())"
                      @update:model-value="
                        (v) => {
                          if (v) {
                            setFieldValue('dateOfBirth', v.toString())
                          } else {
                            setFieldValue('dateOfBirth', undefined)
                          }
                        }
                      "
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField
              v-slot="{ componentField }"
              name="email"
              :validateOnBlur="false"
              :validateOnModelUpdate="false"
            >
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="m@example.com"
                    v-bind="componentField"
                    :disabled="isSubmitting"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField
              v-slot="{ componentField }"
              name="password"
              :validateOnBlur="false"
              :validateOnModelUpdate="false"
            >
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div class="relative">
                    <Input
                      :type="showPassword ? 'text' : 'password'"
                      v-bind="componentField"
                      :disabled="isSubmitting"
                      class="pr-10"
                    />
                    <button
                      type="button"
                      @click="showPassword = !showPassword"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      :disabled="isSubmitting"
                    >
                      <Eye v-if="!showPassword" class="h-4 w-4" />
                      <EyeOff v-else class="h-4 w-4" />
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="confirmPassword" :validateOnBlur="false">
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <div class="relative">
                    <Input
                      :type="showConfirmPassword ? 'text' : 'password'"
                      v-bind="componentField"
                      :disabled="isSubmitting"
                      class="pr-10"
                    />
                    <button
                      type="button"
                      @click="showConfirmPassword = !showConfirmPassword"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      :disabled="isSubmitting"
                    >
                      <Eye v-if="!showConfirmPassword" class="h-4 w-4" />
                      <EyeOff v-else class="h-4 w-4" />
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <Button type="submit" class="w-full" :disabled="isSubmitting">
              <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
              {{ isSubmitting ? 'Creating account...' : 'Create account' }}
            </Button>
          </div>
          <div
            class="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border"
          >
            <span class="relative z-10 bg-background px-2 text-muted-foreground"> Or </span>
          </div>
          <Button variant="outline" class="w-full" type="button" :disabled="isSubmitting">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-4 w-4">
              <path
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                fill="currentColor"
              />
            </svg>
            <span class="ml-2">Continue with Google</span>
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import ThemeToggle from '@/components/ThemeToggle.vue'
import { Button } from '@/components/ui/button'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAuthStore } from '@/stores/auth'

import {
  CalendarDate,
  DateFormatter,
  getLocalTimeZone,
  parseDate,
  today,
} from '@internationalized/date'
import { toTypedSchema } from '@vee-validate/zod'
import {
  CalendarIcon,
  Eye,
  EyeOff,
  GraduationCap,
  Info,
  Loader2,
  Mail,
  School,
} from 'lucide-vue-next'
import { toDate } from 'reka-ui/date'
import { useForm } from 'vee-validate'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import * as z from 'zod'
import { cn } from '@/lib/utils'

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isRegistered = ref(false)
const registeredEmail = ref('')
const { signUp } = useAuthStore()

const df = new DateFormatter('en-US', {
  dateStyle: 'long',
})
const dobPlaceholder = ref()

const formSchema = toTypedSchema(
  z
    .object({
      role: z.enum(['student', 'teacher']),
      name: z.string().min(1, 'Name is required').min(2, 'Name must be at least 2 characters'),
      dateOfBirth: z.string().min(1, 'Date of birth is required'),
      email: z.string().min(1, 'Email is required').email('Invalid email address'),
      password: z
        .string()
        .min(1, 'Password is required')
        .min(6, 'Password must be at least 6 characters'),
      confirmPassword: z.string().min(1, 'Please confirm your password'),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ['confirmPassword'],
    }),
)

const { handleSubmit, isSubmitting, setFieldValue, values } = useForm({
  validationSchema: formSchema,
  initialValues: {
    name: '',
    role: 'student',
    dateOfBirth: '',
    email: '',
    password: '',
    confirmPassword: '',
  },
})

const dobValue = computed({
  get: () => (values.dateOfBirth ? parseDate(values.dateOfBirth) : undefined),
  set: (val) => val,
})

const onSubmit = handleSubmit(async (values) => {
  try {
    await signUp(values.email, values.password, {
      full_name: values.name,
      dob: values.dateOfBirth,
      role: values.role,
    })
    registeredEmail.value = values.email
    isRegistered.value = true
  } catch (error) {
    console.error('Registration error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    if (errorMessage.includes('Invalid email')) {
      toast.error('Invalid Email', {
        description: 'Please provide a valid email address.',
      })
    } else if (errorMessage.includes('User already registered')) {
      toast.error('Email Already Exists', {
        description: 'An account with this email already exists. Please login instead.',
      })
    } else {
      toast.error('Registration Failed', {
        description: errorMessage || 'An error occurred during registration. Please try again.',
      })
    }
  }
})
</script>
