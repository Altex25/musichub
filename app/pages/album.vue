<script setup lang="ts">
type AlbumDetails = {
  id: string;
  title: string;
  artist: string;
  first_release_date?: string;
  cover_url?: string;
  rating_avg?: number | null;
  rating_count?: number;
};

const route = useRoute();
const user = useSupabaseUser();
const supabase = useSupabaseClient();

const albumId = computed(() => {
  const id = route.query.id;
  return typeof id === 'string' ? id : '';
});

const {data: album, pending, error} = await useFetch<AlbumDetails>(() => `/api/album/${albumId.value}`);

const selectedRating = ref<number | null>(null);
const hoveredRating = ref<number | null>(null);
const isSavingRating = ref(false);
const ratingMessage = ref('');
const existingRating = ref<number | null>(null);
const averageRating = ref<number | null>(null);
const ratingsCount = ref<number>(0);
const displayedRating = computed(() => hoveredRating.value ?? selectedRating.value ?? 0);

const hasCoverError = ref(false)

const getAverageStarStyle = (value: number, avg: number) => {
  if (avg >= value) return {};
  const fraction = avg - (value - 1);
  const clipPct = Math.round((1 - fraction) * 100);
  return {clipPath: `inset(0 ${clipPct}% 0 0)`};
};

const submitRating = async () => {
  if (!user.value) {
    ratingMessage.value = 'Create an account to leave a rating';
    return;
  }

  if (!album.value) {
    ratingMessage.value = 'Album not found';
    return;
  }

  if (!selectedRating.value) {
    ratingMessage.value = 'Select a rating';
    return;
  }

  try {
    isSavingRating.value = true;
    ratingMessage.value = '';

    await $fetch('/api/rating', {
      method: 'POST',
      body: {
        albumId: album.value.id,
        rating: selectedRating.value
      }
    });

    const newRating = selectedRating.value;
    const wasAlreadyRated = existingRating.value !== null;

    if (wasAlreadyRated && averageRating.value !== null) {
      const totalSum = averageRating.value * ratingsCount.value - existingRating.value! + newRating;
      averageRating.value = totalSum / ratingsCount.value;
    } else {
      const totalSum = (averageRating.value ?? 0) * ratingsCount.value + newRating;
      ratingsCount.value += 1;
      averageRating.value = totalSum / ratingsCount.value;
    }

    existingRating.value = newRating;
    ratingMessage.value = 'Rating successfully added.';
    setTimeout(() => { ratingMessage.value = ''; }, 3000);
  } catch {
    ratingMessage.value = 'Error while adding the rate.';
    setTimeout(() => { ratingMessage.value = ''; }, 4000);
  } finally {
    isSavingRating.value = false;
  }
};

const getStarValue = (event: MouseEvent, value: number) => {
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const isLeftHalf = event.clientX - rect.left < rect.width / 2;
  return value - (isLeftHalf ? 0.5 : 0);
};

const handleStarHover = (event: MouseEvent, value: number) => {
  hoveredRating.value = getStarValue(event, value);
};

const handleStarClick = (event: MouseEvent, value: number) => {
  selectedRating.value = hoveredRating.value ?? getStarValue(event, value);
};

// Initialise community stats from API response (server-side, bypasses RLS)
if (album.value?.rating_avg != null && (album.value.rating_count ?? 0) > 0) {
  averageRating.value = album.value.rating_avg;
  ratingsCount.value = album.value.rating_count ?? 0;
}

