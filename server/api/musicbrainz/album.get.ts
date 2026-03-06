export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const id = typeof query.id === 'string' ? query.id : '';

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request"
        });
    }

    const releaseGroup = await $fetch<{
        id: string,
        title: string,
        date: string,
        'artist-credit': Array<{ name: string }>;
    }>(`https://musicbrainz.org/ws/2/release/${id}`, {
        query: {
            fmt: 'json',
            inc: 'artist-credits'
        },
        headers: {
            'User-Agent': 'MusicHub/1.0.0 (alexandre.py@ynov.com)'
        }
    });

    const coverUrl = `https://coverartarchive.org/release/${id}/front-250`;

    return {
        id: releaseGroup.id,
        title: releaseGroup.title,
        artist: releaseGroup['artist-credit']?.map((a) => a.name).join(', ') ?? 'Unknown artist',
        date: releaseGroup.date,
        coverUrl: coverUrl
    };
})