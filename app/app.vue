<script setup>
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

const handleSignOut = async () => {
  try {
    isSigningOut.value = true;
    await supabase.auth.signOut();
    await navigateTo('/');
  } finally {
    isSigningOut.value = false;
  }
}

</script>

<template>
  <UApp>
    <UHeader>
      HEADER
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
