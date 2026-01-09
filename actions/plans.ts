'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type Plan = {
    id: string
    title: string
    description: string
    days_count: number
}

export type ActivePlan = {
    id: string
    plan: Plan
    current_day: number
    completed_days: number[]
    is_completed: boolean
}

export async function getAvailablePlans() {
    const supabase = await createClient()
    const { data } = await supabase.from('reading_plans').select('*').order('title')
    return data as Plan[] || []
}

export async function getUserActivePlan() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Pega o plano ativo mais recente (vamos assumir 1 ativo por vez para simplificar UI agora, ou listar todos)
    // Para MVP Journey Style: Retorna UM plano principal.
    const { data, error } = await supabase
        .from('user_active_plans')
        .select(`
            id,
            current_day,
            completed_days,
            is_completed,
            plan:reading_plans (*)
        `)
        .eq('user_id', user.id)
        .eq('is_completed', false) // Prioriza não completados
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

    if (error && error.code !== 'PGRST116') console.error(error) // PGRST116 é '0 rows' no .single()
    return data as ActivePlan | null
}

export async function getPlanDays(planId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('plan_days')
        .select('*')
        .eq('plan_id', planId)
        .order('day_number')

    return data || []
}

export async function startPlan(planId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // Verifica se já tem esse plano
    const { data: existing } = await supabase
        .from('user_active_plans')
        .select('id')
        .eq('user_id', user.id)
        .eq('plan_id', planId)
        .single()

    if (existing) return { success: true, message: "Plano retomado!" }

    const { error } = await supabase
        .from('user_active_plans')
        .insert({
            user_id: user.id,
            plan_id: planId,
            current_day: 1
        })

    if (error) return { success: false, message: "Erro ao iniciar plano." }

    revalidatePath('/jornada')
    return { success: true, message: "Jornada Iniciada!" }
}

export async function completePlanDay(planId: string, dayNumber: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // Busca o active plan correspondente
    const { data: active } = await supabase
        .from('user_active_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('plan_id', planId)
        .single()

    if (!active) return { success: false }

    const completedSet = new Set(active.completed_days || [])
    completedSet.add(dayNumber)

    // Calcula próximo dia
    const nextDay = Math.max(active.current_day, dayNumber + 1)

    // Verifica se completou o plano
    // Precisariamos saber o total de dias, mas vamos assumir que o frontend controla ou buscamos o count.
    // Vamos apenas atualizar o progresso.

    await supabase
        .from('user_active_plans')
        .update({
            completed_days: Array.from(completedSet),
            current_day: nextDay,
            updated_at: new Date().toISOString()
        })
        .eq('id', active.id)

    revalidatePath('/jornada')
    return { success: true }
}
