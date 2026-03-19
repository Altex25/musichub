import {serverSupabaseServiceRole} from '#supabase/server'
import type {Database} from '~~/database.types'

type LatestRating = {
    id: string
    rating: number
    created_at: string
    albums: {
        id: string
        title: string
        artist: string
        cover_url: string
    } | null
    profiles: {
        username: string
    } | null
}

export default defineEventHandler(async (event) => {
    const admin = serverSupabaseServiceRole<Database>(event)

    const {data, error} = await admin
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
            ),
            profiles (
                username
            )
        `)
        .order('created_at', {ascending: false})
        .limit(14)

    if (error) {
        throw createError({statusCode: 500, statusMessage: 'Error fetching latest ratings'})
    }

    return (data ?? []) as unknown as LatestRating[]
})
