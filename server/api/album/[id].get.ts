import {serverSupabaseClient} from '#supabase/server'
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

    const {data, error} = await supabase
        .from('albums')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !data) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Album not found'
        })
    }

    return data
})