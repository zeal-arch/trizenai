import { createClient } from '@supabase/supabase-js'

/**
 * Admin (service-role) Supabase client.
 *
 * - Uses SUPABASE_URL  (NOT the NEXT_PUBLIC_ one) — this is a server-only secret.
 * - Uses SUPABASE_SERVICE_ROLE_KEY — must NEVER be sent to the browser.
 * - Sessions and token refresh are disabled: every call is stateless.
 *
 * Only import this in Server Components, API Route handlers, or Edge Functions.
 * NEVER import this in client components or pages that run in the browser.
 */
export function createAdminClient() {
    // Prefer SUPABASE_URL (server-only). Fall back to the public URL for
    // deployments that only set the NEXT_PUBLIC_ variant (legacy behaviour).
    const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceRoleKey) {
        throw new Error(
            'Missing required environment variables: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY must be set for the admin client.',
        )
    }

    // Supabase returns "User not allowed" when an anon key is accidentally
    // configured here. Fail with a useful server-side configuration error.
    const jwtPayload = serviceRoleKey.split('.')[1]
    if (jwtPayload) {
        try {
            const normalizedPayload = jwtPayload.replace(/-/g, '+').replace(/_/g, '/')
            const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, '=')
            const payload = JSON.parse(Buffer.from(paddedPayload, 'base64').toString('utf8')) as { role?: string }
            if (payload.role === 'anon') {
                throw new Error('SUPABASE_SERVICE_ROLE_KEY is configured with an anon key. Use the Supabase service_role key on the server.')
            }
        } catch (error) {
            if (error instanceof Error && error.message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
                throw error
            }
        }
    }

    return createClient(url, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}
