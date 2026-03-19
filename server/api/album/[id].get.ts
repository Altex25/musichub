import {serverSupabaseClient, serverSupabaseServiceRole} from '#supabase/server'
import type {Database} from '~~/database.types'
import {uuidToDiscogsId, discogsHeaders} from '~~/server/utils/discogs'

type DiscogsMaster = {
    id: number
    title: string
    year?: number
    artists?: Array<{name: string; anv?: string}>
    images?: Array<{type: string; uri: string; uri150: string}>
}

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const config = useRuntimeConfig()

    if (!id) {
        throw createError({statusCode: 400, statusMessage: 'Missing album id'})
    }

    const supabase = await serverSupabaseClient<Database>(event)
    const admin = serverSupabaseServiceRole<Database>(event)

    // 1. Try DB first
    const {data: album, error} = await supabase
        .from('albums')
        .select('*')
        .eq('id', id)
        .single()

    let albumData = album

    if (error || !albumData) {
        // 2. Discogs fallback — decode the Discogs release ID from the UUID
        const discogsId = uuidToDiscogsId(id)

        if (discogsId === null) {
            throw createError({statusCode: 404, statusMessage: 'Album not found'})
        }

        try {
            const master = await $fetch<DiscogsMaster>(
                `https://api.discogs.com/masters/${discogsId}`,
                {headers: discogsHeaders(config.discogsToken)}
            )

            const primaryImage =
                master.images?.find((img) => img.type === 'primary') ??
                master.images?.[0]

            albumData = {
                id,
                title: master.title,
                artist: master.artists?.map((a) => a.anv || a.name).join(', ') ?? 'Unknown artist',
                first_release_date: master.year ? String(master.year) : '',
                cover_url: primaryImage?.uri ?? primaryImage?.uri150 ?? '',
                source: 'Discogs',
                raw: null,
                created_at: null
            } as unknown as typeof album
        } catch {
            throw createError({statusCode: 404, statusMessage: 'Album not found'})
        }
    }

    // 3. Fetch community stats (bypasses RLS)
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
        const {data: allRatings} = await admin
            .from('ratings')
            .select('rating')
            .eq('album_id', id)

        if (allRatings && allRatings.length > 0) {
            ratingCount = allRatings.length
            const sum = allRatings.reduce((acc, r) => acc + (r.rating as number), 0)
            ratingAvg = sum / ratingCount

            await admin
                .from('album_rating_stats')
                .upsert(
                    {
                        album_id: id,
                        rating_sum: sum,
                        rating_count: ratingCount,
                        rating_avg: ratingAvg,
                        updated_at: new Date().toISOString()
                    },
                    {onConflict: 'album_id'}
                )
        }
    }

    return {
        ...albumData,
        rating_avg: ratingAvg,
        rating_count: ratingCount
    }
})
