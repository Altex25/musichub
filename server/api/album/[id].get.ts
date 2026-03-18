import {serverSupabaseClient, serverSupabaseServiceRole} from '#supabase/server'
import type {Database} from '~~/database.types'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing album id'
        })
    }

    const supabase = await serverSupabaseClient<Database>(event)
    const admin = serverSupabaseServiceRole<Database>(event)

    // Fetch album from DB
    const {data: album, error} = await supabase
        .from('albums')
        .select('*')
        .eq('id', id)
        .single()

    let albumData = album

    if (error || !albumData) {
        // Fallback: album not yet in DB — fetch directly from MusicBrainz
        try {
            const release = await $fetch<{
                id: string;
                title: string;
                date?: string;
                'artist-credit'?: Array<{ name: string }>;
            }>(`https://musicbrainz.org/ws/2/release/${id}`, {
                query: {fmt: 'json', inc: 'artist-credits'},
                headers: {'User-Agent': 'MusicHub/1.0.0 (alexandre.py@ynov.com)'}
            })

            albumData = {
                id: release.id,
                title: release.title,
                artist: release['artist-credit']?.map((a) => a.name).join(', ') ?? 'Unknown artist',
                first_release_date: release.date ?? null,
                cover_url: `https://coverartarchive.org/release/${id}/front-250`,
                source: 'MusicBrainz',
                raw: null,
                created_at: null
            } as unknown as typeof album
        } catch {
            throw createError({
                statusCode: 404,
                statusMessage: 'Album not found'
            })
        }
    }

    // Fetch stats using service role to bypass RLS
    const {data: stats} = await admin
        .from('album_rating_stats')
        .select('rating_avg, rating_count')
        .eq('album_id', id)
        .maybeSingle()

    let ratingAvg: number | null = null
    let ratingCount = 0

    if (stats && (stats.rating_count as number) > 0) {
        ratingAvg = stats.rating_avg as number
        ratingCount = stats.rating_count as number
    } else {
        // Fallback: compute from individual ratings + backfill album_rating_stats
        const {data: allRatings} = await admin
            .from('ratings')
            .select('rating')
            .eq('album_id', id)

        if (allRatings && allRatings.length > 0) {
            ratingCount = allRatings.length
            const sum = allRatings.reduce((acc, r) => acc + (r.rating as number), 0)
            ratingAvg = sum / ratingCount

            // Backfill so next visit is instant
            await admin
                .from('album_rating_stats')
                .upsert({
                    album_id: id,
                    rating_sum: sum,
                    rating_count: ratingCount,
                    rating_avg: ratingAvg,
                    updated_at: new Date().toISOString()
                }, {onConflict: 'album_id'})
        }
    }

    return {
        ...albumData,
        rating_avg: ratingAvg,
        rating_count: ratingCount
    }
})
