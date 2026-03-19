<script setup lang="ts">
definePageMeta({
  auth: false
})

const route = useRoute()
const currentUser = useSupabaseUser()
const coverErrors = ref(new Set<string>())

const username = computed(() => {
  const u = route.params.username
  return typeof u === 'string' ? u : ''
})

type ProfileRating = {
  id: string
  rating: number
  created_at: string
  albums: {
    id: string
    title: string
    artist: string
    cover_url: string
  } | null
}

type PublicProfile = {
  username: string
  ratingsCount: number
  avgRating: number | null
  ratings: ProfileRating[]
}

const {data: profile, pending, error} = await useFetch<PublicProfile>(
    () => `/api/profile/${username.value}`,
    {key: () => `public-profile-${username.value}`}
)

const isOwnProfile = computed(() =>
    currentUser.value?.user_metadata?.username?.toLowerCase() === username.value?.toLowerCase()
)

const getStarFillStyle = (value: number, rating: number) => {
  if (rating >= value) return {}
  const fraction = rating - (value - 1)
  if (fraction <= 0) return null
  const clipPct = Math.round((1 - fraction) * 100)
  return {clipPath: `inset(0 ${clipPct}% 0 0)`}
}
</script>

<template>
  <div class="min-h-[calc(100vh-8rem)] bg-zinc-50 dark:bg-zinc-950">
    <div class="mx-auto max-w-5xl px-4 py-6 sm:py-10">

      <!-- Loading -->
      <div v-if="pending" class="flex w-full items-center justify-center py-24">
        <div class="flex flex-col items-center gap-3 text-zinc-400">
          <UIcon name="i-lucide-loader-2" class="h-7 w-7 animate-spin" />
          <p class="text-sm">Loading profile...</p>
        </div>
      </div>

      <!-- Not found -->
      <div v-else-if="error || !profile" class="flex flex-col items-center justify-center py-24 text-center">
        <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <UIcon name="i-lucide-user-x" class="h-7 w-7 text-zinc-400" />
        </div>
        <h1 class="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Profile not found</h1>
        <p class="mt-1 text-sm text-zinc-500">No user with the username <span class="font-medium text-zinc-700 dark:text-zinc-300">@{{ username }}</span></p>
        <UButton to="/" color="primary" variant="soft" size="sm" class="mt-6">
          Back to home
        </UButton>
      </div>

      <!-- Profile content -->
      <div v-else>
        <!-- Back nav -->
        <NuxtLink
            to="/"
            class="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mb-6"
        >
          <UIcon name="i-lucide-arrow-left" class="h-4 w-4" />
          Home
        </NuxtLink>

        <div class="grid gap-6 lg:grid-cols-[280px_1fr]">

          <!-- Sidebar -->
          <div class="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6">
            <div class="flex lg:flex-col items-center lg:items-center gap-4 lg:gap-3 mb-5 lg:mb-6">
              <UAvatar
                  :alt="profile.username"
                  size="2xl"
                  class="ring-2 ring-zinc-200 dark:ring-zinc-700 shrink-0"
              />
              <div class="lg:text-center min-w-0">
                <p class="text-base font-bold text-zinc-900 dark:text-white truncate">
                  {{ profile.username }}
                </p>
                <p v-if="isOwnProfile" class="text-xs text-primary-600 dark:text-primary-400 mt-0.5 font-medium">
                  You
                </p>
              </div>
            </div>

            <div class="space-y-3">
              <div class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 text-center">
                <p class="text-2xl font-bold text-zinc-900 dark:text-white">{{ profile.ratingsCount }}</p>
                <p class="text-xs text-zinc-500 mt-0.5">album<span v-if="profile.ratingsCount !== 1">s</span> rated</p>
              </div>

              <div v-if="profile.avgRating !== null" class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 text-center">
                <div class="flex justify-center gap-0.5 mb-1">
                  <span v-for="value in 5" :key="value" class="relative inline-flex h-4 w-4">
                    <UIcon name="i-heroicons-star-20-solid" class="h-4 w-4 text-zinc-200 dark:text-zinc-700" />
                    <UIcon
                        v-if="profile.avgRating !== null && value - 1 < profile.avgRating && getStarFillStyle(value, profile.avgRating) !== null"
                        name="i-heroicons-star-20-solid"
                        class="absolute inset-0 h-4 w-4 text-amber-400"
                        :style="getStarFillStyle(value, profile.avgRating) ?? {}"
                    />
                  </span>
                </div>
                <p class="text-sm font-bold text-zinc-900 dark:text-white">{{ profile.avgRating.toFixed(2) }}<span class="font-normal text-zinc-400">/5</span></p>
                <p class="text-xs text-zinc-500 mt-0.5">avg rating</p>
              </div>

              <UButton
                  v-if="isOwnProfile"
                  to="/profile"
                  color="primary"
                  variant="soft"
                  size="sm"
                  block
              >
                <UIcon name="i-lucide-settings" class="h-4 w-4" />
                Edit my profile
              </UButton>
            </div>
          </div>

          <!-- Ratings list -->
          <div class="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 sm:p-6">
            <h2 class="mb-5 text-base font-bold tracking-tight text-zinc-900 dark:text-white">
              {{ isOwnProfile ? 'My ratings' : `${profile.username}'s ratings` }}
            </h2>

            <div v-if="!profile.ratings.length" class="flex flex-col items-center justify-center py-12 text-center">
              <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                <UIcon name="i-lucide-star" class="h-5 w-5 text-zinc-400" />
              </div>
              <p class="text-sm text-zinc-500">No ratings yet.</p>
            </div>

            <div v-else class="overflow-x-auto max-h-[560px] overflow-y-auto">
              <table class="w-full border-collapse">
                <thead class="sticky top-0 bg-white dark:bg-zinc-950">
                <tr class="border-b border-zinc-200 dark:border-zinc-800">
                  <th class="px-2 sm:px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">Cover</th>
                  <th class="px-2 sm:px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">Album</th>
                  <th class="hidden sm:table-cell px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">Artist</th>
                  <th class="px-2 sm:px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">Rating</th>
                  <th class="hidden sm:table-cell px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">Date</th>
                </tr>
                </thead>
                <tbody>
                <tr
                    v-for="rating in profile.ratings"
                    :key="rating.id"
                    class="border-b border-zinc-100 dark:border-zinc-800/60 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-colors cursor-pointer"
                    @click="rating.albums?.id && navigateTo({ path: '/album', query: { id: rating.albums.id } })"
                >
                  <td class="px-2 sm:px-3 py-2.5 sm:py-3">
                    <img
                        v-if="rating.albums?.cover_url && !coverErrors.has(rating.id)"
                        :src="rating.albums.cover_url"
                        :alt="rating.albums?.title"
                        class="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover shadow-sm"
                        referrerpolicy="no-referrer"
                        @error="coverErrors.add(rating.id)"
                    >
                    <div
                        v-else
                        class="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                    >
                      <UIcon name="i-lucide-disc-3" class="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  </td>

                  <td class="px-2 sm:px-3 py-2.5 sm:py-3">
                    <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[120px] sm:max-w-none">
                      {{ rating.albums?.title || '—' }}
                    </p>
                    <p class="sm:hidden text-xs text-zinc-500 mt-0.5 truncate max-w-[120px]">
                      {{ rating.albums?.artist || '—' }}
                    </p>
                  </td>

                  <td class="hidden sm:table-cell px-3 py-3 text-sm text-zinc-500">
                    {{ rating.albums?.artist || '—' }}
                  </td>

                  <td class="px-2 sm:px-3 py-2.5 sm:py-3">
                    <div class="flex items-center gap-0.5">
                      <span
                          v-for="value in 5"
                          :key="value"
                          class="relative inline-flex h-4 w-4"
                      >
                        <UIcon name="i-heroicons-star-20-solid" class="h-4 w-4 text-zinc-200 dark:text-zinc-700" />
                        <UIcon
                            v-if="rating.rating > 0 && value - 1 < rating.rating && getStarFillStyle(value, rating.rating) !== null"
                            name="i-heroicons-star-20-solid"
                            class="absolute inset-0 h-4 w-4 text-amber-400"
                            :style="getStarFillStyle(value, rating.rating) ?? {}"
                        />
                      </span>
                      <span class="ml-1 text-xs text-zinc-400">{{ rating.rating.toFixed(1) }}</span>
                    </div>
                  </td>

                  <td class="hidden sm:table-cell px-3 py-3 text-xs text-zinc-400 whitespace-nowrap">
                    {{ new Date(rating.created_at).toLocaleDateString('fr-FR') }}
                  </td>
                </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>
