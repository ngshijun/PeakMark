<template>
  <div class="flex min-h-screen items-center justify-center p-4">
    <div class="fixed top-4 right-4 z-50">
      <ThemeToggle />
    </div>
    <div class="w-full max-w-sm">
      <form @submit="onSubmit">
        <div class="flex flex-col gap-6">
          <div class="flex flex-col items-center gap-2">
            <h1 class="text-xl font-bold">Set New Password</h1>
            <div class="text-center text-sm text-muted-foreground">
              Enter your new password below.
            </div>
          </div>

          <div class="flex flex-col gap-6">
            <FormField
              v-slot="{ componentField }"
              name="password"
              :validateOnBlur="false"
              :validateOnModelUpdate="false"
            >
              <FormItem>
                <FormLabel>New Password</FormLabel>
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

            <FormField
              v-slot="{ componentField }"
              name="confirmPassword"
              :validateOnBlur="false"
              :validateOnModelUpdate="false"
            >
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
              {{ isSubmitting ? 'Updating...' : 'Update Password' }}
            </Button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { useAuthStore } from '@/stores/auth'
import { toTypedSchema } from '@vee-validate/zod'
import { Eye, EyeOff, Loader2 } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import * as z from 'zod'

const router = useRouter()
const { updatePassword } = useAuthStore()
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const formSchema = toTypedSchema(
  z
    .object({
      password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
      confirmPassword: z.string().min(1, 'Please confirm your password'),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ['confirmPassword'],
    }),
)

const { handleSubmit, isSubmitting } = useForm({
  validationSchema: formSchema,
  initialValues: {
    password: '',
    confirmPassword: '',
  },
})

const onSubmit = handleSubmit(async (values) => {
  try {
    await updatePassword(values.password)
    toast.success('Password Updated', {
      description: 'Your password has been successfully updated.',
    })
    router.push('/classrooms')
  } catch (error) {
    console.error('Password update error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    toast.error('Failed to Update Password', {
      description: errorMessage || 'An error occurred. Please try again.',
    })
  }
})
</script>
