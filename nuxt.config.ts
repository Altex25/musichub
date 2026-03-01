// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-01-15',
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
            exclude: ['/', '/auth/login', '/auth/register'],
            login: "/auth/login",
            callback: "/confirm"
        }
    }
})
