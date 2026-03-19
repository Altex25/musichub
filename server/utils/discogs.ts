const DISCOGS_PREFIX = '00000000-d15c-0000-0000-'

/**
 * Converts a Discogs integer release ID to a deterministic UUID.
 * Format: 00000000-d15c-0000-0000-{12 hex chars}
 */
export function discogsIdToUuid(discogsId: number): string {
    const hex = discogsId.toString(16).padStart(12, '0')
    return `${DISCOGS_PREFIX}${hex}`
}

/**
 * Extracts the Discogs integer ID from a Discogs-encoded UUID.
 * Returns null if the UUID does not match the expected pattern.
 */
export function uuidToDiscogsId(uuid: string): number | null {
    if (!uuid.startsWith(DISCOGS_PREFIX)) return null
    const hex = uuid.slice(DISCOGS_PREFIX.length)
    if (!/^[0-9a-f]{12}$/i.test(hex)) return null
    const id = parseInt(hex, 16)
    return isNaN(id) ? null : id
}

/**
 * Returns the Discogs Authorization header value if a token is configured.
 */
export function discogsHeaders(token: string): Record<string, string> {
    const headers: Record<string, string> = {
        'User-Agent': 'MusicHub/1.0.0 +https://github.com/musichub'
    }
    if (token) {
        headers['Authorization'] = `Discogs token=${token}`
    }
    return headers
}
