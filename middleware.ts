import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
    // Essa função atualiza o cookie da sessão se ele estiver expirando
    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Aplica o middleware em todas as rotas, exceto:
         * - _next/static (arquivos estáticos)
         * - _next/image (otimização de imagens)
         * - favicon.ico (ícone)
         * - imagens (svg, png, jpg, etc)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}