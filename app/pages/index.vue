<script setup lang="ts">
const user = useSupabaseUser();

type LatestRating = {
  id: string
  rating: number
  created_at: string
  albums: {
    id: string
    title: string
    artist: string
    cover_url: string
  } | null
  profiles: {
    username: string
  } | null
}

const {data: latestRatings} = await useFetch<LatestRating[]>('/api/latest-ratings', {key: 'latest-ratings'})

const coverErrors = ref(new Set<string>())

const isHovered = ref(false)
const trackRef = ref<HTMLElement | null>(null)

let rafId: number | null = null
let pos = 0
let lastTime = 0

const SPEED = 50 // px/s

const tick = (now: number) => {
  if (lastTime === 0) lastTime = now
  const delta = Math.min((now - lastTime) / 1000, 0.1)
  lastTime = now

  const track = trackRef.value
  if (!isHovered.value && track) {
    const half = track.scrollWidth / 2
    if (half > 0) {
      pos = (pos + SPEED * delta) % half
      track.style.transform = `translateX(-${pos}px)`
    }
  }

  rafId = requestAnimationFrame(tick)
}

onMounted(() => { rafId = requestAnimationFrame(tick) })
onBeforeUnmount(() => { if (rafId !== null) cancelAnimationFrame(rafId) })

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

    <div class="mx-auto max-w-5xl px-4 pt-2 pb-4 sm:pt-6 sm:pb-4 text-center">
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

    <!-- Recently Rated carousel -->
    <div
        v-if="latestRatings && latestRatings.length > 0"
        class="bg-zinc-50 dark:bg-zinc-950 py-12 sm:py-12 overflow-hidden"
    >
      <div class="mx-auto max-w-5xl px-4 mb-6">
        <h2 class="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
          Recently rated
        </h2>
        <p class="mt-0.5 text-sm text-zinc-500">What the community is listening to</p>
      </div>

      <!-- Marquee track -->
      <div class="overflow-hidden">
      <div
          ref="trackRef"
          class="carousel-track"
          @mouseenter="isHovered = true"
          @mouseleave="isHovered = false"
          @touchstart.passive="isHovered = true"
          @touchend.passive="isHovered = false"
      >
        <template v-for="set in 2" :key="set">
          <NuxtLink
              v-for="(entry, i) in latestRatings"
              :key="`${set}-${i}`"
              :to="entry.albums?.id ? { path: '/album', query: { id: entry.albums.id } } : '/'"
              :aria-hidden="set === 2 ? 'true' : undefined"
              :tabindex="set === 2 ? -1 : undefined"
              class="carousel-item group shrink-0 cursor-pointer"
          >
            <!-- Cover -->
            <div class="relative mb-3 overflow-hidden rounded-xl shadow-sm">
                <img
                    v-if="entry.albums?.cover_url && !coverErrors.has(entry.id)"
                    :src="entry.albums.cover_url"
                    :alt="entry.albums?.title"
                    class="h-36 w-36 sm:h-40 sm:w-40 object-cover transition-transform duration-300 group-hover:scale-105"
                    referrerpolicy="no-referrer"
                    loading="lazy"
                    @error="coverErrors.add(entry.id)"
                >
                <div
                    v-else
                    class="flex h-36 w-36 sm:h-40 sm:w-40 items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                >
                <UIcon name="i-lucide-disc-3" class="h-10 w-10" />
              </div>

              <!-- Rating badge -->
              <div class="absolute bottom-2 right-2 flex items-center gap-1 rounded-lg bg-black/65 px-1.5 py-0.5 backdrop-blur-sm">
                <UIcon name="i-heroicons-star-20-solid" class="h-3 w-3 text-amber-400" />
                <span class="text-xs font-semibold text-white">{{ entry.rating.toFixed(1) }}</span>
              </div>
            </div>

            <!-- Info -->
            <p class="w-36 sm:w-40 truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {{ entry.albums?.title || '—' }}
            </p>
            <p class="w-36 sm:w-40 truncate text-xs text-zinc-500 mt-0.5">
              {{ entry.albums?.artist || '—' }}
            </p>

            <!-- Stars -->
            <div class="flex items-center gap-0.5 mt-1.5">
              <span v-for="value in 5" :key="value" class="relative inline-flex h-3 w-3">
                <UIcon name="i-heroicons-star-20-solid" class="h-3 w-3 text-zinc-200 dark:text-zinc-700" />
                <UIcon
                    v-if="entry.rating > 0 && value - 1 < entry.rating && getStarFillStyle(value, entry.rating) !== null"
                    name="i-heroicons-star-20-solid"
                    class="absolute inset-0 h-3 w-3 text-amber-400"
                    :style="getStarFillStyle(value, entry.rating) ?? {}"
                />
              </span>
            </div>

            <!-- Rated by -->
            <p v-if="entry.profiles?.username" class="mt-1 w-36 sm:w-40 truncate text-xs text-zinc-400">
              @{{ entry.profiles.username }}
            </p>
          </NuxtLink>
        </template>
      </div>
      </div>

    </div>

  </div>
</template>

<style scoped>
.carousel-track {
  display: flex;
  gap: 1rem;
  width: max-content;
  will-change: transform;
}

.carousel-item {
  width: 9rem;
}

@media (min-width: 640px) {
  .carousel-item {
    width: 10rem;
  }
}
</style>
