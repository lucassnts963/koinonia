import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                // Novo método: Pega todos os cookies de uma vez
                getAll() {
                    return cookieStore.getAll()
                },
                // Novo método: Seta todos os cookies de uma vez (Auth token, Refresh token, etc)
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, { ...options, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' })
                        )
                    } catch {
                        // O bloco try/catch é necessário porque este cliente pode ser chamado
                        // de um Server Component (que não pode escrever cookies).
                        // Se isso acontecer, ignoramos o erro, pois o Middleware já deve
                        // ter cuidado da sessão.
                    }
                },
            },
        }
    )
}