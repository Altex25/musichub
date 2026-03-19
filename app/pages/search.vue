<script setup lang="ts">
import type {Album} from '~/utils/album';

const route = useRoute();

const searchQuery = computed(() => {
  const q = route.query.q;
  return typeof q === 'string' ? q : '';
});

const page = ref(1);

const {data, pending, error} = await useAsyncData(
    () => `search-albums-${searchQuery.value}-page-${page.value}`,
    async () => {
      const query = searchQuery.value.trim();

      return await $fetch<{ albums: Album[]; total: number }>('/api/discogs/albums', {
        query: {
          q: query,
          page: page.value
        }
      });
    },
    {
      watch: [searchQuery, page]
    }
);

const albums = computed<Album[]>(() => data.value?.albums ?? []);
const total = computed(() => data.value?.total ?? 0);

const hasPreviousPage = computed(() => page.value > 1);
const hasNextPage = computed(() => page.value * 10 < total.value);

const handleCoverError = (albumId: string) => {
  const album = albums.value.find((album) => album.id === albumId);
  if (album) {
    album.hasCoverError = true;
  }
};

const openAlbumDetails = async (album: Album) => {
  // Await the DB save so the album page finds data in DB and skips the Discogs API call
  await $fetch('/api/discogs/album', {
    method: 'POST',
    body: {
      id: album.id,
      source: 'Discogs',
      title: album.title,
      artist: album.artist,
      firstReleaseDate: normalizeFirstReleaseDate(album.date),
      coverUrl: album.coverUrl,
      raw: album
    }
  }).catch(() => {});

  await navigateTo({
    path: '/album',
    query: {id: album.id}
  });
};

watch(searchQuery, () => {
  page.value = 1;
});
</script>

<template>
  <div class="min-h-[calc(100vh-8rem)] bg-zinc-50 dark:bg-zinc-950">
    <div class="mx-auto max-w-4xl px-4 py-10">
      <div class="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 class="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Search results
          </h1>
          <p class="mt-0.5 text-sm text-zinc-500">
            Results for <span class="font-medium text-zinc-700 dark:text-zinc-300">"{{ searchQuery }}"</span>
          </p>
        </div>
        <div v-if="pending" class="flex items-center gap-1.5 text-xs text-zinc-400 pt-1">
          <UIcon name="i-lucide-loader-2" class="h-3.5 w-3.5 animate-spin" />
          Loading...
        </div>
      </div>

      <div v-if="error" class="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
        An error occurred while searching for albums.
      </div>

      <div v-else-if="!albums.length && !pending" class="flex flex-col items-center justify-center py-20 text-center">
        <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <UIcon name="i-lucide-search-x" class="h-6 w-6 text-zinc-400" />
        </div>
        <p class="text-sm font-medium text-zinc-700 dark:text-zinc-300">No album found</p>
        <p class="mt-1 text-xs text-zinc-500">Try a different search term</p>
      </div>

      <div v-else class="space-y-5">
        <div class="grid gap-3 sm:grid-cols-2">
          <button
              v-for="album in albums"
              :key="album.id"
              type="button"
              class="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 text-left transition-all hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/10 hover:shadow-sm"
              @click="openAlbumDetails(album)"
          >
            <img
                v-if="album.coverUrl && !album.hasCoverError"
                :src="album.coverUrl"
                alt="Album cover"
                class="h-16 w-16 shrink-0 rounded-lg object-cover bg-zinc-100"
                loading="lazy"
                referrerpolicy="no-referrer"
                @error="handleCoverError(album.id)"
            >
            <div
                v-else
                class="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
            >
              <UIcon name="i-lucide-disc-3" class="h-6 w-6" />
            </div>

            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {{ album.title }}
              </p>
              <p class="truncate text-xs text-zinc-500 mt-0.5">
                {{ album.artist }}<span v-if="album.date"> · {{ album.date }}</span>
              </p>
            </div>

            <UIcon name="i-lucide-chevron-right" class="h-4 w-4 shrink-0 text-zinc-300 dark:text-zinc-600" />
          </button>
        </div>

        <div class="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-4">
          <span class="text-xs text-zinc-400">Page {{ page }}</span>
          <div class="flex gap-2">
            <UButton
                size="xs"
                color="neutral"
                variant="outline"
                :disabled="!hasPreviousPage || pending"
                @click="page--"
            >
              <UIcon name="i-lucide-chevron-left" class="h-3.5 w-3.5" />
              Previous
            </UButton>
            <UButton
                size="xs"
                color="neutral"
                variant="outline"
                :disabled="!hasNextPage || pending"
                @click="page++"
            >
              Next
              <UIcon name="i-lucide-chevron-right" class="h-3.5 w-3.5" />
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

