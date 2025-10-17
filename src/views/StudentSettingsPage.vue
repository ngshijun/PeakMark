<template>
  <ClassroomSelectionLayout>
    <div class="flex flex-col space-y-6">
      <!-- Header -->
      <div class="space-y-4">
        <Button variant="ghost" size="sm" @click="goBack" class="w-fit -ml-2">
          <ArrowLeft class="mr-2 h-4 w-4" />
          Back
        </Button>
        <div class="space-y-2">
          <h1 class="text-3xl font-bold tracking-tight">Settings</h1>
          <p class="text-muted-foreground">Manage your account settings and preferences</p>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="profileStore.loading && !profileStore.userProfile" class="flex-1 space-y-6">
        <Card>
          <CardHeader>
            <Skeleton class="h-6 w-32" />
          </CardHeader>
          <CardContent class="space-y-4">
            <Skeleton class="h-24 w-24 rounded-full" />
            <Skeleton class="h-10 w-full" />
          </CardContent>
        </Card>
      </div>

      <!-- Settings Content -->
      <template v-else>
        <div class="grid gap-6">
          <!-- Profile Picture Card -->
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription
                >Upload a profile picture to personalize your account</CardDescription
              >
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="flex items-center gap-6">
                <!-- Avatar Preview -->
                <Avatar class="h-24 w-24">
                  <AvatarImage
                    v-if="avatarPreview || currentAvatarUrl"
                    :src="(avatarPreview || currentAvatarUrl) as string"
                  />
                  <AvatarFallback class="text-2xl bg-primary/10 text-primary">
                    {{ getInitials(profileStore.fullName) }}
                  </AvatarFallback>
                </Avatar>

                <!-- Upload Controls -->
                <div class="flex-1 space-y-3">
                  <div class="flex gap-2">
                    <input
                      ref="fileInputRef"
                      type="file"
                      accept="image/*"
                      class="hidden"
                      @change="handleFileSelect"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      @click="triggerFileInput"
                      :disabled="uploadingAvatar"
                    >
                      <Upload v-if="!uploadingAvatar" class="mr-2 h-4 w-4" />
                      <Loader v-else class="mr-2 h-4 w-4 animate-spin" />
                      {{ uploadingAvatar ? 'Uploading...' : 'Upload Photo' }}
                    </Button>
                    <Button
                      v-if="currentAvatarUrl"
                      type="button"
                      variant="outline"
                      @click="handleRemoveAvatar"
                      :disabled="uploadingAvatar"
                    >
                      <Trash2 class="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                  <p class="text-xs text-muted-foreground">JPG, PNG or GIF. Max size 5MB.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Personal Information Card -->
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent>
              <form @submit="onSubmit" class="space-y-4">
                <FormField v-slot="{ componentField }" name="fullName">
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
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

                <FormField v-slot="{ componentField }" name="dob">
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" v-bind="componentField" :disabled="isSubmitting" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <FormField v-slot="{ componentField }" name="email">
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" v-bind="componentField" disabled />
                    </FormControl>
                    <FormDescription>
                      Email cannot be changed. Contact support if you need to update it.
                    </FormDescription>
                  </FormItem>
                </FormField>

                <div class="flex gap-2 pt-2">
                  <Button type="submit" :disabled="isSubmitting || !meta.dirty">
                    <Loader v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
                    {{ isSubmitting ? 'Saving...' : 'Save Changes' }}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    @click="resetForm"
                    :disabled="isSubmitting || !meta.dirty"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <!-- Account Security Card -->
          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
              <CardDescription>Manage your password and security settings</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" @click="handleChangePassword">
                <KeyRound class="mr-2 h-4 w-4" />
                Change Password
              </Button>
            </CardContent>
          </Card>
        </div>
      </template>
    </div>
  </ClassroomSelectionLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'
import { toast } from 'vue-sonner'
import { Upload, Trash2, KeyRound, Loader, ArrowLeft } from 'lucide-vue-next'
import ClassroomSelectionLayout from '@/layouts/ClassroomSelectionLayout.vue'
import { useProfileStore } from '@/stores/profile'
import { useAuthStore } from '@/stores/auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { getErrorMessage } from '@/utils/errors'

const router = useRouter()
const profileStore = useProfileStore()
const authStore = useAuthStore()

// Methods
const goBack = () => {
  router.back()
}

// Avatar upload state
const fileInputRef = ref<HTMLInputElement | null>(null)
const avatarPreview = ref<string | null>(null)
const uploadingAvatar = ref(false)

// Computed
const currentAvatarUrl = computed(() => profileStore.userProfile?.avatar_url || null)

// Form validation schema
const formSchema = toTypedSchema(
  z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    dob: z.string().optional(),
    email: z.string().email(),
  }),
)

// Form setup
const { handleSubmit, resetForm, isSubmitting, setValues, meta } = useForm({
  validationSchema: formSchema,
  initialValues: {
    fullName: profileStore.fullName || '',
    dob: profileStore.dob || '',
    email: authStore.user?.email || '',
  },
})

// Methods
const getInitials = (name: string): string => {
  if (!name) return '?'
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // Validate file type
  if (!file.type.startsWith('image/')) {
    toast.error('Please select an image file')
    return
  }

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    toast.error('Image size must be less than 5MB')
    return
  }

  // Preview
  const reader = new FileReader()
  reader.onload = (e) => {
    avatarPreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)

  // Upload
  uploadingAvatar.value = true
  try {
    await profileStore.uploadAvatar(file)
    toast.success('Profile picture updated successfully')
    avatarPreview.value = null
  } catch (error) {
    toast.error(getErrorMessage(error))
    avatarPreview.value = null
  } finally {
    uploadingAvatar.value = false
    // Reset file input
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  }
}

const handleRemoveAvatar = async () => {
  uploadingAvatar.value = true
  try {
    await profileStore.deleteAvatar()
    toast.success('Profile picture removed')
    avatarPreview.value = null
  } catch (error) {
    toast.error(getErrorMessage(error))
  } finally {
    uploadingAvatar.value = false
  }
}

const onSubmit = handleSubmit(async (values) => {
  try {
    await profileStore.updateProfile({
      full_name: values.fullName,
      dob: values.dob || null,
    })
    toast.success('Profile updated successfully')
    resetForm({ values })
  } catch (error) {
    toast.error(getErrorMessage(error))
  }
})

const handleChangePassword = () => {
  // Navigate to password reset flow
  toast.info('Password reset functionality coming soon')
  // TODO: Implement password change flow
}

// Lifecycle
onMounted(async () => {
  if (!profileStore.userProfile) {
    await profileStore.fetchProfile()
  }

  // Update form values after profile is loaded
  setValues({
    fullName: profileStore.fullName || '',
    dob: profileStore.dob || '',
    email: authStore.user?.email || '',
  })
})
</script>
