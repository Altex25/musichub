import {z} from 'zod';
import {serverSupabaseServiceRole} from '#supabase/server';

const schema = z.object({
    username: z.string().min(1)
});

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
        throw createError({statusCode: 400, statusMessage: 'Bad Request'});
    }

    const admin = serverSupabaseServiceRole(event);

    const {data: profile, error: profileError} = await admin
        .from('profiles')
        .select('user_id')
        .ilike('username', parsed.data.username.trim())
        .maybeSingle();

    if (profileError || !profile) {
        throw createError({statusCode: 404, statusMessage: 'Username not found'});
    }

    const {data: user, error: userError} = await admin.auth.admin.getUserById(profile.user_id);

    if (userError || !user?.user?.email) {
        throw createError({statusCode: 404, statusMessage: 'Username not found'});
    }

    return {email: user.user.email};
});
