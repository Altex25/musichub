import {discogsIdToUuid, discogsHeaders} from '~~/server/utils/discogs'

type DiscogsMasterResult = {
    id: number
    title: string
    year?: string
    cover_image?: string
    thumb?: string
}

type DiscogsSearchResponse = {
    results?: DiscogsMasterResult[]
    pagination?: {
        items?: number
    }
}

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const queryParams = getQuery(event)
    const q = String(queryParams.q ?? '').trim()
    const page = Number(queryParams.page ?? 1) || 1

    if (q.length < 3) {
        return {albums: [], total: 0}
    }

    const data = await $fetch<DiscogsSearchResponse>('https://api.discogs.com/database/search', {
        query: {q, type: 'master', per_page: 10, page},
        headers: discogsHeaders(config.discogsToken)
    })

    const albums = (data.results ?? []).map((result) => {
        const dashIndex = result.title.indexOf(' - ')
        const artist = dashIndex !== -1 ? result.title.slice(0, dashIndex).trim() : 'Unknown artist'
        const title = dashIndex !== -1 ? result.title.slice(dashIndex + 3).trim() : result.title

        const coverUrl = result.cover_image && !result.cover_image.includes('spacer.gif')
            ? result.cover_image
            : result.thumb && !result.thumb.includes('spacer.gif')
                ? result.thumb
                : undefined

        return {
            id: discogsIdToUuid(result.id),
            title,
            artist,
            date: result.year,
            coverUrl
        }
    })

    return {albums, total: data.pagination?.items ?? 0}
})
