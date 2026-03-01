import {z} from 'zod';
import {serverSupabaseClient, serverSupabaseServiceRole} from "#supabase/server";

const schema = z.object({
    identifier: z.string().min(3),
    password: z.string().min(8)
});

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const data = schema.safeParse(body)

    if (!data.success) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request"
        })
    }

    const {identifier, password} = data.data;
    const value = identifier.trim();

    let emailToUse = value;
    const isEmail = value.includes('@');

    if (!isEmail) {
        const admin = serverSupabaseServiceRole(event);

        const {data: profile, error: profileError} = await admin
            .from('profiles')
            .select('user_id')
            .ilike('username', value)
            .maybeSingle();

        if (profileError || !profile) {
            throw createError({
                statusCode: 401,
                statusMessage: "Invalid username or password"
            });
        }

        const {data: user, error: userError} = await admin.auth.admin.getUserById(profile.user_id);

        if (userError || !user?.user?.email) {
            throw createError({
                statusCode: 401,
                statusMessage: "Invalid username or password"
            });
        }
        emailToUse = user.user.email;
    }

    const supabase = await serverSupabaseClient(event);
    const {error: signInError} = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password
    });

    if (signInError) {
        throw createError({
            statusCode: 401,
            statusMessage: "Invalid username or password"
        });
    }

    return {
        ok: true,
        message: "You are now connected !"
    }
})