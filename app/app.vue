<script setup lang="ts">
type Album = {
  id: string;
  title: string;
  artist: string;
  date?: string;
  coverUrl?: string;
  hasCoverError?: boolean;
};

useHead({
  meta: [
    {name: 'viewport', content: 'width=device-width, initial-scale=1'}
  ],
  link: [
    {rel: 'icon', href: '/favicon.ico'}
  ],
  htmlAttrs: {
    lang: 'fr'
  }
})

const title = 'MusicHub'
const description = ''

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage: 'https://ui.nuxt.com/assets/templates/nuxt/starter-light.png',
  twitterImage: 'https://ui.nuxt.com/assets/templates/nuxt/starter-light.png',
  twitterCard: 'summary_large_image'
})

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const route = useRoute()
const isSigningOut = ref(false);

const searchQuery = ref('');
const searchResults = ref<Album[]>([]);
const isSearching = ref(false);
const showSuggestions = ref(true);
let searchTimeout: string | number | NodeJS.Timeout | undefined;

const isSearchPage = computed(() => route.path === '/search');

const handleCoverError = (albumId: string) => {
  const album = searchResults.value.find((album) => album.id === albumId);
  if (album) {
    album.hasCoverError = true;
  }
};

const handleSearchSubmit = async () => {
  const query = searchQuery.value.trim();

  if (!query) {
    return;
  }

  showSuggestions.value = false;
  searchResults.value = [];

  await navigateTo({
    path: '/search',
    query: {q: query}
  });
};

const handleSignOut = async () => {
  try {
    isSigningOut.value = true;
    await supabase.auth.signOut();
    await navigateTo('/');
  } finally {
    isSigningOut.value = false;
  }
}

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

  searchQuery.value = '';
  searchResults.value = [];

  await navigateTo({
    path: '/album',
    query: {id: album.id}
  });
}

const searchAlbums = async (query: string) => {
  if (query.trim().length < 3) {
    searchResults.value = [];
    return;
  }

  isSearching.value = true;

  try {
    const res = await $fetch<{
      albums: Array<Album>
    }>('/api/musicbrainz/albums', {
      query: {q: query.trim()}
    });

    searchResults.value = res?.albums ?? [];
  } catch {
    searchResults.value = [];
  } finally {
    isSearching.value = false;
  }
};

const clearSearch = () => {
  showSuggestions.value = false;
};

watch(searchQuery, (value) => {
  showSuggestions.value = true;

  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  searchTimeout = setTimeout(() => {
        searchAlbums(value)
      },
      350);
});

onBeforeUnmount(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
});

</script>

<template>
  <UApp>
    <UHeader class="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <template #left>
        <div class="flex w-full items-center gap-6">
          <NuxtLink
              to="/"
              class="hidden sm:inline-flex items-center gap-2 shrink-0 group"
          >
            <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 dark:bg-primary-500">
              <UIcon name="i-lucide-music" class="h-4 w-4 text-white" />
            </div>
            <span class="text-sm font-bold tracking-tight text-zinc-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              MusicHub
            </span>
          </NuxtLink>

          <div class="flex-1 max-w-lg relative">
            <form @submit.prevent="handleSearchSubmit">
              <UInput
                  v-model="searchQuery"
                  class="w-full"
                  icon="i-lucide-search"
                  placeholder="Search for an album..."
                  autocomplete="off"
                  size="md"
                  @keydown.esc="clearSearch"
              />
            </form>
            <div
                v-if="showSuggestions && searchQuery.trim().length > 2"
                class="absolute z-50 mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg overflow-hidden"
            >
              <div
                  v-if="isSearching"
                  class="flex items-center gap-2 px-4 py-3 text-sm text-zinc-500"
              >
                <UIcon name="i-lucide-loader-2" class="h-3.5 w-3.5 animate-spin" />
                Searching...
              </div>

              <ul v-else-if="searchResults.length">
                <li
                    v-for="album in searchResults.slice(0, 3)"
                    :key="album.id"
                    class="border-b border-zinc-100 dark:border-zinc-800 last:border-b-0"
                >
                  <button
                      type="button"
                      class="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors cursor-pointer"
                      @click="openAlbumDetails(album)"
                  >
                    <img
                        v-if="album.coverUrl && !album.hasCoverError"
                        :src="album.coverUrl"
                        alt="Album cover"
                        class="h-10 w-10 rounded-md object-cover shrink-0 bg-zinc-100"
                        loading="lazy"
                        referrerpolicy="no-referrer"
                        @error="handleCoverError(album.id)"
                    >
                    <div
                        v-else
                        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                    >
                      <UIcon name="i-lucide-music" class="h-4 w-4" />
                    </div>
                    <div class="min-w-0">
                      <p class="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{{ album.title }}</p>
                      <p class="truncate text-xs text-zinc-500">
                        {{ album.artist }}<span v-if="album.date"> · {{ album.date }}</span>
                      </p>
                    </div>
                  </button>
                </li>
              </ul>

              <div v-else class="px-4 py-3 text-sm text-zinc-500">
                No result for "{{ searchQuery }}"
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #right>
        <div v-if="user" class="flex items-center gap-3">
          <NuxtLink
              to="/profile"
              class="flex items-center gap-2.5 rounded-lg px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <UAvatar
                :alt="user.user_metadata?.username"
                size="sm"
            />
            <div class="hidden md:flex flex-col leading-none">
              <span class="text-sm font-medium text-zinc-900 dark:text-zinc-100">{{ user.user_metadata?.username }}</span>
              <span class="text-xs text-zinc-500">{{ user.email }}</span>
            </div>
          </NuxtLink>
          <UButton
              color="neutral"
              variant="ghost"
              size="sm"
              :loading="isSigningOut"
              @click="handleSignOut"
          >
            <UIcon name="i-lucide-log-out" class="h-4 w-4" />
          </UButton>
          <UColorModeButton />
        </div>

        <div v-else class="flex items-center gap-2">
          <UButton
              color="primary"
              variant="solid"
              size="sm"
              to="/auth/login"
          >
            Sign in
          </UButton>
          <UColorModeButton />
        </div>
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>

    <footer class="border-t border-zinc-200 dark:border-zinc-800 py-6">
      <div class="mx-auto max-w-5xl px-4 flex items-center justify-between text-xs text-zinc-400">
        <div class="flex items-center gap-1.5">
          <UIcon name="i-lucide-music" class="h-3.5 w-3.5" />
          <span class="font-medium">MusicHub</span>
        </div>
        <span>Powered by MusicBrainz</span>
      </div>
    </footer>
  </UApp>
</template>