// Fetch the current user's existing rating
if (user.value?.sub && albumId.value) {
  const {data: existingRatings} = await supabase
      .from('ratings')
      .select('rating')
      .eq('album_id', albumId.value)
      .eq('user_id', user.value.sub)
      .order('created_at', {ascending: false})
      .limit(1);

  if (existingRatings && existingRatings.length > 0 && typeof existingRatings[0]?.rating === 'number') {
    existingRating.value = existingRatings[0].rating as number;
    selectedRating.value = existingRating.value;
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-8rem)] bg-zinc-50 dark:bg-zinc-950">
    <div class="mx-auto max-w-4xl px-4 py-6 sm:py-10">

      <div v-if="!albumId" class="flex flex-col items-center justify-center py-24 text-center">
        <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <UIcon name="i-lucide-disc-3" class="h-7 w-7 text-zinc-400" />
        </div>
        <h1 class="text-xl font-semibold text-zinc-900 dark:text-zinc-100">No album selected</h1>
        <p class="mt-1 text-sm text-zinc-500">Missing album id in URL</p>
      </div>

      <div v-else-if="pending" class="flex w-full items-center justify-center py-24">
        <div class="flex flex-col items-center gap-3 text-zinc-400">
          <UIcon name="i-lucide-loader-2" class="h-7 w-7 animate-spin" />
          <p class="text-sm">Loading album details...</p>
        </div>
      </div>

      <div v-else-if="error || !album" class="flex flex-col items-center justify-center py-24 text-center">
        <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <UIcon name="i-lucide-alert-circle" class="h-7 w-7 text-zinc-400" />
        </div>
        <h1 class="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Album not found</h1>
        <p class="mt-1 text-sm text-zinc-500">Unable to load this album</p>
      </div>

      <div v-else class="grid gap-10 md:grid-cols-[240px_1fr]">
        <!-- Cover -->
        <div class="flex justify-center md:justify-start">
          <div class="relative">
            <img
                v-if="album.cover_url && !hasCoverError"
                :src="album.cover_url"
                :alt="album.title"
                class="h-44 w-44 sm:h-60 sm:w-60 rounded-2xl object-cover shadow-xl"
                referrerpolicy="no-referrer"
                @error="hasCoverError = true"
            >
            <div
                v-else
                class="flex h-44 w-44 sm:h-60 sm:w-60 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 shadow-inner"
            >
              <UIcon name="i-lucide-disc-3" class="h-12 w-12 text-zinc-300 dark:text-zinc-600" />
            </div>
          </div>
        </div>

        <!-- Info -->
        <div class="flex flex-col gap-8">
          <div class="space-y-5">
            <div>
              <p class="mb-1 text-xs font-medium uppercase tracking-widest text-zinc-400">Album</p>
              <h1 class="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
                {{ album.title }}
              </h1>
            </div>

            <div>
              <p class="mb-1 text-xs font-medium uppercase tracking-widest text-zinc-400">Artist</p>
              <p class="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                {{ album.artist }}
              </p>
            </div>

            <div v-if="album.first_release_date">
              <p class="mb-1 text-xs font-medium uppercase tracking-widest text-zinc-400">Released</p>
              <p class="text-sm text-zinc-700 dark:text-zinc-300">
                {{ album.first_release_date }}
              </p>
            </div>

            <!-- Community rating -->
            <div v-if="averageRating !== null" class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
              <p class="mb-2 text-xs font-medium uppercase tracking-widest text-zinc-400">Community rating</p>
              <div class="flex items-center gap-3">
                <div class="flex items-center gap-0.5">
                  <span
                      v-for="value in 5"
                      :key="value"
                      class="relative inline-flex h-5 w-5"
                  >
                    <UIcon name="i-heroicons-star-20-solid" class="h-5 w-5 text-zinc-200 dark:text-zinc-700" />
                    <UIcon
                        v-if="averageRating !== null && value - 1 < averageRating"
                        name="i-heroicons-star-20-solid"
                        class="absolute inset-0 h-5 w-5 text-amber-400"
                        :style="getAverageStarStyle(value, averageRating)"
                    />
                  </span>
                </div>
                <span class="text-sm font-bold text-zinc-900 dark:text-zinc-100">{{ averageRating.toFixed(1) }}<span class="font-normal text-zinc-400">/5</span></span>
                <span class="text-xs text-zinc-400">
                  {{ ratingsCount }} rating<span v-if="ratingsCount !== 1">s</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Your rating -->
          <div class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
            <p class="mb-3 text-xs font-medium uppercase tracking-widest text-zinc-400">Your rating</p>
            <div v-if="!user" class="text-sm text-zinc-500">
              <NuxtLink to="/auth/login" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">Sign in</NuxtLink>
              to leave a rating.
            </div>
            <div v-else class="flex flex-col gap-3">
              <div class="flex items-center gap-0.5">
                <button
                    v-for="value in 5"
                    :key="value"
                    type="button"
                    class="p-1 cursor-pointer"
                    @click="handleStarClick($event as MouseEvent, value)"
                    @mousemove="handleStarHover($event as MouseEvent, value)"
                    @mouseleave="hoveredRating = null"
                >
                  <span class="relative inline-flex h-8 w-8">
                    <UIcon name="i-heroicons-star-20-solid" class="h-8 w-8 text-zinc-200 dark:text-zinc-700" />
                    <UIcon
                        v-if="displayedRating > 0 && value - 1 < displayedRating"
                        name="i-heroicons-star-20-solid"
                        class="absolute inset-0 h-8 w-8 text-amber-400 transition-colors"
                        :style="value <= displayedRating ? {} : { clipPath: 'inset(0 50% 0 0)' }"
                    />
                  </span>
                </button>
                <span class="ml-2 text-sm font-medium text-zinc-500">
                  <span v-if="selectedRating !== null">{{ selectedRating.toFixed(1) }}/5</span>
                  <span v-else class="text-zinc-400">Select a rating</span>
                </span>
              </div>

              <div class="flex items-center gap-3">
                <UButton
                    size="sm"
                    color="primary"
                    :loading="isSavingRating"
                    :disabled="!selectedRating"
                    @click="submitRating"
                >
                  Save rating
                </UButton>
                <p
                    v-if="ratingMessage"
                    :class="ratingMessage.includes('Error') ? 'text-red-500' : 'text-zinc-500'"
                    class="text-xs"
                >
                  {{ ratingMessage }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>