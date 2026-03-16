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

      <p class="mb-8 max-w-2xl text-sm text-gray-600 sm:text-base dark:text-gray-300">
        Search any album, open beautiful details pages with covers and release dates, and keep track of the music you love by rating your favorite records.
      </p>

      <div class="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
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

    <div class="grid w-full gap-4 rounded-2xl border border-dashed border-default bg-default/40 p-4 sm:grid-cols-3 sm:p-6">
      <div class="flex flex-col items-center gap-2 text-center">
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
          <UIcon name="i-lucide-search" class="h-5 w-5" />
        </div>
        <p class="text-sm font-semibold">Smart search</p>
        <p class="text-xs text-gray-500">
          Type in the top bar to instantly search albums powered by MusicBrainz.
        </p>
      </div>

      <div class="flex flex-col items-center gap-2 text-center">
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300">
          <UIcon name="i-lucide-star" class="h-5 w-5" />
        </div>
        <p class="text-sm font-semibold">Rate what you love</p>
        <p class="text-xs text-gray-500">
          Open an album page and leave a rating from 1 to 5 to build your profile.
        </p>
      </div>

      <div class="flex flex-col items-center gap-2 text-center">
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
          <UIcon name="i-lucide-user" class="h-5 w-5" />
        </div>
        <p class="text-sm font-semibold">Your profile</p>
        <p class="text-xs text-gray-500">
          Visit your profile to see all your ratings and rediscover albums you enjoyed.
        </p>
      </div>
    </div>
  </div>
</template>

