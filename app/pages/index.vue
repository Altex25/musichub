<script setup lang="ts">
const user = useSupabaseUser();
</script>

<template>
  <div class="min-h-[calc(100vh-8rem)] bg-zinc-50 dark:bg-zinc-950">
    <!-- Hero -->
    <div class="mx-auto max-w-5xl px-4 pt-20 pb-16 text-center">
      <div class="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-4 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
        <UIcon name="i-lucide-sparkles" class="h-3.5 w-3.5 text-primary-500" />
        Discover, rate and explore your favorite albums
      </div>

      <h1 class="mb-6 text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-6xl lg:text-7xl">
        Your music,<br>
        <span class="text-primary-600 dark:text-primary-400">your taste.</span>
      </h1>

      <p class="mx-auto mb-10 max-w-xl text-base text-zinc-500 dark:text-zinc-400">
        Search any album, read reviews, and build your personal music library by rating the records you love.
      </p>

      <div v-if="!user" class="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
        <NuxtLink to="/auth/register">
          <UButton size="lg" color="primary" class="px-8">
            Get started — it's free
          </UButton>
        </NuxtLink>
        <NuxtLink to="/auth/login" class="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
          Already have an account? <span class="font-medium text-primary-600 dark:text-primary-400">Sign in</span>
        </NuxtLink>
      </div>

      <div v-else class="flex justify-center gap-3">
        <NuxtLink to="/profile">
          <UButton size="lg" color="primary" variant="outline">
            <UIcon name="i-lucide-user" class="h-4 w-4"/>
            My profile
          </UButton>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
