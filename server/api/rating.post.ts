import {serverSupabaseClient, serverSupabaseServiceRole, serverSupabaseUser} from '#supabase/server'
import type {Database} from '~~/database.types'

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event)
    const body = await readBody(event)

    if (!user) {
        throw createError({statusCode: 401, statusMessage: 'Unauthorized'})
    }

    const albumId = typeof body.albumId === 'string' ? body.albumId.trim() : ''
    const rating = Number(body.rating)

    if (!albumId) {
        throw createError({statusCode: 400, statusMessage: 'Missing albumId'})
    }

    if (isNaN(rating) || rating < 0.5 || rating > 5) {
        throw createError({statusCode: 400, statusMessage: 'Rating must be between 0.5 and 5'})
    }

    const supabase = await serverSupabaseClient<Database>(event)

    const {error} = await supabase
        .from('ratings').upsert({
            user_id: user.sub,
            album_id: albumId,
            rating,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'user_id, album_id'
        })

    if (error) {
        console.error('ratings insert error:', error)
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        })
    }

    // Recalculate and upsert aggregate stats for this album
    const {data: allRatings, error: aggregateError} = await supabase
        .from('ratings')
        .select('rating')
        .eq('album_id', albumId)

    if (aggregateError) {
        console.error('ratings aggregate error:', aggregateError)
        throw createError({
            statusCode: 500,
            statusMessage: aggregateError.message
        })
    }

    const ratingCount = allRatings?.length ?? 0
    const ratingSum = allRatings?.reduce((sum, r) => sum + (r.rating as number), 0) ?? 0
    const ratingAvg = ratingCount > 0 ? ratingSum / ratingCount : 0

    const adminSupabase = serverSupabaseServiceRole<Database>(event)

    const {error: statsError} = await adminSupabase
        .from('album_rating_stats')
        .upsert({
            album_id: albumId,
            rating_sum: ratingSum,
            rating_count: ratingCount,
            rating_avg: ratingAvg,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'album_id'
        })

    if (statsError) {
        console.error('album_rating_stats upsert error:', statsError)
        throw createError({
            statusCode: 500,
            statusMessage: statsError.message
        })
    }

    return {success: true}
})