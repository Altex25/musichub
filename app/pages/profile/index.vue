<script setup lang="ts">
type Rating = {
  id: string,
  rating: number,
  created_at: string,
  albums: {
    id: string,
    title: string,
    artist: string,
    cover_url: string
  } | null
}

const user = useSupabaseUser();
const supabase = useSupabaseClient();
const coverErrors = ref(new Set<string>())
const toast = useToast();
const userId = computed(() => user.value?.sub);

const {data: profile, error: _profileError} = await useAsyncData(() => `profile-${userId.value}`, async () => {
  if (!userId.value) {
    await navigateTo('/auth/login');
    return null;
  }

  const {data, error: _error} = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId.value)
      .maybeSingle();

  return data;
});

const {data: ratings, error: _ratingsError} = await useAsyncData(() => `ratings-${userId.value}`, async () => {
  if (!userId.value) {
    return [];
  }

  const {data, error: _error} = await supabase
      .from('ratings')
      .select(`
      id,
      rating,
      created_at,
      albums (
        id,
        title,
        artist,
        cover_url
      )
    `)
      .eq('user_id', userId.value)
      .order('created_at', {ascending: false});

  if (_error) {
    return [];
  }

  return data as Rating[] | null;
});

const updateRatingFromProfile = async (rating: Rating, newRating: number) => {
  if (!rating.albums?.id) {
    return;
  }

  const previousRating = rating.rating;
  rating.rating = newRating;

  try {
    await $fetch('/api/rating', {
      method: 'POST',
      body: {
        albumId: rating.albums.id,
        rating: newRating
      }
    });
    toast.add({
      title: 'Rating updated',
      description: `${rating.albums?.title} — ${newRating.toFixed(1)}/5`,
      color: 'success',
      icon: 'i-heroicons-star-20-solid'
    });
  } catch {
    rating.rating = previousRating;
    toast.add({
      title: 'Error updating rating',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    });
  }
};

const hoveredRatings = ref<Record<string, number | undefined>>({});

const getRowDisplayedRating = (rating: Rating) =>
  hoveredRatings.value[rating.id] ?? rating.rating;

const getStarValueFromEvent = (event: MouseEvent, value: number) => {
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const isLeftHalf = event.clientX - rect.left < rect.width / 2;
  return value - (isLeftHalf ? 0.5 : 0);
};

const handleStarHoverProfile = (rating: Rating, event: MouseEvent, value: number) => {
  hoveredRatings.value[rating.id] = getStarValueFromEvent(event, value);
};

const handleStarLeaveProfile = (rating: Rating) => {
  hoveredRatings.value[rating.id] = undefined;
};

const handleStarClickProfile = (rating: Rating, event: MouseEvent, value: number) => {
  const newRating = hoveredRatings.value[rating.id] ?? getStarValueFromEvent(event, value);
  updateRatingFromProfile(rating, newRating);
};
</script>
<template>
  <div class="min-h-[calc(100vh-8rem)] bg-zinc-50 dark:bg-zinc-950">
    <div class="mx-auto max-w-5xl px-4 py-10">
      <h1 class="mb-8 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
        My profile
      </h1>

      <div class="grid gap-6 lg:grid-cols-[280px_1fr]">
        <!-- Sidebar -->
        <div class="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-5 sm:p-6">
          <div class="flex lg:flex-col items-center lg:items-center gap-4 lg:gap-3 mb-4 lg:mb-6">
            <UAvatar
                :alt="user?.user_metadata?.username || user?.email || 'User'"
                size="2xl"
                class="ring-2 ring-zinc-200 dark:ring-zinc-700 shrink-0"
            />
            <div class="lg:text-center min-w-0">
              <p class="text-base font-bold text-zinc-900 dark:text-white truncate">
                {{ profile?.username || user?.user_metadata?.username || 'User' }}
              </p>
              <p class="text-xs text-zinc-500 mt-0.5 truncate">
                {{ user?.email }}
              </p>
            </div>
          </div>

          <div class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 text-center">
            <p class="text-2xl font-bold text-zinc-900 dark:text-white">{{ ratings?.length ?? 0 }}</p>
            <p class="text-xs text-zinc-500 mt-0.5">album<span v-if="(ratings?.length ?? 0) !== 1">s</span> rated</p>
          </div>
        </div>

        <!-- Ratings table -->
        <div class="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 sm:p-6">
          <h2 class="mb-5 text-base font-bold tracking-tight text-zinc-900 dark:text-white">
            My ratings
          </h2>

          <div v-if="!ratings?.length" class="flex flex-col items-center justify-center py-12 text-center">
            <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <UIcon name="i-lucide-star" class="h-5 w-5 text-zinc-400" />
            </div>
            <p class="text-sm text-zinc-500">No ratings yet.</p>
          </div>

          <div v-else class="overflow-x-auto max-h-[520px] overflow-y-auto">
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
                  v-for="rating in ratings"
                  :key="rating.id"
                  class="border-b border-zinc-100 dark:border-zinc-800/60 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-colors"
              >
                <td class="px-2 sm:px-3 py-2.5 sm:py-3">
                  <img
                      v-if="rating.albums?.cover_url && !coverErrors.has(rating.id)"
                      :src="rating.albums.cover_url"
                      :alt="rating.albums.title"
                      class="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover cursor-pointer shadow-sm"
                      referrerpolicy="no-referrer"
                      @click="navigateTo({ path: '/album', query: { id: rating.albums?.id } })"
                      @error="coverErrors.add(rating.id)"
                  >
                  <div
                      v-else
                      class="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-pointer"
                      @click="rating.albums?.id && navigateTo({ path: '/album', query: { id: rating.albums.id } })"
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
                        class="relative inline-flex h-4 w-4 cursor-pointer"
                        @click.stop="handleStarClickProfile(rating, $event as MouseEvent, value)"
                        @mousemove.stop="handleStarHoverProfile(rating, $event as MouseEvent, value)"
                        @mouseleave.stop="handleStarLeaveProfile(rating)"
                    >
                      <UIcon name="i-heroicons-star-20-solid" class="h-4 w-4 text-zinc-200 dark:text-zinc-700" />
                      <UIcon
                          v-if="getRowDisplayedRating(rating) > 0 && value - 1 < getRowDisplayedRating(rating)"
                          name="i-heroicons-star-20-solid"
                          class="absolute inset-0 h-4 w-4 text-amber-400"
                          :style="value <= getRowDisplayedRating(rating) ? {} : { clipPath: 'inset(0 50% 0 0)' }"
                      />
                    </span>
                    <span class="ml-1 text-xs text-zinc-400">{{ getRowDisplayedRating(rating).toFixed(1) }}</span>
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
</template>
