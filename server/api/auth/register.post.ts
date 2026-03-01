import {z} from 'zod';
import {serverSupabaseClient, serverSupabaseServiceRole} from "#supabase/server";

const schema = z.object({
    username: z.string().min(3, "Invalid must have at least 3 characters"),
    email: z.email("Invalid Email"),
    password: z.string("Password required")
        .min(8, "Password should contain at least 8 characters"),
    confirmPassword: z.string("Password confirmation required"),
})
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords doesn't match"
    })

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const data = schema.safeParse(body)

    if (!data.success) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request"
        })
    }

    const {username, email, password} = data.data;
    const normalizedUsername = username.trim();

    const admin = serverSupabaseServiceRole(event);

    //Check si username est déjà utilisé
    const {data: existingUser} = await admin
        .from('profiles')
        .select('user_id')
        .ilike('username', normalizedUsername)
        .maybeSingle();

    if (existingUser) {
        throw createError({
            statusCode: 409,
            statusMessage: "Username already exists"
        });
    }

    // Create user
    const supabase = await serverSupabaseClient(event);
    const {error: signUpError} = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                username: normalizedUsername
            }
        }
    });

    if (signUpError) {
        if (/already registered|already exists/i.test(signUpError.message)) {
            throw createError({
                statusCode: 409,
                statusMessage: "Email already exists"
            });
        }

        throw createError({
            statusCode: 500,
            statusMessage: "Internal Server Error"
        });
    }

    return {
        ok: true,
        message: "Account created successfully ! Please check your email to confirm your account"
    }

})