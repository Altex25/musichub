<script setup lang="ts">
definePageMeta({
  auth: false
})

const supabase = useSupabaseClient()
const route = useRoute()

const status = ref<'loading' | 'success' | 'error'>('loading')
const errorMessage = ref('')

onMounted(async () => {
  const code = typeof route.query.code === 'string' ? route.query.code : null

  if (code) {
    const {error} = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      status.value = 'error'
      errorMessage.value = 'This confirmation link is invalid or has expired.'
      return
    }

    status.value = 'success'
    await navigateTo('/')
    return
  }

  // Implicit flow: check if session was set from URL hash by the module
  const {data: {session}} = await supabase.auth.getSession()

  if (session) {
    status.value = 'success'
    await navigateTo('/')
    return
  }

  status.value = 'error'
  errorMessage.value = 'No confirmation code found. Please check your link.'
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
    <div class="w-full max-w-sm text-center">
      <NuxtLink to="/" class="inline-flex items-center gap-2 mb-8 justify-center">
        <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 dark:bg-primary-500">
          <UIcon name="i-lucide-music" class="h-5 w-5 text-white" />
        </div>
        <span class="text-lg font-bold text-zinc-900 dark:text-white">MusicHub</span>
      </NuxtLink>

      <div v-if="status === 'loading'" class="flex flex-col items-center gap-4">
        <div class="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <UIcon name="i-lucide-loader-2" class="h-7 w-7 animate-spin text-zinc-400" />
        </div>
        <p class="text-sm text-zinc-500">Confirming your account...</p>
      </div>

      <div v-else-if="status === 'success'" class="flex flex-col items-center gap-4">
        <div class="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <UIcon name="i-lucide-check" class="h-7 w-7 text-green-500" />
        </div>
        <h1 class="text-xl font-bold text-zinc-900 dark:text-white">Account confirmed!</h1>
        <p class="text-sm text-zinc-500">Redirecting you to the app...</p>
      </div>

      <div v-else class="flex flex-col items-center gap-4">
        <div class="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <UIcon name="i-lucide-x" class="h-7 w-7 text-red-500" />
        </div>
        <h1 class="text-xl font-bold text-zinc-900 dark:text-white">Confirmation failed</h1>
        <p class="text-sm text-zinc-500">{{ errorMessage }}</p>
        <UButton to="/auth/login" color="primary" variant="soft" size="sm">
          Back to login
        </UButton>
      </div>
    </div>
  </div>
</template>
