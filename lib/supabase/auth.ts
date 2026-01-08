import { type SupabaseClient } from '@supabase/supabase-js'

export async function getSafeUser(supabase: SupabaseClient) {
    try {
        // 1. Tenta a validação robusta (vai no banco checar se o user existe/não foi banido)
        const { data: { user }, error } = await supabase.auth.getUser()

        if (user) return user

        // 2. Análise de Erro para Ambiente de Desenvolvimento
        // Se estivermos em DEV e o erro for de conexão (fetch failed) ou servidor (500),
        // é provável que seja o problema de rede do Docker.
        const isDev = process.env.NODE_ENV === 'development'

        if (error && isDev) {
            // Verifica se é erro de rede/fetch ou timeout
            const isNetworkError = error.message.includes('fetch') || error.status === 500

            if (isNetworkError) {
                console.warn('⚠️ [Auth Warning] getUser() falhou por rede. Usando fallback getSession() (Apenas DEV).')

                // Fallback inseguro (apenas lê o cookie), mas permite trabalhar local
                const { data: { session } } = await supabase.auth.getSession()
                return session?.user || null
            }
        }

        // Se não for erro de rede ou for produção, retorna null (não logado)
        return null

    } catch (err) {
        console.error('Erro inesperado na autenticação:', err)
        return null
    }
}