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

const albumId = computed(() => {
  const id = route.query.id;
  return typeof id === 'string' ? id : '';
});

const {data: album, pending, error} = await useFetch<AlbumDetails>(() =>
    albumId.value ? `/api/album/${albumId.value}` : null
);

const selectedRating = ref<number | null>(null);
const isSavingRating = ref(false);
const ratingMessage = ref('');

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

    ratingMessage.value = 'Rating successfully added.';
  } catch {
    ratingMessage.value = 'Error while adding the rate.';
  } finally {
    selectedRating.value = null;
    isSavingRating.value = false;
  }
};
</script>

<template>
  <!-- Album details part  -->
  <div>
    <div class="flex w-full py-6 ml-4">
      <div v-if="!albumId" class="text-center py-12">
        <h1 class="text-4xl font-bold">No album selected</h1>
        <p class="mt-2 text-gray-500">Missing album id in URL</p>
      </div>

      <div v-else-if="pending" class="text-center py-12">
        <p class="text-gray-500">Loading album details...</p>
      </div>

      <div v-else-if="error || !album" class="text-center py-12">
        <h1 class="text-4xl font-bold">Album not found</h1>
        <p class="mt-2 text-gray-500">Unable to load this album</p>
      </div>

      <div v-else class="grid w-full gap-8 md:grid-cols-[220px_1fr]">
        <!-- Album cover part -->
        <div class="flex justify-center md:justify-start">
          <img
              v-if="album.cover_url"
              :src="album.cover_url"
              :alt="album.title"
              class="w-56 h-56 rounded-xl object-cover shadow-md"
              referrerpolicy="no-referrer"
          >
          <div
              v-else
              class="w-56 h-56 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500"
          >
            <UIcon name="i-lucide-music"/>
          </div>
        </div>

        <!-- Album info part -->
        <div class="space-y-4">
          <div>
            <p class="text-sm text-gray-500">Album</p>
            <h1 class="text-3xl font-bold">{{ album.title }}</h1>
          </div>

          <div>
            <p class="text-sm text-gray-500">Artist</p>
            <p class="text-3xl font-bold">{{ album.artist }}</p>
          </div>

          <div>
            <p class="text-sm text-gray-500">Release date</p>
            <p class="text-3xl font-bold">{{ album.first_release_date || '-' }}</p>
          </div>
        </div>
      </div>
    </div>
    <!-- Album rating part  -->
    <div class="text-xl font-semibold mb-4 ml-4">
      <h2>Rate this album</h2>
      <div class="flex gap-2 mb-4">
        <UButton
            v-for="value in 5"
            :key="value"
            type="button"
            class="px-4 py-2 rounded border"
            :class="selectedRating === value ? 'bg-black text-white' : 'bg-white text-black'"
            @click="selectedRating = value"
        >
          {{ value }}
        </UButton>
        <UButton
            :loading="isSavingRating"
            @click="submitRating"
        >
          Save rating
        </UButton>
        <p v-if="ratingMessage" class="mt-3 text-sm text-gray-500">
          {{ ratingMessage }}
        </p>
      </div>
    </div>
  </div>
</template>