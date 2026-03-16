<script setup lang="ts">
type Album = {
  id: string;
  title: string;
  artist: string;
  date?: string;
  coverUrl?: string;
  hasCoverError?: boolean;
};

const route = useRoute();

const searchQuery = computed(() => {
  const q = route.query.q;
  return typeof q === 'string' ? q : '';
});

const page = ref(1);

const normalizeFirstReleaseDate = (date?: string) => {
  if (!date) {
    return undefined;
  }

  const trimmedDate = date.trim();

  if (/^\d{4}$/.test(trimmedDate)) {
    return `${trimmedDate}-01-01`;
  }

  if (/^\d{4}-\d{2}$/.test(trimmedDate)) {
    return `${trimmedDate}-01`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) {
    return trimmedDate;
  }

  return trimmedDate || undefined;
};

const {data, pending, error} = await useAsyncData(
    () => `search-albums-${searchQuery.value}-page-${page.value}`,
    async () => {
      const query = searchQuery.value.trim();

      return await $fetch<{ albums: Album[] }>('/api/musicbrainz/albums', {
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

const hasPreviousPage = computed(() => page.value > 1);
const hasNextPage = computed(() => albums.value.length === 10);

const handleCoverError = (albumId: string) => {
  const album = albums.value.find((album) => album.id === albumId);
  if (album) {
    album.hasCoverError = true;
  }
};

const openAlbumDetails = async (album: Album) => {
  await $fetch('/api/musicbrainz/album', {
    method: 'POST',
    body: {
      id: album.id,
      source: 'MusicBrainz',
      title: album.title,
      artist: album.artist,
      firstReleaseDate: normalizeFirstReleaseDate(album.date),
      coverUrl: album.coverUrl,
      raw: album
    }
  });

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
  <div class="mx-auto max-w-4xl p-6">
    <h1 class="mb-4 text-2xl font-bold">
      Search results
    </h1>
    <div class="mb-4 flex items-center justify-between">
      <p class="text-sm text-gray-500">
        Results for "{{ searchQuery }}"
      </p>
      <p v-if="pending" class="text-xs text-gray-400">
        Loading...
      </p>
    </div>

    <div v-if="error" class="text-sm text-red-500">
      An error has occurred while searching for albums.
    </div>

    <div v-else-if="!albums.length && !pending" class="text-sm text-gray-500">
      No album found for "{{ searchQuery }}".
    </div>

    <div v-else class="space-y-4">
      <div class="grid gap-4 sm:grid-cols-2">
        <button
            v-for="album in albums"
            :key="album.id"
            type="button"
            class="flex cursor-pointer items-center gap-3 rounded-lg border border-default bg-white p-3 text-left shadow-sm hover:bg-gray-50 dark:bg-gray-900"
            @click="openAlbumDetails(album)"
        >
          <!-- Album cover -->
          <img
              v-if="album.coverUrl && !album.hasCoverError"
              :src="album.coverUrl"
              alt="Album cover"
              class="h-16 w-16 shrink-0 rounded object-cover bg-gray-100"
              loading="lazy"
              referrerpolicy="no-referrer"
              @error="handleCoverError(album.id)"
          >
          <div
              v-else
              class="flex h-16 w-16 shrink-0 items-center justify-center rounded bg-gray-100 text-gray-500"
          >
            <UIcon name="i-lucide-music" class="h-6 w-6" />
          </div>

          <!-- Album info -->
          <div class="min-w-0">
            <p class="truncate text-sm font-medium">
              {{ album.title }}
            </p>
            <p class="truncate text-xs text-gray-500">
              {{ album.artist }}<span v-if="album.date"> • {{ album.date }}</span>
            </p>
          </div>
        </button>
      </div>

      <div class="flex items-center justify-between pt-2">
        <div class="text-xs text-gray-500">
          Page {{ page }}
        </div>

        <div class="flex gap-2">
          <UButton
              size="xs"
              variant="ghost"
              :disabled="!hasPreviousPage || pending"
              @click="page--"
          >
            Previous
          </UButton>
          <UButton
              size="xs"
              variant="ghost"
              :disabled="!hasNextPage || pending"
              @click="page++"
          >
            Next
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

