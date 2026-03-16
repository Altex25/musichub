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
    const page = Number(getQuery(event).page ?? 1) || 1;

    if (query.length < 3) {
        return {albums: [] as AlbumResult[]};
    }

    const limit = 10;
    const offset = (page - 1) * limit;

    const url = new URL('https://musicbrainz.org/ws/2/release/');
    const mbQuery = `release:(${query}) AND status:official AND primarytype:album`;
    url.searchParams.append('query', mbQuery);
    url.searchParams.append('fmt', 'json');
    url.searchParams.append('limit', String(limit));
    url.searchParams.append('offset', String(offset));

    const data = await $fetch<MusicBrainzResponse>(url.toString(), {
        headers: {
            'User-Agent': 'MusicHub/1.0.0 (alexandre.py@ynov.com)'
        }
    });
    const releases = data.releases ?? [];

    // Map to intermediate structure with a simple relevance score
    const albumsWithScore = await Promise.all(
        releases.map(async (release) => {
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

            const title = release.title ?? '';
            const normalizedTitle = title.toLowerCase();
            const normalizedQuery = query.toLowerCase();

            let score = 0;
            if (normalizedTitle === normalizedQuery) {
                score += 3;
            } else if (normalizedTitle.includes(normalizedQuery)) {
                score += 1;
            }

            if (finalCoverUrl) {
                score += 1;
            }

            return {
                score,
                album: {
                    id: release.id,
                    title,
                    artist: release['artist-credit']
                        ?.map((a) => a.name)
                        .filter(Boolean)
                        .join(', ') || 'Unknown artist',
                    date: release.date,
                    coverUrl: finalCoverUrl ?? ''
                } as AlbumResult
            };
        })
    );

    // Sort by score (highest first) while preserving original order for ties
    albumsWithScore.sort((a, b) => b.score - a.score);

    const albums = albumsWithScore.map((entry) => entry.album);

    return {albums};
});