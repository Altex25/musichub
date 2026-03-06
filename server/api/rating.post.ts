import {serverSupabaseClient, serverSupabaseUser} from '#supabase/server'
import type {Database} from '~~/database.types'

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event)
    const body = await readBody(event)

    const albumId = typeof body.albumId === 'string' ? body.albumId : ''
    const rating = Number(body.rating)

    console.log('serverSupabaseUser:', user)
    console.log('body:', body)
    console.log('insert payload:', {
        user_id: user?.sub,
        album_id: albumId,
        rating
    });

    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized'
        })
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
})