import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Prefetch (hover num <Link>, ou o próprio Next.js antecipando a
    // navegação) não precisa — e não deveria — disparar um refresh de
    // sessão: a navegação real que vier em seguida já faz isso. Deixar
    // passar aqui evita duas requisições quase simultâneas tentando
    // renovar o MESMO refresh token (uma da navegação real, outra do
    // prefetch): o Supabase rotaciona o refresh token a cada uso e detecta
    // reuso como possível roubo de sessão — a segunda tentativa "reaproveita"
    // um token que a primeira já invalidou, e a proteção de reuso revoga a
    // sessão inteira. Sintoma exatamente como "preciso logar de novo toda
    // hora": a pessoa não fez nada de errado, foram duas requisições do
    // próprio navegador competindo pelo mesmo token.
    const ehPrefetch =
        request.headers.get('next-router-prefetch') === '1' ||
        request.headers.get('purpose') === 'prefetch' ||
        request.headers.get('sec-purpose')?.includes('prefetch')

    if (ehPrefetch) {
        return response
    }

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value)
                    })
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, { ...options, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' })
                    )
                },
            },
        }
    )

    await supabase.auth.getUser()

    return response
}