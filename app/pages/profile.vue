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
const userId = computed(() => user.value?.sub);

const {data: profile, error: profileError} = await useAsyncData('profile', async () => {
  if (!userId.value) {
    await navigateTo('/login');
    return null;
  }

  const {data, error} = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId.value)
      .single();

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

        <div v-else class="overflow-x-auto max-h-96 overflow-y-auto">
          <table class="min-w-full border-collapse">
            <thead>
            <tr class="border-b border-default text-left">
              <th class="px-4 py-3">Cover</th>
              <th class="px-4 py-3">Album</th>
              <th class="px-4 py-3">Artist</th>
              <th class="px-4 py-3">Rate</th>
              <th class="px-4 py-3">Date</th>
            </tr>
            </thead>
            <tbody>
            <tr
                v-for="rating in ratings"
                :key="rating.id"
                class="border-b border-default"
            >
              <td class="px-4 py-3">
                <img
                    v-if="rating.albums?.cover_url"
                    :src="rating.albums.cover_url"
                    :alt="rating.albums.title"
                    class="h-14 w-14 rounded object-cover"
                    referrerpolicy="no-referrer"
                >
                <div
                    v-else
                    class="flex h-14 w-14 items-center justify-center rounded bg-gray-100 text-gray-400"
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
                {{ rating.rating }}/5
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