'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type AcaoDeModeracao = 'ignorar' | 'ocultar' | 'arquivar'

export type Denuncia = {
    id: string
    target_type: 'discussion' | 'reply'
    target_id: string
    reason: string
    created_at: string
    resolved_at: string | null
    reporter_username: string | null
    tribe_id: string
    tribe_name: string
    conteudo: string
    autor_username: string | null
    autor_id: string | null
    discussion_id: string | null
    ja_oculto: boolean
}

/**
 * Fila de denúncias das tribos que eu pastoreio.
 *
 * A denúncia é canal de pastoreio, separado do score: nada aqui mexe em
 * reação, Talento ou ranking. Quem decide é a liderança da tribo, nunca a
 * multidão.
 */
export async function listarDenuncias(incluirResolvidas = false): Promise<Denuncia[]> {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('denuncias_da_minha_tribo', {
        incluir_resolvidas: incluirResolvidas,
    })

    if (error) {
        console.error('[listarDenuncias]', error)
        return []
    }
    return (data ?? []) as Denuncia[]
}

export async function souLideranca(): Promise<boolean> {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('sou_lideranca')
    if (error) {
        console.error('[souLideranca]', error)
        return false
    }
    return data === true
}

export async function resolverDenuncia(denunciaId: string, acao: AcaoDeModeracao) {
    const supabase = await createClient()

    const { error } = await supabase.rpc('resolver_denuncia', {
        denuncia: denunciaId,
        acao,
    })

    if (error) {
        // A função levanta mensagens já escritas para humano ("Só a liderança
        // da tribo pode resolver denúncias"), então repassar é mais útil do
        // que trocar por um genérico.
        console.error('[resolverDenuncia]', error)
        return { success: false, message: error.message ?? 'Não foi possível resolver.' }
    }

    revalidatePath('/moderacao')
    return { success: true, message: 'Denúncia resolvida.' }
}
