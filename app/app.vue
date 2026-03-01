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
const isSigningOut = ref(false);

const searchQuery = ref('');
const searchResults = ref<Album[]>([]);
const isSearching = ref(false);
let searchTimeout: string | number | NodeJS.Timeout | undefined;


const handleCoverError = (albumId: string) => {
  const album = searchResults.value.find((album) => album.id === albumId);
  if (album) {
    album.hasCoverError = true;
  }
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
}

watch(searchQuery, (value) => {
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
    <UHeader>
      <!-- User part -->
      <template #left>
        <div class="w-full max-w-xs relative">
          <UInput
              v-model="searchQuery"
              class="w-full"
              icon="i-lucide-search"
              placeholder="Search for an album..."
              autocomplete="off"
          />
          <div
              v-if="searchQuery.trim().length > 2 "
              class="absolute z-50 mt-2 w-full rounded-md border border-default bg-default shadow-lg"
          >
            <div
                v-if="isSearching"
                class="p-3 text-sm text-gray-500"
            >
              Searching...
            </div>

            <ul v-else-if="searchResults.length" class="overflow-auto">
              <li
                  v-for="album in searchResults"
                  :key="album.id"
                  class="flex items-center gap-3 p-3 border-b border-default last:border-b-0"
              >
                <!-- Album cover -->
                <img
                    v-if="album.coverUrl && !album.hasCoverError"
                    :src="album.coverUrl"
                    alt="Album cover"
                    class="w-12 h-12 rounded object-cover bg-gray-100 shrink-0"
                    loading="lazy"
                    referrerpolicy="no-referrer"
                    @error="handleCoverError(album.id)"
                >
                <div
                    v-else
                    class="w-12 h-12 rounded bg-gray-100 shrink-0 flex items-center justify-center text-gray-500"
                >
                  <UIcon name="i-lucide-music" class="w-5 h-5"/>
                </div>
                <!-- Album info -->
                <div class="min-w-0">
                  <p class="font-medium text-sm">{{ album.title }}</p>
                  <p class="text-xs text-gray-500 truncate">
                    {{ album.artist }}<span v-if="album.date"> • {{ album.date }}</span>
                  </p>
                </div>
              </li>
            </ul>

            <div v-else class="p-3 text-sm text-gray-500">
              No album found for "{{ searchQuery }}"
            </div>
          </div>
        </div>
      </template>

      <!-- User part -->
      <template #right>
        <div v-if="user" class="flex items-center gap-2">
          <UAvatar
              :alt="user.user_metadata.username"
              size="sm"
          />
          <div class="flex flex-col">
            <span class="text-sm font-medium">{{ user.user_metadata.username }}</span>
            <span class="text-xs text-gray-500">{{ user.email }}</span>
          </div>
          <UButton
              v-if="user"
              color="neutral"
              variant="ghost"
              :loading="isSigningOut"
              @click="handleSignOut"
          >
            <UIcon name="i-lucide-log-out" class="w-4 h-4"/>
          </UButton>
          <UColorModeButton/>
        </div>
      </template>
    </UHeader>

    <UMain>
      <NuxtPage/>
    </UMain>

    <USeparator icon="i-simple-icons-nuxtdotjs"/>

    <UFooter>
      footer
    </UFooter>
  </UApp>
</template>
