<script setup lang="ts">
type AlbumDetails = {
  id: string;
  title: string;
  artist: string;
  first_release_date?: string;
  cover_url?: string;
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
  } catch {
    ratingMessage.value = 'Error while adding the rate.';
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
  selectedRating.value = getStarValue(event, value);
};

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

if (albumId.value) {
  const {data: allRatings} = await supabase
      .from('ratings')
      .select('rating')
      .eq('album_id', albumId.value);

  if (allRatings && allRatings.length > 0) {
    ratingsCount.value = allRatings.length;
    const sum = allRatings.reduce((acc, r) => acc + (r.rating as number), 0);
    averageRating.value = sum / ratingsCount.value;
  }
}
</script>

<template>
  <!-- Album details part  -->
  <div class="mx-auto max-w-4xl px-4 py-8">
    <div class="flex w-full py-6">
      <div v-if="!albumId" class="text-center py-12">
        <h1 class="text-4xl font-bold">No album selected</h1>
        <p class="mt-2 text-gray-500">Missing album id in URL</p>
      </div>

      <div v-else-if="pending" class="flex w-full items-center justify-center py-16">
        <div class="flex flex-col items-center gap-3 text-gray-500">
          <UIcon name="i-lucide-loader-2" class="h-6 w-6 animate-spin" />
          <p>Loading album details...</p>
        </div>
      </div>

      <div v-else-if="error || !album" class="text-center py-12">
        <h1 class="text-3xl font-bold">Album not found</h1>
        <p class="mt-2 text-gray-500">Unable to load this album</p>
      </div>

      <div v-else class="grid w-full gap-8 md:grid-cols-[260px_1fr]">
        <!-- Album cover part -->
        <div class="flex justify-center md:justify-start">
          <img
              v-if="album.cover_url"
              :src="album.cover_url"
              :alt="album.title"
              class="h-64 w-64 rounded-2xl object-cover shadow-lg"
              referrerpolicy="no-referrer"
          >
          <div
              v-else
              class="flex h-64 w-64 items-center justify-center rounded-2xl bg-gray-100 text-gray-500 shadow-inner"
          >
            <UIcon name="i-lucide-music" class="h-10 w-10" />
          </div>
        </div>

        <!-- Album info part -->
        <div class="flex flex-col justify-between gap-6">
          <div class="space-y-4">
            <div>
              <p class="text-xs uppercase tracking-wide text-gray-500">Album</p>
              <h1 class="text-3xl font-extrabold tracking-tight sm:text-4xl">
                {{ album.title }}
              </h1>
            </div>

            <div>
              <p class="text-xs uppercase tracking-wide text-gray-500">Artist</p>
              <p class="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {{ album.artist }}
              </p>
            </div>

            <div v-if="album.first_release_date">
              <p class="text-xs uppercase tracking-wide text-gray-500">Release date</p>
              <p class="text-sm font-medium text-gray-800 dark:text-gray-200">
                {{ album.first_release_date }}
              </p>
            </div>

            <div v-if="averageRating !== null" class="space-y-1">
              <p class="text-xs uppercase tracking-wide text-gray-500">
                Community rating
              </p>
              <div class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <div class="flex items-center gap-0.5">
                  <span
                      v-for="value in 5"
                      :key="value"
                      class="relative inline-flex h-4 w-4"
                  >
                    <UIcon
                        name="i-heroicons-star-20-solid"
                        class="h-4 w-4 text-gray-300 dark:text-gray-600"
                    />
                    <UIcon
                        v-if="averageRating !== null && value - 1 < averageRating"
                        name="i-heroicons-star-20-solid"
                        class="absolute inset-0 h-4 w-4 text-amber-400"
                        :style="value <= averageRating
                          ? {}
                          : { clipPath: 'inset(0 50% 0 0)' }"
                    />
                  </span>
                  <span class="font-semibold">{{ averageRating.toFixed(1) }}/5</span>
                </div>
                <span class="text-xs text-gray-500">
                  ({{ ratingsCount }} rating<span v-if="ratingsCount !== 1">s</span>)
                </span>
              </div>
            </div>
          </div>

          <!-- Rating section -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <p class="text-xs uppercase tracking-wide text-gray-500">
                Your rating
              </p>
            </div>

            <div class="flex flex-col gap-3">
              <div class="flex items-center gap-1">
                <button
                    v-for="value in 5"
                    :key="value"
                    type="button"
                    class="p-1.5 cursor-pointer"
                    @click="handleStarClick($event as MouseEvent, value)"
                    @mousemove="handleStarHover($event as MouseEvent, value)"
                    @mouseleave="hoveredRating = null"
                >
                  <span class="relative inline-flex h-7 w-7">
                    <UIcon
                        name="i-heroicons-star-20-solid"
                        class="h-7 w-7 text-gray-300 dark:text-gray-600"
                    />
                    <UIcon
                        v-if="displayedRating > 0 && value - 1 < displayedRating"
                        name="i-heroicons-star-20-solid"
                        class="absolute inset-0 h-7 w-7 text-amber-400 transition-colors"
                        :style="value <= displayedRating
                          ? {}
                          : { clipPath: 'inset(0 50% 0 0)' }"
                    />
                  </span>
                </button>

                <span class="ml-2 text-sm text-gray-600">
                  <span v-if="selectedRating !== null">
                    {{ selectedRating.toFixed(1) }}/5
                  </span>
                </span>
              </div>

              <div class="flex items-center gap-3">
                <UButton
                    size="sm"
                    :loading="isSavingRating"
                    :disabled="!selectedRating"
                    @click="submitRating"
                >
                  Save rating
                </UButton>
                <p v-if="ratingMessage" class="text-xs text-gray-500">
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