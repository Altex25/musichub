type MusicBrainzRelease = {
    id: string;
    title: string;
    artist: string;
    date?: string;
    'artist-credit'?: Array<{ name?: string }>;
};

type MusicBrainzResponse = {
    releases?: MusicBrainzRelease[];
};

type AlbumResult = {
    id: string;
    title: string;
    artist: string;
    date?: string;
    coverUrl: string;
};

export default defineEventHandler(async (event) => {
    const query = String(getQuery(event).q ?? '').trim();

    if (query.length < 3) {
        return {albums: [] as AlbumResult[]};
    }

    const url = new URL('https://musicbrainz.org/ws/2/release/');
    url.searchParams.append('query', query);
    url.searchParams.append('fmt', 'json');
    url.searchParams.append('limit', '3');

    const data = await $fetch<MusicBrainzResponse>(url.toString(), {
        headers: {
            'User-Agent': 'MusicHub/1.0.0 (alexandre.py@ynov.com)'
        }
    });
    const releases = data.releases ?? [];

    const albums = await Promise.all(
        releases.map(async (release): Promise<AlbumResult> => {
            const coverUrl = `https://coverartarchive.org/release/${release.id}/front-250`;

            let finalCoverUrl: string | null = null;

            try {
                await $fetch.raw(coverUrl, {
                    method: 'HEAD',
                    headers: {
                        'User-Agent': 'MusicHub/1.0.0 (alexandre.py@ynov.com)'
                    }
                });
                finalCoverUrl = coverUrl;
            } catch {
                finalCoverUrl = null;
            }

            return {
                id: release.id,
                title: release.title,
                artist: release['artist-credit']
                    ?.map((a) => a.name)
                    .filter(Boolean)
                    .join(', ') || 'Unknown artist',
                date: release.date,
                coverUrl: finalCoverUrl ?? ''
            }
        }));


    // const albums = (data.releases ?? []).map((album) => ({
    //     id: album.id,
    //     title: album.title,
    //     artist: album['artist-credit']
    //         ?.map((a) => a.name)
    //         .filter(Boolean)
    //         .join(', ') || 'Unknown artist',
    //     date: album.date
    // }));

    return {albums};
});