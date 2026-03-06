import {serverSupabaseClient, serverSupabaseUser} from '#supabase/server';

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);

    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized'
        });
    }

    const body = await readBody(event);
    const albumId = typeof body.albumId === 'string' ? body.albumId : '';
    const rating = Number(body.rating);

    if (!albumId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing albumId'
        });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Rating must be between 1 and 5'
        })
    }

    const supabase = await serverSupabaseClient(event);

    const {data, error} = await supabase
        .from('ratings')
        .upsert(
            {
                user_id: user.id,
                album_id: albumId,
                rating,
                updated_at: new Date().toISOString()
            },
            {
                onConflict: 'user_id, album_id'
            }
        )
        .select()
        .single();

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        });
    }

    return data;
});