// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-01-15',

    runtimeConfig: {
        discogsToken: process.env.DISCOGS_TOKEN ?? ''
    },

    modules: [
        '@nuxt/eslint',
        '@nuxt/ui',
        '@nuxtjs/supabase'
    ],

    devtools: {
        enabled: true
    },

    css: ['~/assets/css/main.css'],
    supabase: {
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_KEY,
        secretKey: process.env.SUPABASE_SECRET_KEY,
        types: '~/types/database.types.ts',
        redirectOptions: {
            // pages accessibles sans être connecté
            exclude: ['/', '/search', '/search/**', '/album', '/album/**', '/auth/login', '/auth/register', '/confirm', '/profile/*', '/profile/**'],
            login: "/auth/login",
            callback: "/confirm"
        }
    }
})
