import {serverSupabaseClient} from "#supabase/server";

export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    const id = typeof body.id === 'string' ? body.id : '';
    const source = typeof body.source === 'string' ? body.source : '';
    const title = typeof body.title === 'string' ? body.title : '';
    const artist = typeof body.artist === 'string' ? body.artist : '';
    const firstReleaseDate = typeof body.firstReleaseDate === 'string' ? body.firstReleaseDate : '';
    const coverUrl = typeof body.coverUrl === 'string' ? body.coverUrl : '';
    const raw = body.raw ?? null;

    if (!id || !title || !artist) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing required fields'
        });
    }
    const supabase = await serverSupabaseClient(event);

    const {data, error} = await supabase
        .from('albums')
        .upsert(
            {
                id,
                source,
                title,
                artist: artist,
                first_release_date: firstReleaseDate,
                cover_url: coverUrl,
                raw,
                created_at: new Date().toISOString()
            },
            {
                onConflict: 'id'
            }
        )
        .select()
        .single()

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        })
    }

    return data;
});