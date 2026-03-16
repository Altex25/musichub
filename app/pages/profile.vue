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
const toast = useToast();
const userId = computed(() => user.value?.sub);

const {data: profile, error: profileError} = await useAsyncData('profile', async () => {
  if (!userId.value) {
    await navigateTo('/auth/login');
    return null;
  }

  const {data, error} = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId.value)
      .maybeSingle();

  if (error) {
    console.error(error);
  }

  return data;
});

const {data: ratings, error: ratingsError} = await useAsyncData('ratings', async () => {
  if (!userId.value) {
    return [];
  }

  const {data, error} = await supabase
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

  if (error) {
    console.error(error);
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
  } catch (error) {
    rating.rating = previousRating;
    console.error('Error updating rating from profile:', error);
    toast.add({
      title: 'Error updating rating',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    });
  }
};

const hoveredRatings = ref<Record<string, number | null>>({});

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
  hoveredRatings.value[rating.id] = null;
};

const handleStarClickProfile = (rating: Rating, event: MouseEvent, value: number) => {
  const newRating = getStarValueFromEvent(event, value);
  hoveredRatings.value[rating.id] = newRating;
  updateRatingFromProfile(rating, newRating);
};
</script>
<template>
  <div class="mx-auto p-6">
    <h1 class="mb-8 text-3xl font-bold">
      My profile
    </h1>

    <div class="grid gap-8 lg:grid-cols-[320px_1fr]">
      <div class="rounded-xl border border-default p-6">
        <div class="mb-4 flex items-center gap-4">
          <UAvatar
              :alt="user?.user_metadata?.username || user?.email || 'User'"
              size="xl"
          />
          <div>
            <p class="text-lg font-semibold">
              {{ profile?.username || user?.user_metadata?.username || 'Utilisateur' }}
            </p>
            <p class="text-sm text-gray-500">
              {{ user?.email }}
            </p>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <p class="text-sm text-gray-500">Number of ratings</p>
            <p class="text-lg font-medium">
              {{ ratings?.length ?? 0 }}
            </p>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-default p-6">
        <h2 class="mb-4 text-xl font-semibold">
          My ratings
        </h2>

        <div v-if="!ratings?.length" class="text-sm text-gray-500">
          No ratings for the moment.
        </div>

        <div v-else class="overflow-x-auto max-h-96 overflow-y-auto flex-1 min-h-0">
          <table class="min-w-full border-collapse">
            <thead>
            <tr class="border-b border-default text-left">
              <th class="px-4 py-3">Cover</th>
              <th class="px-4 py-3">Album</th>
              <th class="px-4 py-3">Artist</th>
              <th class="px-4 py-3">Rate</th>
              <th class="px-4 py-3">Release date</th>
            </tr>
            </thead>
            <tbody>
            <tr
                v-for="rating in ratings"
                :key="rating.id"
                class="border-b border-default hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
            >
              <td class="px-4 py-3">
                <img
                    v-if="rating.albums?.cover_url"
                    :src="rating.albums.cover_url"
                    :alt="rating.albums.title"
                    class="h-14 w-14 rounded object-cover cursor-pointer"
                    referrerpolicy="no-referrer"
                    @click="navigateTo({ path: '/album', query: { id: rating.albums?.id } })"
                >
                <div
                    v-else
                    class="flex h-14 w-14 items-center justify-center rounded bg-gray-100 text-gray-400 cursor-pointer"
                    @click="rating.albums?.id && navigateTo({ path: '/album', query: { id: rating.albums.id } })"
                >
                  <UIcon name="i-lucide-music"/>
                </div>
              </td>

              <td class="px-4 py-3 font-medium">
                {{ rating.albums?.title || '-' }}
              </td>

              <td class="px-4 py-3 text-sm text-gray-600">
                {{ rating.albums?.artist || '-' }}
              </td>

              <td class="px-4 py-3">
                <div class="flex items-center gap-1">
                  <span
                      v-for="value in 5"
                      :key="value"
                      class="relative inline-flex h-4 w-4 cursor-pointer"
                      @click.stop="handleStarClickProfile(rating, $event as MouseEvent, value)"
                      @mousemove.stop="handleStarHoverProfile(rating, $event as MouseEvent, value)"
                      @mouseleave.stop="handleStarLeaveProfile(rating)"
                  >
                    <UIcon
                        name="i-heroicons-star-20-solid"
                        class="h-4 w-4 text-gray-300 dark:text-gray-600"
                    />
                    <UIcon
                        v-if="getRowDisplayedRating(rating) > 0 && value - 1 < getRowDisplayedRating(rating)"
                        name="i-heroicons-star-20-solid"
                        class="absolute inset-0 h-4 w-4 text-amber-400"
                        :style="value <= getRowDisplayedRating(rating)
                          ? {}
                          : { clipPath: 'inset(0 50% 0 0)' }"
                    />
                  </span>
                </div>
              </td>

              <td class="px-4 py-3 text-sm text-gray-500">
                {{ new Date(rating.created_at).toLocaleDateString('fr-FR') }}
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>