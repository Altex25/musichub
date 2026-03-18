import {z} from 'zod';
import {serverSupabaseServiceRole} from '#supabase/server';

const schema = z.object({
    identifier: z.string().min(1),
    password: z.string().min(1)
});

type SupabaseTokenResponse = {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
};

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
        throw createError({statusCode: 400, statusMessage: 'Bad Request'});
    }

    const {identifier, password} = parsed.data;
    let email = identifier.trim();

    // Resolve username to email server-side (email is never sent to client)
    if (!email.includes('@')) {
        const admin = serverSupabaseServiceRole(event);

        const {data: profile, error: profileError} = await admin
            .from('profiles')
            .select('user_id')
            .ilike('username', email)
            .maybeSingle();

        if (profileError || !profile) {
            throw createError({statusCode: 401, statusMessage: 'Invalid credentials'});
        }

        const {data: userData, error: userError} = await admin.auth.admin.getUserById(profile.user_id);

        if (userError || !userData?.user?.email) {
            throw createError({statusCode: 401, statusMessage: 'Invalid credentials'});
        }

        email = userData.user.email;
    }

    // Authenticate directly via Supabase REST API — email stays server-side
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw createError({statusCode: 500, statusMessage: 'Server configuration error'});
    }

    const session = await $fetch<SupabaseTokenResponse>(
        `${supabaseUrl}/auth/v1/token?grant_type=password`,
        {
            method: 'POST',
            headers: {
                apikey: supabaseAnonKey,
                'Content-Type': 'application/json'
            },
            body: {email, password}
        }
    ).catch(() => {
        throw createError({statusCode: 401, statusMessage: 'Invalid credentials'});
    });

    // Return only the session tokens — never the email
    return {
        access_token: session.access_token,
        refresh_token: session.refresh_token
    };
});
