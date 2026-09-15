'use server'

import { createClient } from '@/lib/supabase/server'

export type TriboLiderada = {
    id: string
    name: string
    slug: string
}

export type ProgressoMembro = {
    jornada_id: string
    jornada_titulo: string
    jornada_dias_totais: number
    membro_id: string
    membro_username: string | null
    dia_atual: number | null
    dias_completados: number
    is_completed: boolean
}

/**
 * Tribos onde o usuário pastoreia (leader ou shepherd) — não só a "tribo
 * principal" de getTribeData(). O discipulado é em cascata (um discípulo
 * vira líder de outra tribo), então esta lista pode crescer com o tempo;
 * a tela de gerenciar jornadas não assume uma tribo só.
 */
export async function getTribosQueLidero(): Promise<TriboLiderada[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
        .from('tribe_members')
        .select('role, tribe:tribe_id ( id, name, slug )')
        .eq('user_id', user.id)
        .in('role', ['leader', 'shepherd'])

    if (error) {
        console.error('[getTribosQueLidero]', error)
        return []
    }

    return (data ?? [])
        .map((m) => m.tribe as unknown as TriboLiderada)
        .filter((t) => t?.id)
}

/**
 * Progresso dos membros da tribo nas jornadas dela. Passa por
 * progresso_da_tribo(), security definer: user_active_plans só é visível ao
 * próprio dono via RLS normal, então sem a função o líder não enxergaria
 * nada além do próprio progresso.
 */
export async function getProgressoDaTribo(triboId: string): Promise<ProgressoMembro[]> {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('progresso_da_tribo', { alvo_tribo: triboId })

    if (error) {
        console.error('[getProgressoDaTribo]', error)
        return []
    }
    return (data ?? []) as ProgressoMembro[]
}
