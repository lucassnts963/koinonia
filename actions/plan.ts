'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getPlanStatus() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Busca progresso. Se não existe, cria (fallback ou trigger)
    let { data: progress } = await supabase
        .from('user_plan_progress')
        .select('*')
        .eq('user_id', user.id)
        .single()

    // Auto-create se não existe
    if (!progress) {
        const { data: newProgress, error } = await supabase
            .from('user_plan_progress')
            .insert({ user_id: user.id, current_day: 1 })
            .select()
            .single()

        if (!error) progress = newProgress
    }

    // Busca TODOS os dias do plano (para renderizar a trilha)
    // Em produção, talvez buscar paginado ou apenas arredores do current_day
    const { data: days } = await supabase
        .from('reading_plan_days')
        .select('*')
        .order('day_number')

    return {
        progress: progress || { current_day: 1, completed_days: [] },
        days: days || []
    }
}

export async function completePlanDay(day: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // 1. Verificar se é o dia atual ou anterior
    const { data: progress } = await supabase
        .from('user_plan_progress')
        .select('*')
        .eq('user_id', user.id)
        .single()

    if (!progress) return { success: false }

    // Atualiza
    // Adiciona ao array de completos se não estiver lá
    const completedSet = new Set(progress.completed_days || [])
    completedSet.add(day)

    const nextDay = day === progress.current_day ? day + 1 : progress.current_day

    const { error } = await supabase
        .from('user_plan_progress')
        .update({
            completed_days: Array.from(completedSet),
            current_day: nextDay,
            updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

    if (error) return { success: false }

    // DAR XP DE BÔNUS PELA JORNADA (Opcional, chama gamification Logic)
    // await grantXP(user.id, 50, 'Dia da Jornada Concluído')

    revalidatePath('/jornada')
    return { success: true }
}
