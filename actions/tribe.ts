'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type TribeData = {
    me: any
    mentor: any | null
    disciples: any[]
}

export async function getTribeData(): Promise<TribeData> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Não autenticado")

    // 1. Buscar meus dados e quem é meu mentor
    const { data: me } = await supabase
        .from('profiles')
        .select('*, mentor:mentor_id (full_name, username, avatar_url, stature_level)')
        .eq('id', user.id)
        .single()

    // 2. Buscar meus discípulos (quem tem meu ID como mentor_id)
    const { data: disciples } = await supabase
        .from('profiles')
        .select('*')
        .eq('mentor_id', user.id)
        .order('talents_balance', { ascending: false }) // Ranking por XP

    return {
        me,
        mentor: me?.mentor, // O Supabase já faz o join se configurado, ou tratamos aqui
        disciples: disciples || []
    }
}

// Action para entrar na tribo de alguém
export async function joinTribeAction(leaderUsername: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: "Faça login novamente." }

    // 1. Achar o líder pelo username
    const { data: leader } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', leaderUsername)
        .single()

    if (!leader) {
        return { success: false, message: "Líder não encontrado. Verifique o código." }
    }

    if (leader.id === user.id) {
        return { success: false, message: "Você não pode discipular a si mesmo!" }
    }

    // 2. Atualizar meu perfil
    const { error } = await supabase
        .from('profiles')
        .update({ mentor_id: leader.id })
        .eq('id', user.id)

    if (error) {
        return { success: false, message: "Erro ao entrar na tribo." }
    }

    revalidatePath('/app/discipulado')
    return { success: true, message: "Você agora faz parte desta Tribo!" }
}