import {serverSupabaseServiceRole} from '#supabase/server'
import type {Database} from '~~/database.types'

type RatingRow = {
    id: string
    rating: number
    created_at: string
    albums: {
        id: string
        title: string
        artist: string
        cover_url: string
    } | null
}

export default defineEventHandler(async (event) => {
    const username = getRouterParam(event, 'username')

    if (!username || typeof username !== 'string') {
        throw createError({statusCode: 400, statusMessage: 'Username required'})
    }

    const admin = serverSupabaseServiceRole<Database>(event)

    const {data: profile, error: profileError} = await admin
        .from('profiles')
        .select('user_id, username')
        .ilike('username', username.trim())
        .maybeSingle()

    if (profileError || !profile) {
        throw createError({statusCode: 404, statusMessage: 'Profile not found'})
    }

    const {data: ratings, error: ratingsError} = await admin
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
        .eq('user_id', profile.user_id)
        .order('created_at', {ascending: false})

    if (ratingsError) {
        throw createError({statusCode: 500, statusMessage: 'Error fetching ratings'})
    }

    const typedRatings = (ratings ?? []) as unknown as RatingRow[]

    const avgRating = typedRatings.length > 0
        ? typedRatings.reduce((sum, r) => sum + r.rating, 0) / typedRatings.length
        : null

    return {
        username: profile.username,
        ratingsCount: typedRatings.length,
        avgRating,
        ratings: typedRatings
    }
})
