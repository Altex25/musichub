<script setup lang="ts">
const user = useSupabaseUser();
</script>

<template>
  <div class="mx-auto flex min-h-[calc(100vh-6rem)] max-w-5xl flex-col items-center justify-center px-4 py-10 text-center">
    <div class="mb-12 flex w-full flex-col items-center text-center">
      <div class="mb-8 inline-flex items-center gap-2 rounded-full border border-default bg-default/60 px-4 py-1 text-xs font-medium text-gray-600 dark:text-gray-300">
        <UIcon name="i-lucide-music" class="h-4 w-4" />
        <span>Discover, rate and explore your favorite albums</span>
      </div>

      <h1 class="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
        Welcome to MusicHub
      </h1>

      <div
          v-if="!user"
          class="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
      >
        <NuxtLink to="/auth/register">
          <UButton size="lg" color="primary">
            Get started
          </UButton>
        </NuxtLink>
        <p class="text-xs text-gray-500 sm:text-sm">
          Already have an account?
          <NuxtLink to="/auth/login" class="font-medium text-primary underline-offset-2 hover:underline">
            Log in
          </NuxtLink>
        </p>
      </div>
    </div>
    </div>
</template>

